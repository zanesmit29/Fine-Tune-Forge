#!/usr/bin/env python3
"""
FineTuneForge Generated Training Script
Model: distilbert-base-uncased
Epochs: 1
Learning Rate: 0.0002
LoRA Rank: 4
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
    mid = model_id.lower()
    if "distilbert" in mid:
        return ["q_lin", "v_lin"]
    elif "qwen" in mid:
        return ["q_proj", "v_proj"]
    else:
        return ["c_attn"]


# ── Configuration ────────────────────────────────────────────────────────────
MODEL_ID      = "distilbert-base-uncased"
CSV_PATH      = "/home/runner/workspace/artifacts/api-server/uploads/e16d4605-d20d-4a49-b19f-e3999b5c7aa7.csv"
TEXT_COLUMN   = "v2"
LABEL_COLUMN  = "v1"
NUM_EPOCHS    = 1
LEARNING_RATE = 0.0002
LORA_RANK     = 4
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
print(f"  {len(df)} rows | {num_labels} classes: {list(label_encoder.classes_)}")

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
    r=4,
    lora_alpha=8,
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
    return {"accuracy": float((preds == labels).mean())}

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
    pickle.dump({
        "model_state_dict": model.state_dict(),
        "label_encoder_classes": label_encoder.classes_.tolist(),
        "model_id": MODEL_ID,
        "lora_rank": LORA_RANK,
        "num_labels": num_labels,
    }, f)

train_loss = float(train_result.training_loss)
eval_loss  = float(eval_result.get("eval_loss", 0))
accuracy   = float(eval_result.get("eval_accuracy", 0))
metrics    = {"train_loss": train_loss, "eval_loss": eval_loss, "accuracy": accuracy}
with open(os.path.join(OUTPUT_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f)

print(f"  Train loss: {train_loss:.4f} | Eval loss: {eval_loss:.4f} | Accuracy: {accuracy*100:.2f}%")
print("Done!")
