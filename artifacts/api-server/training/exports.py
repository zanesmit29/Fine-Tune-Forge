"""
FineTuneForge — Multi-format export helpers
============================================

Best-effort conversion of a fine-tuned PEFT/LoRA HuggingFace model into:
  - model.onnx  : torch.onnx.export with dummy (input_ids, attention_mask)
  - model.gguf  : llama.cpp's convert_hf_to_gguf.py (downloaded on first use)

Each function returns the absolute output path on success or None on failure
(failure is non-fatal — the existing .pkl export remains the primary output).
"""

from __future__ import annotations

import os
import subprocess
import sys
import urllib.request
from typing import Optional


_GGUF_CONVERT_URL = (
    "https://raw.githubusercontent.com/ggml-org/llama.cpp/b4615/"
    "convert_hf_to_gguf.py"
)
_GGUF_CONVERT_CACHE = os.path.join(
    os.path.expanduser("~"), ".cache", "finetuneforge", "convert_hf_to_gguf.py"
)


def _log(msg: str) -> None:
    print(msg, flush=True)


def export_onnx(model, tokenizer, output_dir: str) -> Optional[str]:
    """Export the (merged) model to ONNX. Returns path or None on failure."""
    try:
        import torch

        out_path = os.path.join(output_dir, "model.onnx")

        # Merge LoRA into base for a clean exportable graph.
        try:
            export_model = model.merge_and_unload()  # PEFT models
        except Exception:
            export_model = model
        export_model.eval()

        pad_id = getattr(tokenizer, "pad_token_id", 0) or 0
        dummy_input_ids = torch.full((1, 16), pad_id, dtype=torch.long)
        dummy_attention_mask = torch.ones((1, 16), dtype=torch.long)

        device = next(export_model.parameters()).device
        dummy_input_ids = dummy_input_ids.to(device)
        dummy_attention_mask = dummy_attention_mask.to(device)

        with torch.no_grad():
            torch.onnx.export(
                export_model,
                (dummy_input_ids, dummy_attention_mask),
                out_path,
                input_names=["input_ids", "attention_mask"],
                output_names=["logits"],
                dynamic_axes={
                    "input_ids": {0: "batch", 1: "seq"},
                    "attention_mask": {0: "batch", 1: "seq"},
                    "logits": {0: "batch"},
                },
                opset_version=17,
                do_constant_folding=True,
                dynamo=True,
            )

        # The dynamo exporter writes large weights to a sidecar `.onnx.data`
        # file. Inline them so the single `model.onnx` download is complete.
        # If inlining fails the artifact is incomplete — treat as failure
        # rather than serving a broken file via /download/onnx.
        sidecar = out_path + ".data"
        if os.path.exists(sidecar):
            try:
                import onnx  # type: ignore
                from onnx.external_data_helper import (  # type: ignore
                    load_external_data_for_model,
                )

                model_proto = onnx.load(out_path, load_external_data=False)
                load_external_data_for_model(model_proto, output_dir)
                onnx.save_model(model_proto, out_path, save_as_external_data=False)
                try:
                    os.remove(sidecar)
                except OSError:
                    pass
            except Exception as e:  # noqa: BLE001
                _log(f"  [warn] ONNX export skipped: weight inlining failed: {e}")
                for p in (out_path, sidecar):
                    try:
                        if os.path.exists(p):
                            os.remove(p)
                    except OSError:
                        pass
                return None

        _log(f"  ONNX export → {out_path}")
        return out_path
    except Exception as e:  # noqa: BLE001
        _log(f"  [warn] ONNX export skipped: {e}")
        return None


def _ensure_gguf_converter() -> Optional[str]:
    """Return path to convert_hf_to_gguf.py, downloading it once if missing."""
    if os.path.exists(_GGUF_CONVERT_CACHE):
        return _GGUF_CONVERT_CACHE
    try:
        os.makedirs(os.path.dirname(_GGUF_CONVERT_CACHE), exist_ok=True)
        _log("  Fetching convert_hf_to_gguf.py from llama.cpp...")
        urllib.request.urlretrieve(_GGUF_CONVERT_URL, _GGUF_CONVERT_CACHE)
        return _GGUF_CONVERT_CACHE
    except Exception as e:  # noqa: BLE001
        _log(f"  [warn] Could not download convert_hf_to_gguf.py: {e}")
        return None


def export_gguf(model, tokenizer, output_dir: str) -> Optional[str]:
    """Convert the merged HF model to GGUF via llama.cpp's converter.

    Most fine-tuned classification heads aren't supported by the converter;
    failure is expected for DistilBERT etc. and silently sets the path to None.
    """
    try:
        # Save merged model + tokenizer in HF format (required by converter).
        try:
            export_model = model.merge_and_unload()
        except Exception:
            export_model = model

        hf_dir = os.path.join(output_dir, "_hf_export")
        os.makedirs(hf_dir, exist_ok=True)
        export_model.save_pretrained(hf_dir, safe_serialization=True)
        try:
            tokenizer.save_pretrained(hf_dir)
        except Exception:
            pass

        script = _ensure_gguf_converter()
        if not script:
            return None

        out_path = os.path.join(output_dir, "model.gguf")
        cmd = [
            sys.executable,
            script,
            hf_dir,
            "--outfile", out_path,
            "--outtype", "f16",
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,
        )
        if result.returncode == 0 and os.path.exists(out_path):
            _log(f"  GGUF export → {out_path}")
            return out_path
        # Surface the reason the converter rejected this architecture.
        tail = (result.stderr or result.stdout or "").strip().splitlines()[-3:]
        _log(f"  [warn] GGUF export skipped: {' | '.join(tail)[:240]}")
        return None
    except Exception as e:  # noqa: BLE001
        _log(f"  [warn] GGUF export skipped: {e}")
        return None
