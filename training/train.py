#!/usr/bin/env python3
"""
FineTuneForge Training Script
==============================
Runs a LoRA fine-tuning job using Hugging Face Transformers + PEFT on CPU.

Usage:
    python3 train.py --job-id <id> --model-id <model> --csv-path <path>
                     --text-column <col> --label-column <col>
                     --epochs <n> --lr <lr> --lora-rank <r>
                     --output-dir <dir>

NOTE: This file is kept byte-identical between `artifacts/api-server/training/`
(the copy the Express server actually spawns — see `runTraining` in
`src/routes/jobs.ts`) and the repo-root `training/` directory. Edit one and copy
it to the other so they never drift. Multi-format exports (ONNX/GGUF) require
`exports.py` to sit next to the running copy; when it does not, those exports are
skipped gracefully and only the `.pkl` artifact is produced.
"""

import argparse
import json
import os
import pickle
import sys
import time as _time
import warnings

# First line of output — proves the process is alive even before heavy imports.
print("[FineTuneForge] Python process started, loading ML libraries "
      "(typically 15-30s on first run)...", flush=True)
_t_boot = _time.time()

warnings.filterwarnings("ignore")

# Quiet down HF / transformers / datasets stderr noise so the user's job log
# stays readable. We turn off tqdm progress bars (they spam line-per-update)
# and lower the log level to errors only — actual problems still surface.
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("DATASETS_VERBOSITY", "error")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

# Optionally extend sys.path with an extra site-packages directory for
# environments where the ML libraries live outside the default interpreter
# path. This is configurable via the FTF_PYTHON_LIBS env var (e.g. a Replit
# `.pythonlibs/lib/python3.11/site-packages`). When it is unset we rely
# entirely on the ambient interpreter, so this script runs unmodified on any
# standard Linux box that has the ML deps installed in the default environment.
_extra_libs = os.environ.get("FTF_PYTHON_LIBS")
if _extra_libs and os.path.isdir(_extra_libs) and _extra_libs not in sys.path:
    sys.path.insert(0, _extra_libs)

import pandas as pd

try:
    import datasets as _hf_datasets
    _hf_datasets.disable_progress_bars()
except Exception:
    pass

try:
    import transformers as _hf_transformers
    _hf_transformers.logging.set_verbosity_error()
    _hf_transformers.utils.logging.disable_progress_bar()
except Exception:
    pass

print(f"[FineTuneForge] ML libraries ready ({_time.time() - _t_boot:.1f}s)",
      flush=True)

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
parser = argparse.ArgumentParser(description="FineTuneForge Training Script")
parser.add_argument("--job-id", required=True)
parser.add_argument("--model-id", required=True)
parser.add_argument("--csv-path", required=True)
parser.add_argument("--text-column", required=True)
parser.add_argument("--label-column", required=True)
parser.add_argument("--epochs", type=int, default=1)
parser.add_argument("--lr", type=float, default=2e-4)
parser.add_argument("--lora-rank", type=int, default=8)
parser.add_argument("--output-dir", required=True)
parser.add_argument("--task-type", default="classification",
                    choices=["classification", "sentiment", "instruction"],
                    help="Task type. 'classification' and 'sentiment' are both "
                         "trained as multi-class sequence classification; "
                         "'instruction' is accepted for forward compatibility "
                         "and additionally attempts a GGUF export.")
parser.add_argument("--max-seq-length", type=int, default=128,
                    help="Max token sequence length for tokenization.")
args = parser.parse_args()

# Sentiment analysis is multi-class classification, so it shares the entire
# code path below (sequence-classification head + SEQ_CLS LoRA). The task type
# only influences the GGUF export decision near the end of the script.

os.makedirs(args.output_dir, exist_ok=True)


def log(msg: str):
    """Print a log line and flush immediately."""
    print(msg, flush=True)


# Candidate attention-projection module name sets, by architecture family. The
# right names differ across architectures and PEFT raises ValueError if none of
# the requested modules exist in the model.
_TARGET_MODULE_CANDIDATES = (
    ["q_lin", "v_lin"],    # DistilBERT
    ["query", "value"],    # BERT / RoBERTa / DeBERTa / ALBERT / ELECTRA
    ["q_proj", "v_proj"],  # Qwen / Llama / Mistral and most modern decoders
    ["c_attn"],            # GPT-2 / DistilGPT-2 (fused QKV projection)
)


def get_target_modules(model_id: str, model=None) -> list:
    """Return LoRA target module names for a given model architecture.

    Detection is by model id first (cheap and reliable for known models). When
    the id is unrecognised we fall back to inspecting the model's actual leaf
    module names and pick the first candidate set that is present — this makes
    the trainer robust to architectures we haven't hard-coded.
    """
    mid = (model_id or "").lower()

    # Order matters: check the most specific substrings first (e.g. "distilbert"
    # contains "bert", "distilgpt2" contains "gpt2").
    if "distilbert" in mid:
        return ["q_lin", "v_lin"]
    if any(k in mid for k in ("roberta", "deberta", "albert", "electra", "bert")):
        return ["query", "value"]
    if any(k in mid for k in ("distilgpt2", "gpt2", "gpt-2")):
        return ["c_attn"]
    if any(k in mid for k in ("qwen", "llama", "mistral", "phi", "gemma", "falcon")):
        return ["q_proj", "v_proj"]

    # Unknown id — inspect the real module names and pick a candidate set whose
    # modules all exist in the model.
    if model is not None:
        leaf_names = {name.split(".")[-1] for name, _ in model.named_modules()}
        for candidate in _TARGET_MODULE_CANDIDATES:
            if all(c in leaf_names for c in candidate):
                return candidate

    # Last resort: the most common BERT-style naming.
    return ["query", "value"]


# ---------------------------------------------------------------------------
# Save a standalone training script to output dir for user download
# ---------------------------------------------------------------------------
def save_training_script():
    lora_rank_val = args.lora_rank
    lora_alpha_val = args.lora_rank * 2
    script_content = f'''#!/usr/bin/env python3
"""
FineTuneForge Generated Training Script
Model: {args.model_id}
Epochs: {args.epochs}
Learning Rate: {args.lr}
LoRA Rank: {args.lora_rank}
"""

import os, json, pickle, warnings
import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.preprocessing import LabelEncoder
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from peft import LoraConfig, get_peft_model, TaskType

warnings.filterwarnings("ignore")


def get_target_modules(model_id: str) -> list:
    mid = (model_id or "").lower()
    if "distilbert" in mid:
        return ["q_lin", "v_lin"]
    if any(k in mid for k in ("roberta", "deberta", "albert", "electra", "bert")):
        return ["query", "value"]
    if any(k in mid for k in ("distilgpt2", "gpt2", "gpt-2")):
        return ["c_attn"]
    if any(k in mid for k in ("qwen", "llama", "mistral", "phi", "gemma", "falcon")):
        return ["q_proj", "v_proj"]
    return ["query", "value"]


# ── Configuration ────────────────────────────────────────────────────────────
MODEL_ID      = "{args.model_id}"
CSV_PATH      = "{args.csv_path}"
TEXT_COLUMN   = "{args.text_column}"
LABEL_COLUMN  = "{args.label_column}"
NUM_EPOCHS    = {args.epochs}
LEARNING_RATE = {args.lr}
LORA_RANK     = {lora_rank_val}
OUTPUT_DIR    = "./output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Data loading ─────────────────────────────────────────────────────────────
print("[1/6] Loading dataset...")
try:
    df = pd.read_csv(CSV_PATH, encoding="utf-8")
except UnicodeDecodeError:
    df = pd.read_csv(CSV_PATH, encoding="latin-1")
df = df.dropna(subset=[TEXT_COLUMN, LABEL_COLUMN])
df[TEXT_COLUMN] = df[TEXT_COLUMN].astype(str)
label_encoder = LabelEncoder()
df["encoded_label"] = label_encoder.fit_transform(df[LABEL_COLUMN].astype(str))
num_labels = len(label_encoder.classes_)
print(f"  {{len(df)}} rows | {{num_labels}} classes: {{list(label_encoder.classes_)}}")

split_idx = max(1, int(len(df) * 0.8))
train_df = df.iloc[:split_idx].reset_index(drop=True)
eval_df  = df.iloc[split_idx:].reset_index(drop=True)
if len(eval_df) == 0:
    eval_df = train_df.copy()

# ── Tokenizer ────────────────────────────────────────────────────────────────
print("[2/6] Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

# ── Tokenize ─────────────────────────────────────────────────────────────────
print("[3/6] Tokenizing...")
def tokenize(batch):
    return tokenizer(batch[TEXT_COLUMN], truncation=True, padding="max_length", max_length=128)

train_dataset = Dataset.from_pandas(train_df[[TEXT_COLUMN, "encoded_label"]])
eval_dataset  = Dataset.from_pandas(eval_df[[TEXT_COLUMN, "encoded_label"]])
train_dataset = train_dataset.map(tokenize, batched=True).rename_column("encoded_label", "labels")
eval_dataset  = eval_dataset.map(tokenize, batched=True).rename_column("encoded_label", "labels")
train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
eval_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

# ── Model + LoRA ─────────────────────────────────────────────────────────────
print("[4/6] Loading model and applying LoRA...")
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_ID, num_labels=num_labels, ignore_mismatched_sizes=True,
)
if model.config.pad_token_id is None:
    model.config.pad_token_id = tokenizer.pad_token_id

lora_config = LoraConfig(
    task_type=TaskType.SEQ_CLS,
    r={lora_rank_val},
    lora_alpha={lora_alpha_val},
    lora_dropout=0.1,
    bias="none",
    target_modules=get_target_modules(MODEL_ID),
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# ── Training ─────────────────────────────────────────────────────────────────
print("[5/6] Training...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=NUM_EPOCHS,
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    learning_rate=LEARNING_RATE,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="no",
    logging_steps=5,
    use_cpu=True,
    report_to="none",
    disable_tqdm=True,
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {{"accuracy": float((preds == labels).mean())}}

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)

train_result = trainer.train()
eval_result  = trainer.evaluate()

# ── Save ─────────────────────────────────────────────────────────────────────
print("[6/6] Saving model and metrics...")
with open(os.path.join(OUTPUT_DIR, "model.pkl"), "wb") as f:
    pickle.dump({{
        "model_state_dict": model.state_dict(),
        "label_encoder_classes": label_encoder.classes_.tolist(),
        "model_id": MODEL_ID,
        "lora_rank": LORA_RANK,
        "num_labels": num_labels,
    }}, f)

train_loss = float(train_result.training_loss)
eval_loss  = float(eval_result.get("eval_loss", 0))
accuracy   = float(eval_result.get("eval_accuracy", 0))
metrics    = {{"train_loss": train_loss, "eval_loss": eval_loss, "accuracy": accuracy}}
with open(os.path.join(OUTPUT_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f)

print(f"  Train loss: {{train_loss:.4f}} | Eval loss: {{eval_loss:.4f}} | Accuracy: {{accuracy*100:.2f}}%")
print("Done!")
'''
    script_path = os.path.join(args.output_dir, "train_script.py")
    with open(script_path, "w") as f:
        f.write(script_content)


save_training_script()

# ---------------------------------------------------------------------------
# Actual training logic
# ---------------------------------------------------------------------------
try:
    log("[1/6] Loading dataset...")
    try:
        df = pd.read_csv(args.csv_path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(args.csv_path, encoding="latin-1")
    df = df.dropna(subset=[args.text_column, args.label_column])
    df[args.text_column] = df[args.text_column].astype(str)
    log(f"  Loaded {len(df)} rows from {os.path.basename(args.csv_path)}")

    from sklearn.preprocessing import LabelEncoder
    label_encoder = LabelEncoder()
    df["encoded_label"] = label_encoder.fit_transform(df[args.label_column].astype(str))
    num_labels = len(label_encoder.classes_)
    log(f"  Found {num_labels} classes: {list(label_encoder.classes_[:10])}")

    # 80/20 split — guarantee at least 1 row in each split
    split_idx = max(1, int(len(df) * 0.8))
    train_df = df.iloc[:split_idx].reset_index(drop=True)
    eval_df  = df.iloc[split_idx:].reset_index(drop=True)
    if len(eval_df) == 0:
        log("  Warning: dataset too small for a separate eval split — using train set for eval")
        eval_df = train_df.copy()
    log(f"  Train: {len(train_df)} samples | Eval: {len(eval_df)} samples")

    log("[2/6] Loading tokenizer...")
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"  # required for GPT-2 style seq classification
    log(f"  Tokenizer loaded: {args.model_id}")

    log("[3/6] Tokenizing dataset...")
    from datasets import Dataset

    def tokenize(batch):
        return tokenizer(
            batch[args.text_column],
            truncation=True,
            padding="max_length",
            max_length=args.max_seq_length,
        )

    train_dataset = Dataset.from_pandas(train_df[[args.text_column, "encoded_label"]])
    eval_dataset  = Dataset.from_pandas(eval_df[[args.text_column, "encoded_label"]])
    train_dataset = train_dataset.map(tokenize, batched=True)
    eval_dataset  = eval_dataset.map(tokenize, batched=True)
    train_dataset = train_dataset.rename_column("encoded_label", "labels")
    eval_dataset  = eval_dataset.rename_column("encoded_label", "labels")
    train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    eval_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    log("  Tokenization complete")

    log("[4/6] Loading base model and applying LoRA...")
    import torch
    from transformers import AutoModelForSequenceClassification
    from peft import LoraConfig, get_peft_model, TaskType

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_id,
        num_labels=num_labels,
        ignore_mismatched_sizes=True,
    )
    if model.config.pad_token_id is None:
        model.config.pad_token_id = tokenizer.pad_token_id

    target_modules = get_target_modules(args.model_id, model)
    log(f"  LoRA target modules: {target_modules}")
    lora_config = LoraConfig(
        task_type=TaskType.SEQ_CLS,
        r=args.lora_rank,
        lora_alpha=args.lora_rank * 2,
        lora_dropout=0.1,
        bias="none",
        target_modules=target_modules,
    )
    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total     = sum(p.numel() for p in model.parameters())
    log(f"  Trainable parameters: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")

    log("[5/6] Training...")
    from transformers import TrainingArguments, Trainer
    import numpy as np

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        learning_rate=args.lr,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="no",
        logging_steps=5,
        use_cpu=True,            # replaces deprecated no_cuda=True
        report_to="none",
        disable_tqdm=True,
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {"accuracy": float((preds == labels).mean())}

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        compute_metrics=compute_metrics,
    )

    train_result = trainer.train()
    log(f"  Training complete. Loss: {train_result.training_loss:.4f}")

    eval_result = trainer.evaluate()
    train_loss = float(train_result.training_loss)
    eval_loss  = float(eval_result.get("eval_loss", 0))
    accuracy   = float(eval_result.get("eval_accuracy", 0))

    # Per-epoch training loss, for the loss curve the UI plots.
    epoch_losses = [
        float(h["loss"]) for h in trainer.state.log_history if "loss" in h
    ]

    # Real per-class evaluation from the eval split (not estimated from the
    # accuracy scalar). Run inference on the eval set and score with sklearn.
    log("  Computing per-class metrics from eval split...")
    from sklearn.metrics import (
        confusion_matrix,
        precision_recall_fscore_support,
    )

    pred_output = trainer.predict(eval_dataset)
    y_true = np.asarray(pred_output.label_ids)
    y_pred = np.argmax(pred_output.predictions, axis=-1)
    label_indices = list(range(num_labels))
    class_names = label_encoder.classes_.tolist()

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=label_indices, average=None, zero_division=0,
    )
    per_class_metrics = [
        {
            "label": class_names[i],
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i in range(num_labels)
    ]
    macro_f1 = float(f1.mean()) if num_labels else 0.0
    weighted_f1 = float(
        precision_recall_fscore_support(
            y_true, y_pred, labels=label_indices, average="weighted",
            zero_division=0,
        )[2]
    )
    # Rows = true class, columns = predicted class, ordered by `classes`.
    conf_matrix = confusion_matrix(
        y_true, y_pred, labels=label_indices,
    ).tolist()
    log(f"  Macro F1: {macro_f1:.4f} | Weighted F1: {weighted_f1:.4f}")

    log("[6/6] Saving model and metrics...")
    model_path = os.path.join(args.output_dir, "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "model_state_dict": model.state_dict(),
            "label_encoder_classes": label_encoder.classes_.tolist(),
            "model_id": args.model_id,
            "lora_rank": args.lora_rank,
            "num_labels": num_labels,
        }, f)
    log(f"  Model saved → {model_path}")

    metrics = {
        # Existing keys the server/UI already read.
        "train_loss": train_loss,
        "eval_loss": eval_loss,
        "accuracy": accuracy,
        "epoch_losses": epoch_losses,
        # Real per-class evaluation computed with sklearn from the eval split.
        "classes": class_names,
        "per_class_metrics": per_class_metrics,
        # `confusion_matrix[i][j]` = # of eval examples with true class
        # `classes[i]` predicted as `classes[j]`.
        "confusion_matrix": conf_matrix,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
    }
    with open(os.path.join(args.output_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f)

    # -----------------------------------------------------------------------
    # Multi-format exports (best-effort). jobs.ts scans the output dir after
    # the process exits and reports `Exports — pkl:.. onnx:.. gguf:..` based on
    # which files exist, so producing the files here is what lights up the UI's
    # ONNX/GGUF download buttons.
    # -----------------------------------------------------------------------
    log("[FineTuneForge] Exporting additional formats...")
    try:
        from exports import export_gguf, export_onnx
    except ImportError as exc:
        export_onnx = export_gguf = None
        log(f"  [warn] export helpers unavailable, skipping ONNX/GGUF: {exc}")

    if export_onnx is not None:
        # ONNX is supported for every architecture we train.
        export_onnx(model, tokenizer, args.output_dir)

        # GGUF only makes sense for causal-LM / instruction models — llama.cpp's
        # converter explicitly rejects sequence-classification heads (BERT,
        # DistilBERT, RoBERTa, …). Skip with a clear reason for those.
        if args.task_type == "instruction":
            export_gguf(model, tokenizer, args.output_dir)
        else:
            log(
                "  GGUF export skipped: the llama.cpp converter does not support "
                f"sequence-classification heads ({args.task_type} task)."
            )

    log(f"[FineTuneForge] DONE — train_loss={train_loss:.4f} eval_loss={eval_loss:.4f} accuracy={accuracy*100:.2f}%")
    sys.exit(0)

except Exception as e:
    import traceback
    log(f"[ERROR] {str(e)}")
    log(traceback.format_exc())
    sys.exit(1)
