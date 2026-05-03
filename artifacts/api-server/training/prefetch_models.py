#!/usr/bin/env python3
"""
Pre-download default base models into a project-local HuggingFace cache so a
cold-start training job doesn't pay the 500MB+ download cost on first use.

Runs at build time. The cache directory is shipped inside the deploy image
and pointed to via HF_HOME at runtime (see api-server src/routes/jobs.ts).
"""
import os
import sys
import time

# Resolve cache dir relative to this script: artifacts/api-server/.hf-cache
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.abspath(os.path.join(HERE, "..", ".hf-cache"))
os.makedirs(CACHE_DIR, exist_ok=True)

os.environ["HF_HOME"] = CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = CACHE_DIR
os.environ["HF_HUB_CACHE"] = os.path.join(CACHE_DIR, "hub")
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# Models to pre-download. Keep this list small — every entry adds to image size.
MODELS = [m.strip() for m in os.environ.get("PREFETCH_MODELS", "gpt2").split(",") if m.strip()]


def prefetch(model_id: str) -> None:
    print(f"[prefetch] {model_id}: tokenizer...", flush=True)
    t = time.time()
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    AutoTokenizer.from_pretrained(model_id)
    print(f"[prefetch] {model_id}: tokenizer cached ({time.time() - t:.1f}s)", flush=True)

    t = time.time()
    print(f"[prefetch] {model_id}: model weights...", flush=True)
    AutoModelForSequenceClassification.from_pretrained(
        model_id, num_labels=2, ignore_mismatched_sizes=True
    )
    print(f"[prefetch] {model_id}: weights cached ({time.time() - t:.1f}s)", flush=True)


def main() -> int:
    print(f"[prefetch] HF cache dir: {CACHE_DIR}", flush=True)
    print(f"[prefetch] models: {MODELS}", flush=True)
    for model_id in MODELS:
        try:
            prefetch(model_id)
        except Exception as e:
            # Don't fail the build on prefetch errors — runtime will fall back
            # to lazy download. Log loud so it's visible in build logs.
            print(f"[prefetch] WARNING: failed to prefetch {model_id}: {e}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
