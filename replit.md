# FineTuneForge

## Overview

A web platform where non-technical users upload a CSV dataset, select a base model, configure fine-tuning via a guided UI, and receive a downloadable `.pkl` model file plus the full Python training code. Supports two compute backends: **Replit CPU** (HuggingFace transformers + PEFT/LoRA via `train.py` subprocess) and **Modal A10G GPU** (via `modal_trainer.py` using the Modal SDK).

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

### Python Training
Both trainers are spawned as a child process by the Express server, selected by `computeMode` on the job:
- **CPU** → `training/train.py` (LoRA + HuggingFace transformers, runs locally)
- **GPU** → `training/modal_trainer.py` (Modal app with `@app.function(gpu="A10G")`, streams logs via `app.run()` + `remote_gen()`. Requires `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` secrets.)

Both write `metrics.json`, `model.pkl`, and `train_script.py` into `results/{jobId}/`. PYTHONPATH must include `.pythonlibs`.

### Database Schema (lib/db/src/schema/jobs.ts)
- `training_jobs` table: stores job config, status, log lines (JSON), metrics, `compute_mode` ("cpu" | "gpu")

## File Storage
- CSV uploads: `uploads/` directory (relative to server cwd)
- Training results: `results/{jobId}/` directory

## Python Environment
Python packages are in `/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages`.
When spawning Python training processes, PYTHONPATH must include this path.

Available models (CPU + GPU unless noted):
- `distilbert-base-uncased` (66M, ~5min CPU / ~1min GPU)
- `gpt2` (117M, ~10min CPU / ~2min GPU)
- `Qwen/Qwen2.5-0.5B` (500M, ~25min CPU / ~3min GPU)
- `mistralai/Mistral-7B-v0.1` + LoRA (7B, **GPU only**, ~12min)
- `meta-llama/Llama-3.2-3B` + LoRA (3B, **GPU only**, ~7min)

Server-side `POST /api/jobs` enforces model/computeMode compatibility (rejects GPU-only models in CPU mode with HTTP 400).

## Multi-format Exports

After training completes, the server attempts to write three artifacts in `results/{jobId}/`:
- `model.pkl` — pickle of the LoRA-merged model state dict (always produced)
- `model.onnx` — `torch.onnx.export` with `dynamo=True`, opset 17, dummy `(input_ids, attention_mask)` inputs. The dynamo exporter writes weights to a sidecar `.onnx.data`; we post-process with `onnx.save_model(..., save_as_external_data=False)` so the download is a single self-contained file. Requires `onnx` + `onnxscript` Python packages.
- `model.gguf` — converted via llama.cpp's `convert_hf_to_gguf.py`, pinned to tag **b4615** (newer master commits add `mistral_common` / `GEMMA4` requirements that don't exist in `gguf 0.18.0`). Downloaded once into `~/.cache/finetuneforge/`. Requires `gguf` + `sentencepiece` Python packages. **Limitation:** the converter explicitly rejects classification heads (e.g. `DistilBertForSequenceClassification`); GGUF only succeeds for causal-LM architectures like GPT-2 / Llama / Qwen / Mistral. The route returns 404 with a tooltip-explained disabled button when unsupported.

Logic lives in `artifacts/api-server/training/exports.py` and is called from both `train.py` (CPU) and `modal_trainer.py` (GPU; GGUF skipped in remote worker). On training process exit, `jobs.ts` scans the results dir and stores the resolved paths in the new `pkl_path`, `onnx_path`, `gguf_path` columns. Download routes:
- `GET /api/jobs/:jobId/download/pkl` (alias: `/download/model`)
- `GET /api/jobs/:jobId/download/onnx`
- `GET /api/jobs/:jobId/download/gguf`

Each route validates the jobId via `GetJobParams` and additionally enforces `path.resolve(...)` is inside `RESULTS_DIR`. Returns 404 if the format isn't available. The Results step renders three side-by-side download buttons with monospace `PKL`/`ONNX`/`GGUF` badges and tooltips; unavailable formats are disabled with an explanatory tooltip.
