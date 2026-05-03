#!/usr/bin/env python3
"""
FineTuneForge Training Script
==============================
Runs a LoRA fine-tuning job using Hugging Face Transformers + PEFT on CPU.

Supports two task families via --task-type:
  - classification / sentiment : sequence classification head
  - instruction                : causal LM with chat-template formatting,
                                 produces perplexity, sample inference and
                                 a GGUF export for LM Studio.
"""

import argparse
import json
import os
import pickle
import sys
import warnings

warnings.filterwarnings("ignore")

import pandas as pd

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
parser.add_argument(
    "--task-type",
    default="classification",
    choices=["classification", "sentiment", "instruction"],
)
parser.add_argument("--max-seq-length", type=int, default=256)
args = parser.parse_args()

os.makedirs(args.output_dir, exist_ok=True)


def log(msg: str):
    """Print a log line and flush immediately."""
    print(msg, flush=True)


def get_target_modules(model_id: str) -> list:
    """Return LoRA target module names for a given model architecture."""
    mid = model_id.lower()
    if "distilbert" in mid:
        return ["q_lin", "v_lin"]
    elif "qwen" in mid:
        return ["q_proj", "v_proj"]
    else:
        # GPT-2, DistilGPT-2 and most decoder-only models
        return ["c_attn"]


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
Task type: {args.task_type}
Epochs: {args.epochs}
Learning Rate: {args.lr}
LoRA Rank: {args.lora_rank}
"""

# Note: this is a reference script for downstream users. The actual training
# performed by FineTuneForge is run from train.py with --task-type
# {args.task_type}; for instruction tuning that branches into
# AutoModelForCausalLM with a chat-template formatter.

import os, json, pickle, warnings
import numpy as np
import pandas as pd
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

MODEL_ID      = "{args.model_id}"
CSV_PATH      = "{args.csv_path}"
TEXT_COLUMN   = "{args.text_column}"
LABEL_COLUMN  = "{args.label_column}"
NUM_EPOCHS    = {args.epochs}
LEARNING_RATE = {args.lr}
LORA_RANK     = {lora_rank_val}
LORA_ALPHA    = {lora_alpha_val}
OUTPUT_DIR    = "./output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

df = pd.read_csv(CSV_PATH).dropna(subset=[TEXT_COLUMN, LABEL_COLUMN])
le = LabelEncoder()
df["encoded_label"] = le.fit_transform(df[LABEL_COLUMN].astype(str))
ds = Dataset.from_pandas(df[[TEXT_COLUMN, "encoded_label"]])

tok = AutoTokenizer.from_pretrained(MODEL_ID)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token
ds = ds.map(lambda b: tok(b[TEXT_COLUMN], truncation=True,
                          padding="max_length", max_length=128), batched=True)
ds = ds.rename_column("encoded_label", "labels")
ds.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_ID, num_labels=len(le.classes_), ignore_mismatched_sizes=True)
model = get_peft_model(model, LoraConfig(
    task_type=TaskType.SEQ_CLS, r=LORA_RANK, lora_alpha=LORA_ALPHA))

Trainer(
    model=model,
    args=TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        learning_rate=LEARNING_RATE,
        use_cpu=True, report_to="none"),
    train_dataset=ds,
    eval_dataset=ds,
).train()
print("Done!")
'''
    script_path = os.path.join(args.output_dir, "train_script.py")
    with open(script_path, "w") as f:
        f.write(script_content)


save_training_script()


# ---------------------------------------------------------------------------
# Instruction-tuning branch (causal LM + chat template + GGUF export)
# ---------------------------------------------------------------------------
def run_instruction_tuning() -> int:
    """Causal LM fine-tuning on (instruction, response) pairs.

    Produces metrics.json with: train_loss, eval_loss, perplexity,
    epoch_losses, sample_instruction, sample_response. Saves model.pkl
    and a merged HF dir that exports.export_gguf converts to GGUF for
    LM Studio.
    """
    import math
    import torch
    from datasets import Dataset
    from transformers import (
        AutoTokenizer,
        AutoModelForCausalLM,
        TrainingArguments,
        Trainer,
        DataCollatorForLanguageModeling,
        TrainerCallback,
    )
    from peft import LoraConfig, get_peft_model, TaskType

    log("[1/6] Loading instruction dataset...")
    try:
        df = pd.read_csv(args.csv_path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(args.csv_path, encoding="latin-1")
    df = df.dropna(subset=[args.text_column, args.label_column])
    df[args.text_column] = df[args.text_column].astype(str)
    df[args.label_column] = df[args.label_column].astype(str)
    log(f"  Loaded {len(df)} instruction/response pairs")

    split_idx = max(1, int(len(df) * 0.8))
    train_df = df.iloc[:split_idx].reset_index(drop=True)
    eval_df = df.iloc[split_idx:].reset_index(drop=True)
    if len(eval_df) == 0:
        eval_df = train_df.copy()
    log(f"  Train: {len(train_df)} | Eval: {len(eval_df)}")

    log("[2/6] Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    log("[3/6] Formatting + tokenizing with chat template...")
    max_len = int(args.max_seq_length)

    def format_example(instruction: str, response: str) -> str:
        return (
            f"### Instruction:\n{instruction}\n\n"
            f"### Response:\n{response}{tokenizer.eos_token}"
        )

    def tokenize_row(row):
        text = format_example(row[args.text_column], row[args.label_column])
        toks = tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=max_len,
        )
        toks["labels"] = list(toks["input_ids"])
        return toks

    train_records = [tokenize_row(r) for _, r in train_df.iterrows()]
    eval_records = [tokenize_row(r) for _, r in eval_df.iterrows()]
    train_dataset = Dataset.from_list(train_records)
    eval_dataset = Dataset.from_list(eval_records)
    train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    eval_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

    log("[4/6] Loading base model + applying LoRA (causal LM)...")
    model = AutoModelForCausalLM.from_pretrained(args.model_id)
    if model.config.pad_token_id is None:
        model.config.pad_token_id = tokenizer.pad_token_id

    target_modules = get_target_modules(args.model_id)
    log(f"  LoRA target modules: {target_modules}")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_rank,
        lora_alpha=args.lora_rank * 2,
        lora_dropout=0.1,
        bias="none",
        target_modules=target_modules,
    )
    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    log(f"  Trainable: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")

    log("[5/6] Training (causal LM)...")
    epoch_losses: list[float] = []

    class EpochLossCallback(TrainerCallback):
        def on_epoch_end(self, _args, state, _control, **_kw):
            for entry in reversed(state.log_history):
                if "loss" in entry and "eval_loss" not in entry:
                    epoch_losses.append(float(entry["loss"]))
                    return

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=2,
        per_device_eval_batch_size=2,
        learning_rate=args.lr,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="no",
        logging_steps=2,
        use_cpu=True,
        report_to="none",
        disable_tqdm=True,
    )

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=data_collator,
        callbacks=[EpochLossCallback()],
    )

    train_result = trainer.train()
    log(f"  Training complete. Loss: {train_result.training_loss:.4f}")
    eval_result = trainer.evaluate()
    train_loss = float(train_result.training_loss)
    eval_loss = float(eval_result.get("eval_loss", 0.0))
    try:
        perplexity = float(math.exp(min(eval_loss, 20.0)))
    except OverflowError:
        perplexity = None

    if not epoch_losses:
        epoch_losses = [train_loss]

    log("[6/6] Sample inference + GGUF export...")
    sample_instruction = str(eval_df.iloc[0][args.text_column])
    sample_response = ""
    try:
        merged = model.merge_and_unload()
        merged.eval()
        prompt = f"### Instruction:\n{sample_instruction}\n\n### Response:\n"
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=max_len)
        with torch.no_grad():
            output = merged.generate(
                **inputs,
                max_new_tokens=80,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
            )
        decoded = tokenizer.decode(output[0], skip_special_tokens=True)
        sample_response = decoded.split("### Response:", 1)[-1].strip()
    except Exception as e:  # noqa: BLE001
        log(f"  [warn] sample generation skipped: {e}")
        merged = model

    model_path = os.path.join(args.output_dir, "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "model_state_dict": model.state_dict(),
            "model_id": args.model_id,
            "lora_rank": args.lora_rank,
            "task_type": "instruction",
        }, f)
    log(f"  Model saved → {model_path}")

    try:
        from exports import export_gguf  # type: ignore
        export_gguf(merged, tokenizer, args.output_dir)
    except Exception as e:  # noqa: BLE001
        log(f"  [warn] GGUF export skipped: {e}")

    metrics = {
        "train_loss": train_loss,
        "eval_loss": eval_loss,
        "perplexity": perplexity,
        "epoch_losses": epoch_losses,
        "sample_instruction": sample_instruction,
        "sample_response": sample_response,
    }
    with open(os.path.join(args.output_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f)

    pp_str = f"{perplexity:.2f}" if perplexity is not None else "n/a"
    log(
        f"[FineTuneForge] DONE — train_loss={train_loss:.4f} "
        f"eval_loss={eval_loss:.4f} perplexity={pp_str}"
    )
    return 0


if args.task_type == "instruction":
    try:
        sys.exit(run_instruction_tuning())
    except Exception as e:  # noqa: BLE001
        import traceback
        log(f"[ERROR] {str(e)}")
        log(traceback.format_exc())
        sys.exit(1)


# ---------------------------------------------------------------------------
# Classification / sentiment training (legacy path)
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

    split_idx = max(1, int(len(df) * 0.8))
    train_df = df.iloc[:split_idx].reset_index(drop=True)
    eval_df = df.iloc[split_idx:].reset_index(drop=True)
    if len(eval_df) == 0:
        log("  Warning: dataset too small for a separate eval split — using train set for eval")
        eval_df = train_df.copy()
    log(f"  Train: {len(train_df)} samples | Eval: {len(eval_df)} samples")

    log("[2/6] Loading tokenizer...")
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"
    log(f"  Tokenizer loaded: {args.model_id}")

    log("[3/6] Tokenizing dataset...")
    from datasets import Dataset

    def tokenize(batch):
        return tokenizer(
            batch[args.text_column],
            truncation=True,
            padding="max_length",
            max_length=128,
        )

    train_dataset = Dataset.from_pandas(train_df[[args.text_column, "encoded_label"]])
    eval_dataset = Dataset.from_pandas(eval_df[[args.text_column, "encoded_label"]])
    train_dataset = train_dataset.map(tokenize, batched=True, desc="Tokenizing train")
    eval_dataset = eval_dataset.map(tokenize, batched=True, desc="Tokenizing eval")
    train_dataset = train_dataset.rename_column("encoded_label", "labels")
    eval_dataset = eval_dataset.rename_column("encoded_label", "labels")
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

    target_modules = get_target_modules(args.model_id)
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
    total = sum(p.numel() for p in model.parameters())
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
        use_cpu=True,
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
    eval_loss = float(eval_result.get("eval_loss", 0))
    accuracy = float(eval_result.get("eval_accuracy", 0))

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

    metrics = {"train_loss": train_loss, "eval_loss": eval_loss, "accuracy": accuracy}
    with open(os.path.join(args.output_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f)

    log(f"[FineTuneForge] DONE — train_loss={train_loss:.4f} eval_loss={eval_loss:.4f} accuracy={accuracy*100:.2f}%")
    sys.exit(0)

except Exception as e:
    import traceback
    log(f"[ERROR] {str(e)}")
    log(traceback.format_exc())
    sys.exit(1)
