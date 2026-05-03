#!/usr/bin/env python3
"""
FineTuneForge Generated Training Script
Model: gpt2
Task type: instruction
Epochs: 1
Learning Rate: 0.0002
LoRA Rank: 4
"""

# Note: this is a reference script for downstream users. The actual training
# performed by FineTuneForge is run from train.py with --task-type
# instruction; for instruction tuning that branches into
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

MODEL_ID      = "gpt2"
CSV_PATH      = "/home/runner/workspace/artifacts/api-server/uploads/4239c4c8-9c46-4982-984e-2d3dea3c42b4.csv"
TEXT_COLUMN   = "instruction"
LABEL_COLUMN  = "response"
NUM_EPOCHS    = 1
LEARNING_RATE = 0.0002
LORA_RANK     = 4
LORA_ALPHA    = 8
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
