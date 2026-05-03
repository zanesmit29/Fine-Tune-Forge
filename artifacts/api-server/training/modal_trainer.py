#!/usr/bin/env python3
"""
FineTuneForge Modal GPU Trainer
================================
Runs a LoRA fine-tuning job on a Modal A10G GPU.

Local entrypoint matches the CLI of train.py so the Node /jobs runner can
spawn it the same way it spawns the CPU trainer. Logs are streamed back to
stdout (one line per print) and consumed by the Node process for SSE/log
polling.

Required Replit secrets:
  - MODAL_TOKEN_ID
  - MODAL_TOKEN_SECRET
"""

import argparse
import json
import os
import pickle
import sys
import warnings

warnings.filterwarnings("ignore")


def _log(msg: str) -> None:
    print(msg, flush=True)


# ---------------------------------------------------------------------------
# Argument parsing (matches train.py CLI)
# ---------------------------------------------------------------------------
parser = argparse.ArgumentParser(description="FineTuneForge Modal GPU Trainer")
parser.add_argument("--job-id", required=True)
parser.add_argument("--model-id", required=True)
parser.add_argument("--csv-path", required=True)
parser.add_argument("--text-column", required=True)
parser.add_argument("--label-column", required=True)
parser.add_argument("--epochs", type=int, default=1)
parser.add_argument("--lr", type=float, default=2e-4)
parser.add_argument("--lora-rank", type=int, default=8)
parser.add_argument("--output-dir", required=True)
args = parser.parse_args()

os.makedirs(args.output_dir, exist_ok=True)


# ---------------------------------------------------------------------------
# Modal app definition
# ---------------------------------------------------------------------------
try:
    import modal
except ImportError:
    _log("[ERROR] The 'modal' Python package is not installed. "
         "Run: uv pip install modal")
    sys.exit(1)


GPU_IMAGE = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.4.0",
        "transformers==4.44.2",
        "peft==0.12.0",
        "datasets==2.21.0",
        "accelerate==0.34.2",
        "scikit-learn==1.5.1",
        "pandas==2.2.2",
        "numpy<2.0",
    )
)

app = modal.App("finetuneforge-trainer", image=GPU_IMAGE)


def _get_target_modules(model_id: str) -> list:
    mid = model_id.lower()
    if "distilbert" in mid:
        return ["q_lin", "v_lin"]
    if "qwen" in mid or "mistral" in mid or "llama" in mid:
        return ["q_proj", "v_proj"]
    return ["c_attn"]


@app.function(gpu="A10G", timeout=60 * 60)
def train_remote(
    model_id: str,
    csv_bytes: bytes,
    text_column: str,
    label_column: str,
    epochs: int,
    learning_rate: float,
    lora_rank: int,
    hf_token: str = "",
):
    """Run LoRA fine-tuning on an A10G GPU and return model bytes + metrics.

    Yields log lines as strings so the local caller can stream them as SSE.
    The final yielded value is a dict {"__result__": {...}} carrying the
    pickled model bytes and metrics.
    """
    import io
    import os as _os
    import pickle as _pickle

    # Make the user's Hugging Face token available inside the Modal worker so
    # `transformers.from_pretrained` can authenticate and pull gated models.
    if hf_token:
        _os.environ["HF_TOKEN"] = hf_token
        _os.environ["HUGGING_FACE_HUB_TOKEN"] = hf_token

    import numpy as np
    import pandas as pd
    import torch
    from datasets import Dataset
    from sklearn.preprocessing import LabelEncoder
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )
    from peft import LoraConfig, TaskType, get_peft_model

    yield f"[modal] CUDA available: {torch.cuda.is_available()}"
    if torch.cuda.is_available():
        yield f"[modal] GPU: {torch.cuda.get_device_name(0)}"

    # -- Data ---------------------------------------------------------------
    yield "[1/6] Loading dataset..."
    try:
        df = pd.read_csv(io.BytesIO(csv_bytes), encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(csv_bytes), encoding="latin-1")
    df = df.dropna(subset=[text_column, label_column])
    df[text_column] = df[text_column].astype(str)

    label_encoder = LabelEncoder()
    df["encoded_label"] = label_encoder.fit_transform(df[label_column].astype(str))
    num_labels = len(label_encoder.classes_)
    yield f"  Loaded {len(df)} rows | {num_labels} classes"

    split_idx = max(1, int(len(df) * 0.8))
    train_df = df.iloc[:split_idx].reset_index(drop=True)
    eval_df = df.iloc[split_idx:].reset_index(drop=True)
    if len(eval_df) == 0:
        eval_df = train_df.copy()

    # -- Tokenizer ----------------------------------------------------------
    yield "[2/6] Loading tokenizer..."
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"

    yield "[3/6] Tokenizing dataset..."

    def tokenize(batch):
        return tokenizer(
            batch[text_column],
            truncation=True,
            padding="max_length",
            max_length=128,
        )

    train_dataset = Dataset.from_pandas(train_df[[text_column, "encoded_label"]])
    eval_dataset = Dataset.from_pandas(eval_df[[text_column, "encoded_label"]])
    train_dataset = train_dataset.map(tokenize, batched=True).rename_column(
        "encoded_label", "labels"
    )
    eval_dataset = eval_dataset.map(tokenize, batched=True).rename_column(
        "encoded_label", "labels"
    )
    train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    eval_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

    # -- Model + LoRA -------------------------------------------------------
    yield "[4/6] Loading base model and applying LoRA..."
    model = AutoModelForSequenceClassification.from_pretrained(
        model_id,
        num_labels=num_labels,
        ignore_mismatched_sizes=True,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    )
    if model.config.pad_token_id is None:
        model.config.pad_token_id = tokenizer.pad_token_id

    target_modules = _get_target_modules(model_id)
    yield f"  LoRA target modules: {target_modules}"
    lora_config = LoraConfig(
        task_type=TaskType.SEQ_CLS,
        r=lora_rank,
        lora_alpha=lora_rank * 2,
        lora_dropout=0.1,
        bias="none",
        target_modules=target_modules,
    )
    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    yield f"  Trainable parameters: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)"

    # -- Training -----------------------------------------------------------
    yield "[5/6] Training on A10G GPU..."
    training_args = TrainingArguments(
        output_dir="/tmp/ftf_output",
        num_train_epochs=epochs,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        learning_rate=learning_rate,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="no",
        logging_steps=5,
        report_to="none",
        disable_tqdm=True,
        fp16=torch.cuda.is_available(),
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
    yield f"  Training complete. Loss: {train_result.training_loss:.4f}"

    eval_result = trainer.evaluate()
    train_loss = float(train_result.training_loss)
    eval_loss = float(eval_result.get("eval_loss", 0))
    accuracy = float(eval_result.get("eval_accuracy", 0))

    # -- Save ---------------------------------------------------------------
    yield "[6/6] Serializing model..."
    buf = io.BytesIO()
    _pickle.dump(
        {
            "model_state_dict": {k: v.cpu() for k, v in model.state_dict().items()},
            "label_encoder_classes": label_encoder.classes_.tolist(),
            "model_id": model_id,
            "lora_rank": lora_rank,
            "num_labels": num_labels,
        },
        buf,
    )
    model_bytes = buf.getvalue()

    # -- Multi-format exports (best-effort) ---------------------------------
    yield "[FineTuneForge] Exporting additional formats..."

    onnx_bytes = None
    try:
        try:
            export_model = model.merge_and_unload()
        except Exception:
            export_model = model
        export_model.eval()
        cpu_model = export_model.to("cpu")
        pad_id = getattr(tokenizer, "pad_token_id", 0) or 0
        dummy_ids = torch.full((1, 16), pad_id, dtype=torch.long)
        dummy_mask = torch.ones((1, 16), dtype=torch.long)
        onnx_buf = io.BytesIO()
        with torch.no_grad():
            torch.onnx.export(
                cpu_model,
                (dummy_ids, dummy_mask),
                onnx_buf,
                input_names=["input_ids", "attention_mask"],
                output_names=["logits"],
                dynamic_axes={
                    "input_ids": {0: "batch", 1: "seq"},
                    "attention_mask": {0: "batch", 1: "seq"},
                    "logits": {0: "batch"},
                },
                opset_version=14,
                do_constant_folding=True,
                dynamo=False,
            )
        onnx_bytes = onnx_buf.getvalue()
        yield f"  ONNX export OK ({len(onnx_bytes)} bytes)"
    except Exception as e:  # noqa: BLE001
        yield f"  [warn] ONNX export skipped: {e}"

    # GGUF conversion is non-trivial inside the modal worker — skip and let
    # the local CPU side attempt it from the saved HF model if needed.
    yield (
        f"[FineTuneForge] DONE — train_loss={train_loss:.4f} "
        f"eval_loss={eval_loss:.4f} accuracy={accuracy*100:.2f}%"
    )

    yield {
        "__result__": {
            "model_bytes": model_bytes,
            "onnx_bytes": onnx_bytes,
            "metrics": {
                "train_loss": train_loss,
                "eval_loss": eval_loss,
                "accuracy": accuracy,
            },
        }
    }


# ---------------------------------------------------------------------------
# Local entrypoint (invoked by the Node spawn)
# ---------------------------------------------------------------------------
def main() -> int:
    if not os.environ.get("MODAL_TOKEN_ID") or not os.environ.get("MODAL_TOKEN_SECRET"):
        _log(
            "[ERROR] MODAL_TOKEN_ID / MODAL_TOKEN_SECRET are not set. "
            "Add them in Replit Secrets to use GPU training."
        )
        return 1

    if not os.path.exists(args.csv_path):
        _log(f"[ERROR] CSV not found at {args.csv_path}")
        return 1

    with open(args.csv_path, "rb") as f:
        csv_bytes = f.read()
    _log(f"[modal] Uploading {len(csv_bytes)} bytes of CSV to Modal...")

    result = None
    try:
        with app.run():
            for item in train_remote.remote_gen(
                args.model_id,
                csv_bytes,
                args.text_column,
                args.label_column,
                args.epochs,
                args.lr,
                args.lora_rank,
                os.environ.get("HF_TOKEN", ""),
            ):
                if isinstance(item, dict) and "__result__" in item:
                    result = item["__result__"]
                else:
                    _log(str(item))
    except Exception as e:  # noqa: BLE001
        import traceback

        _log(f"[ERROR] Modal run failed: {e}")
        _log(traceback.format_exc())
        return 1

    if result is None:
        _log("[ERROR] Modal run returned no result")
        return 1

    model_path = os.path.join(args.output_dir, "model.pkl")
    with open(model_path, "wb") as f:
        f.write(result["model_bytes"])
    _log(f"  Model saved → {model_path}")

    onnx_bytes = result.get("onnx_bytes")
    if onnx_bytes:
        onnx_path = os.path.join(args.output_dir, "model.onnx")
        with open(onnx_path, "wb") as f:
            f.write(onnx_bytes)
        _log(f"  ONNX saved → {onnx_path}")

    metrics_path = os.path.join(args.output_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(result["metrics"], f)

    # Write a placeholder train_script.py so the "View Script" download still
    # works for GPU jobs.
    script_path = os.path.join(args.output_dir, "train_script.py")
    with open(script_path, "w") as f:
        f.write(
            "# This job was trained on Modal A10G GPU.\n"
            "# See modal_trainer.py in the FineTuneForge repository for the\n"
            "# full Modal training function. The training configuration was:\n"
            f"#   model_id     = {args.model_id!r}\n"
            f"#   epochs       = {args.epochs}\n"
            f"#   learning_rate= {args.lr}\n"
            f"#   lora_rank    = {args.lora_rank}\n"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
