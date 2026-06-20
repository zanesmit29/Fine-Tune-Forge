export interface HfCredentials {
  token: string;
  username: string;
  verifiedAt: Date;
}

// Intentionally process-global, in-memory, single-workspace state.
// Credentials are cleared on logout (POST/GET /api/logout) or server restart.
// A multi-user/multi-instance deployment would need a session store instead.
let creds: HfCredentials | null = null;

export function getHfCreds(): HfCredentials | null {
  return creds;
}

export function clearHfCreds(): void {
  creds = null;
}

export function setHfCreds(token: string, username: string): HfCredentials {
  creds = { token, username, verifiedAt: new Date() };
  return creds;
}

export function maskHfToken(token: string): string {
  // HF tokens look like "hf_aBcDeFg..." — keep prefix + last 4 chars.
  const prefix = token.startsWith("hf_") ? "hf_" : "";
  const tail = token.slice(-4);
  return `${prefix}••••••••${tail}`;
}

export interface HfStatus {
  connected: boolean;
  maskedToken: string | null;
  username: string | null;
  verifiedAt: string | null;
}

export function getHfStatus(): HfStatus {
  if (!creds) {
    return {
      connected: false,
      maskedToken: null,
      username: null,
      verifiedAt: null,
    };
  }
  return {
    connected: true,
    maskedToken: maskHfToken(creds.token),
    username: creds.username,
    verifiedAt: creds.verifiedAt.toISOString(),
  };
}

export interface VerifyResult {
  ok: boolean;
  /** When ok=true, the HF Hub username for the token. */
  username?: string;
  /** When ok=false, a human-readable reason. */
  message?: string;
}

const VERIFY_TIMEOUT_MS = 10_000;

/**
 * Verify a Hugging Face token by calling the public whoami-v2 endpoint.
 * Returns the username on success.
 */
export async function verifyHfToken(token: string): Promise<VerifyResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const res = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Hugging Face rejected the token." };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: `Hugging Face Hub returned ${res.status}.`,
      };
    }
    const body = (await res.json()) as { name?: string; type?: string };
    if (!body?.name) {
      return { ok: false, message: "Unexpected response from Hugging Face Hub." };
    }
    return { ok: true, username: body.name };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, message: "Verification timed out after 10s." };
    }
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to reach Hugging Face Hub.",
    };
  } finally {
    clearTimeout(timer);
  }
}
