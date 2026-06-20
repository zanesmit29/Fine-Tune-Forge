import { spawn } from "child_process";
import path from "path";

export interface ModalCredentials {
  tokenId: string;
  tokenSecret: string;
  verifiedAt: Date;
}

// Intentionally process-global, in-memory, single-workspace state.
// Credentials are cleared on logout (POST/GET /api/logout) or server restart.
// A multi-user/multi-instance deployment would need a session store instead.
let creds: ModalCredentials | null = null;

export function getModalCreds(): ModalCredentials | null {
  return creds;
}

export function clearModalCreds(): void {
  creds = null;
}

export function setModalCreds(tokenId: string, tokenSecret: string): ModalCredentials {
  creds = { tokenId, tokenSecret, verifiedAt: new Date() };
  return creds;
}

export function maskTokenId(tokenId: string): string {
  const tail = tokenId.slice(-4);
  return `ak-••••••••${tail}`;
}

export interface ModalStatus {
  connected: boolean;
  maskedTokenId: string | null;
  verifiedAt: string | null;
}

export function getModalStatus(): ModalStatus {
  if (!creds) {
    return { connected: false, maskedTokenId: null, verifiedAt: null };
  }
  return {
    connected: true,
    maskedTokenId: maskTokenId(creds.tokenId),
    verifiedAt: creds.verifiedAt.toISOString(),
  };
}

export interface VerifyResult {
  ok: boolean;
  /** Stderr message captured from the verifier when ok is false. */
  message?: string;
}

const PYTHON_LIBS = "/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages";
const VERIFY_SCRIPT = path.join(__dirname, "..", "training", "verify_modal.py");
const VERIFY_TIMEOUT_MS = 30_000;

export function verifyModalCredentials(
  tokenId: string,
  tokenSecret: string,
): Promise<VerifyResult> {
  return new Promise((resolve) => {
    const existingPythonPath = process.env.PYTHONPATH ?? "";
    const pythonPath = existingPythonPath
      ? `${PYTHON_LIBS}:${existingPythonPath}`
      : PYTHON_LIBS;

    const proc = spawn("python3", [VERIFY_SCRIPT], {
      env: {
        ...process.env,
        MODAL_TOKEN_ID: tokenId,
        MODAL_TOKEN_SECRET: tokenSecret,
        PYTHONPATH: pythonPath,
      },
    });

    let stderr = "";
    let settled = false;
    const finish = (result: VerifyResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });
    proc.stdout.on("data", () => {
      // Discarded — the verifier only emits on stderr.
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      finish({ ok: false, message: "Verification timed out after 30s" });
    }, VERIFY_TIMEOUT_MS);

    proc.on("error", (err) => {
      finish({ ok: false, message: err.message });
    });

    proc.on("close", (code) => {
      if (code === 0) {
        finish({ ok: true });
      } else {
        finish({
          ok: false,
          message: stderr.trim() || `Verifier exited with code ${code}`,
        });
      }
    });
  });
}
