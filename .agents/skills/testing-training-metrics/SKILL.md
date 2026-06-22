---
name: testing-training-metrics
description: Test the training metrics flow end-to-end (per-class F1, confusion matrix) in FineTuneForge. Use when verifying metrics UI, API response, or DB persistence changes.
---

# Testing Training Metrics End-to-End

## Overview
FineTuneForge has a wizard UI that runs ML training jobs and displays results including per-class F1 scores and a confusion matrix. This skill covers testing the full flow from training through to UI rendering.

## Prerequisites

### Servers
1. **PostgreSQL**: `docker start ftf-postgres` (or create with `docker run -d --name ftf-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finetuneforge -p 5432:5432 postgres:16`)
2. **API server** (port 3001): `cd artifacts/api-server && DATABASE_URL=postgres://postgres:postgres@localhost:5432/finetuneforge PORT=3001 node dist/index.mjs`
   - If `dist/` doesn't exist, build first: `corepack pnpm --filter @workspace/api-server run build`
   - First startup may download model tokenizers (~30s)
3. **Frontend** (port 3000): `PORT=3000 BASE_PATH=/ API_PROXY_TARGET=http://localhost:3001 corepack pnpm --filter @workspace/finetuneforge run dev`

### Python ML Dependencies (CPU)
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install "transformers==4.46.3" "peft==0.13.2" "datasets==3.1.0" "accelerate==1.1.1" "scikit-learn==1.5.2" onnx
```

### DB Schema Push
After schema changes: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/finetuneforge corepack pnpm --filter @workspace/db run push`

## Devin Secrets Needed
None required for local testing.

## Testing via Wizard UI

### Navigation Path
1. Go to `http://localhost:3000/app` (not `/` which is the landing page)
2. Click a task type card (e.g., "Text Classification")
3. Step 1 (Model): Select "BERT-Tiny" (fastest, ~2min CPU)
4. Step 2 (Data): Click "Use template" on "Customer Support Tickets" (5-class, 200 rows)
5. Step 3 (Config): Leave defaults (CPU, 3 epochs, lr=0.0002, LoRA rank 8), click "Start Training"
6. Step 4 (Train): Wait ~15-30s for training to complete, results panel appears below

### Key Assertions for Metrics
- **Per-Class F1 heading**: Should read "Per-Class F1" (not "Per-Class F1 (estimated)")
- **No "Estimated" caption**: The page should not contain "Estimated from final accuracy and class distribution"
- **Non-symmetric confusion matrix**: A real matrix will have asymmetric off-diagonal values (e.g., cm[i][j] != cm[j][i] for some pairs). A fabricated matrix would be symmetric.
- **F1 variation**: Real F1 scores show genuine spread (e.g., 0.00 to 0.80). Fabricated scores cluster near accuracy with tiny jitter.
- **All classes present**: Both panels should show all class labels from the dataset

### Cross-Checking API
After training completes, verify the API response matches the UI:
```bash
curl -s http://localhost:3001/api/jobs/<JOB_ID> | python3 -c "
import sys,json
j=json.load(sys.stdin)
print('classes:', j.get('classes'))
print('confusionMatrix:', j.get('confusionMatrix'))
print('perClassMetrics:', j.get('perClassMetrics'))
print('macroF1:', j.get('macroF1'), 'weightedF1:', j.get('weightedF1'))
"
```

## Testing via CLI (Faster, No UI)
```bash
python3 artifacts/api-server/training/train.py \
  --job-id smoke --model-id prajjwal1/bert-tiny \
  --csv-path artifacts/finetuneforge/public/templates/customer_support.csv \
  --text-column text --label-column category \
  --epochs 3 --lr 2e-4 --lora-rank 8 \
  --output-dir /tmp/smoke --task-type classification
cat /tmp/smoke/metrics.json
```
Then verify `metrics.json` contains `classes`, `per_class_metrics`, `confusion_matrix`, `macro_f1`, `weighted_f1`.

## Common Issues
- The landing page (`/`) has a task selector widget that looks like the wizard but the "Continue" button might not navigate. Always use `/app` for the actual wizard.
- The vite dev server requires `PORT`, `BASE_PATH`, and `API_PROXY_TARGET` env vars or it will fail to start.
- The API server build (`pnpm run build`) for the frontend requires `PORT=3000 BASE_PATH=/ API_PROXY_TARGET=http://localhost:3001` env vars.
- The confusion matrix table may be horizontally scrollable if there are many classes. Scroll right to see all columns.
- First API server startup downloads model tokenizers which takes ~30s. Subsequent starts are fast.
