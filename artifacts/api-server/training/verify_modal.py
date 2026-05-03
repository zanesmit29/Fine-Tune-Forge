#!/usr/bin/env python3
"""Lightweight Modal credentials verifier.

Reads MODAL_TOKEN_ID and MODAL_TOKEN_SECRET from the environment and runs a
single low-cost Modal control-plane call to confirm the credentials are
accepted. Exits 0 on success, non-zero on any failure with a one-line reason
on stderr.
"""

import os
import sys


def main() -> int:
    token_id = os.environ.get("MODAL_TOKEN_ID", "").strip()
    token_secret = os.environ.get("MODAL_TOKEN_SECRET", "").strip()
    if not token_id or not token_secret:
        print("Missing MODAL_TOKEN_ID / MODAL_TOKEN_SECRET", file=sys.stderr)
        return 2

    try:
        import modal
        from modal.exception import AuthError, NotFoundError
    except ImportError as exc:
        print(f"modal package not installed: {exc}", file=sys.stderr)
        return 3

    try:
        # App.lookup hits the Modal control plane and authenticates. A
        # NotFoundError means auth worked but the probe app doesn't exist,
        # which is the expected outcome.
        modal.App.lookup(
            "finetuneforge-verify-probe",
            create_if_missing=False,
        )
    except AuthError as exc:
        print(f"Authentication failed: {exc}", file=sys.stderr)
        return 4
    except NotFoundError:
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"Modal verification failed: {exc}", file=sys.stderr)
        return 5

    return 0


if __name__ == "__main__":
    sys.exit(main())
