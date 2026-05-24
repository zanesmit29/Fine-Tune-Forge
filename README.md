# FineTuneForge

FineTuneForge is a web app for guided model fine-tuning. It lets users upload a CSV dataset, pick a task and base model, configure training, and then monitor the run, download artifacts, and review history.

## What it does

- Task-based wizard for:
  - Text Classification
  - Sentiment Analysis
  - Instruction Tuning
- CSV upload with automatic text/label column detection
- CPU or GPU training
- Training history with logs, metrics, cancel/retry, rename, and delete actions
- Export downloads for:
  - `model.pkl`
  - `model.onnx`
  - `model.gguf` for supported generative models
  - the generated Python training script
- Integrations for:
  - Hugging Face Hub
  - Modal A10G GPU compute

## Tech stack

- pnpm monorepo
- React + Vite + Tailwind
- Express 5 API server
- PostgreSQL + Drizzle ORM
- Zod / drizzle-zod validation
- Python training scripts using Transformers, PEFT, Datasets, Accelerate, and scikit-learn

## Repository layout

- `artifacts/finetuneforge/` — main React app
- `artifacts/api-server/` — Express API and training runner
- `artifacts/api-server/training/` — CPU and Modal training scripts
- `lib/` — shared API, DB, and generated client/schema packages
- `training/train.py` — standalone CPU trainer
- `screenshots/` — UI screenshots

## Requirements

- Node.js 24
- pnpm
- Python 3.11
- PostgreSQL

## Setup

```bash
corepack enable
corepack pnpm install
```

## Run

The frontend and API expect `PORT`-based hosting and a shared origin for `/api` requests. If you run them separately, proxy `/api` to the API server.

### API server

```bash
PORT=3001 DATABASE_URL=postgres://... corepack pnpm --filter @workspace/api-server dev
```

### Frontend

```bash
PORT=3000 BASE_PATH=/ corepack pnpm --filter @workspace/finetuneforge dev
```

## Environment variables

- `PORT` — required by both the API server and Vite app
- `BASE_PATH` — required by the Vite config
- `DATABASE_URL` — required by the API server
- `HF_TOKEN` — optional Hugging Face token for gated models
- `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` — optional Modal credentials for GPU training

## Training flow

1. Choose a task type.
2. Upload a CSV or use a template.
3. Pick a model and compute mode.
4. Configure epochs, learning rate, LoRA rank, and sequence length.
5. Start training and watch logs in the UI.
6. Download the finished model and generated script from history or the results page.

## Models

The API exposes models such as DistilBERT, BERT-Tiny, DeBERTa-v3-base, RoBERTa-base, GPT-2, Qwen 0.5B/1.5B/3B, Mistral-7B, and Llama-3.2-3B.

GPU-only models are rejected in CPU mode by the server.

## Storage

- CSV uploads: `uploads/`
- Training outputs: `results/{jobId}/`
- Job records: PostgreSQL table `training_jobs`

## Notes

- Integration credentials are kept in server memory only.
- The generated training script is saved with each completed run.
- `GET /api/jobs/:jobId/download/model` remains as a backward-compatible alias for the PKL export.
