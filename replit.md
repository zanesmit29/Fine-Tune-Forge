# FineTuneForge

## Overview

A web platform where non-technical users upload a CSV dataset, select a base model (DistilBERT, GPT-2, Qwen2.5-0.5B), configure fine-tuning via a guided UI, and receive a downloadable `.pkl` model file plus the full Python training code — running live using Hugging Face transformers + PEFT/LoRA on CPU.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (`artifacts/finetuneforge`)
- **API framework**: Express 5 (Node.js) (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Python ML**: transformers, peft, datasets, accelerate (in `.pythonlibs`)
- **Python packages location**: `/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

### Frontend (artifacts/finetuneforge)
- 4-step wizard: Model → Data → Config → Train
- `/` — Main wizard page
- `/history` — Training job history with stats

### API Server (artifacts/api-server)
Routes:
- `GET /api/models` — List available base models
- `POST /api/upload` — Upload CSV dataset (multipart/form-data, field: `file`)
- `GET /api/jobs` — List all training jobs
- `POST /api/jobs` — Create & start a training job (spawns Python subprocess)
- `GET /api/jobs/:jobId` — Get job status + metrics
- `GET /api/jobs/:jobId/logs` — Get training log lines
- `GET /api/jobs/stats/summary` — Aggregate stats
- `GET /api/jobs/:jobId/download/model` — Download `.pkl` model file
- `GET /api/jobs/:jobId/download/script` — Download generated `.py` training script

### Python Training (training/train.py)
- Spawned as a child process by the Express server
- Uses LoRA (PEFT) on top of HuggingFace base models
- Requires PYTHONPATH to include `.pythonlibs`
- Writes metrics to `results/{jobId}/metrics.json`
- Saves model to `results/{jobId}/model.pkl`
- Saves training script to `results/{jobId}/train_script.py`

### Database Schema (lib/db/src/schema/jobs.ts)
- `training_jobs` table: stores job config, status, log lines (JSON), metrics

## File Storage
- CSV uploads: `uploads/` directory (relative to server cwd)
- Training results: `results/{jobId}/` directory

## Python Environment
Python packages are in `/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages`.
When spawning Python training processes, PYTHONPATH must include this path.

Available models:
- `distilbert-base-uncased` (66M params, ~5min)
- `gpt2` (117M params, ~10min)
- `Qwen/Qwen2.5-0.5B` (500M params, ~25min)
- `distilgpt2` (82M params, ~8min)
