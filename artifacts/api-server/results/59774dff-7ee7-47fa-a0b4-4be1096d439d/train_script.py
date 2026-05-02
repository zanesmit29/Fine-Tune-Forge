#!/usr/bin/env python3
"""
FineTuneForge Generated Training Script
Model: distilbert-base-uncased
Epochs: 1
Learning Rate: 0.0002
LoRA Rank: 4
"""

import os
import warnings
import pandas as pd
import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from peft import LoraConfig, get_peft_model, TaskType
import pickle
import numpy as np
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

# ── Configuration ────────────────────────────────────────────────────────────
MODEL_ID = "distilbert-base-uncased"
CSV_PATH = "/home/runner/workspace/artifacts/api-server/uploads/1aed7657-ca63-41e6-959e-693acd4af11d.csv"
TEXT_COLUMN = "v2"
LABEL_COLUMN = "v1"
NUM_EPOCHS = 1
LEARNING_RATE = 0.0002
LORA_RANK = 4
OUTPUT_DIR = "./output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Data loading ─────────────────────────────────────────────────────────────
print("[1/6] Loading dataset...")
try:
    df = pd.read_csv(CSV_PATH, encoding="utf-8")
except UnicodeDecodeError:
    df = pd.read_csv(CSV_PATH, encoding="latin-1")
df = df.dropna(subset=[TEXT_COLUMN, LABEL_COLUMN])
df[TEXT_COLUMN] = df[TEXT_COLUMN].astype(str)

# Encode labels to integers
label_encoder = LabelEncoder()
df["encoded_label"] = label_encoder.fit_transform(df[LABEL_COLUMN].astype(str))
num_labels = len(label_encoder.classes_)
print(f"  Loaded {len(df)} rows | {num_labels} classes: {list(label_encoder.classes_)}")

# Train/eval split (80/20)
split_idx = int(len(df) * 0.8)
train_df = df.iloc[:split_idx].reset_index(drop=True)
eval_df = df.iloc[split_idx:].reset_index(drop=True)

# ── Tokenizer ────────────────────────────────────────────────────────────────
print("[2/6] Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

def tokenize(batch):
    return tokenizer(
        batch[TEXT_COLUMN],
        truncation=True,
        padding="max_length",
        max_length=128,
    )

train_dataset = Dataset.from_pandas(train_df[[TEXT_COLUMN, "encoded_label"]])
eval_dataset = Dataset.from_pandas(eval_df[[TEXT_COLUMN, "encoded_label"]])
train_dataset = train_dataset.map(tokenize, batched=True)
eval_dataset = eval_dataset.map(tokenize, batched=True)
train_dataset = train_dataset.rename_column("encoded_label", "labels")
eval_dataset = eval_dataset.rename_column("encoded_label", "labels")
train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
eval_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

# ── Model + LoRA ─────────────────────────────────────────────────────────────
print("[3/6] Loading base model and applying LoRA...")
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_ID,
    num_labels=num_labels,
    ignore_mismatched_sizes=True,
)
if model.config.pad_token_id is None:
    model.config.pad_token_id = tokenizer.pad_token_id

lora_config = LoraConfig(
    task_type=TaskType.SEQ_CLS,
    r=4,
    lora_alpha=8,
    lora_dropout=0.1,
    bias="none",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# ── Training ─────────────────────────────────────────────────────────────────
print("[4/6] Starting training...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=1,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    learning_rate=0.0002,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="no",
    logging_steps=10,
    no_cuda=True,
    report_to="none",
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    accuracy = (preds == labels).mean()
    return {"accuracy": float(accuracy)}

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)

train_result = trainer.train()
eval_result = trainer.evaluate()

# ── Save model ───────────────────────────────────────────────────────────────
print("[5/6] Saving fine-tuned model...")
model_path = os.path.join(OUTPUT_DIR, "model.pkl")
with open(model_path, "wb") as f:
    pickle.dump({
        "model_state_dict": model.state_dict(),
        "label_encoder_classes": label_encoder.classes_.tolist(),
        "model_id": MODEL_ID,
        "lora_rank": LORA_RANK,
        "num_labels": num_labels,
    }, f)

# ── Metrics ──────────────────────────────────────────────────────────────────
print("[6/6] Training complete!")
train_loss = train_result.training_loss
eval_loss = eval_result.get("eval_loss")
accuracy = eval_result.get("eval_accuracy")
print(f"  Train loss: {train_loss:.4f}")
if eval_loss: print(f"  Eval loss: {eval_loss:.4f}")
if accuracy: print(f"  Accuracy: {accuracy*100:.2f}%")

metrics = {
    "train_loss": train_loss,
    "eval_loss": eval_loss,
    "accuracy": accuracy,
}
with open(os.path.join(OUTPUT_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f)

print("Done!")
