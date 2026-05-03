import { Router, type IRouter } from "express";
import {
  ConnectHfBody,
  ConnectHfResponse,
  ConnectModalBody,
  ConnectModalResponse,
  DisconnectHfResponse,
  DisconnectModalResponse,
  GetHfStatusResponse,
  GetModalStatusResponse,
  TestHfConnectionResponse,
  TestModalConnectionResponse,
} from "@workspace/api-zod";
import {
  clearModalCreds,
  getModalCreds,
  getModalStatus,
  setModalCreds,
  verifyModalCredentials,
} from "../lib/modalSession";
import {
  clearHfCreds,
  getHfCreds,
  getHfStatus,
  setHfCreds,
  verifyHfToken,
} from "../lib/hfSession";

const router: IRouter = Router();

router.get("/integrations/modal/status", (_req, res): void => {
  res.json(GetModalStatusResponse.parse(getModalStatus()));
});

router.post("/integrations/modal", async (req, res): Promise<void> => {
  const parsed = ConnectModalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tokenId, tokenSecret } = parsed.data;

  if (!tokenId.startsWith("ak-")) {
    res.status(400).json({ error: "Modal Token ID must start with 'ak-'." });
    return;
  }

  const verification = await verifyModalCredentials(tokenId, tokenSecret);
  if (!verification.ok) {
    // Don't log the raw verifier message — it can echo upstream output.
    req.log.warn("Modal credentials rejected");
    res.status(401).json({
      error:
        verification.message ??
        "Modal rejected the provided credentials. Double-check your Token ID and Secret.",
    });
    return;
  }

  setModalCreds(tokenId, tokenSecret);
  res.json(ConnectModalResponse.parse(getModalStatus()));
});

router.delete("/integrations/modal", (_req, res): void => {
  clearModalCreds();
  res.json(DisconnectModalResponse.parse(getModalStatus()));
});

router.post("/integrations/modal/test", async (_req, res): Promise<void> => {
  const creds = getModalCreds();
  if (!creds) {
    res.status(401).json({ error: "Modal is not connected." });
    return;
  }
  const verification = await verifyModalCredentials(creds.tokenId, creds.tokenSecret);
  if (!verification.ok) {
    res.status(401).json({
      error: verification.message ?? "Modal rejected the stored credentials.",
    });
    return;
  }
  setModalCreds(creds.tokenId, creds.tokenSecret);
  res.json(TestModalConnectionResponse.parse(getModalStatus()));
});

// ---------------------------------------------------------------------------
// Hugging Face Hub
// ---------------------------------------------------------------------------

router.get("/integrations/hf/status", (_req, res): void => {
  res.json(GetHfStatusResponse.parse(getHfStatus()));
});

router.post("/integrations/hf", async (req, res): Promise<void> => {
  const parsed = ConnectHfBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const token = parsed.data.token.trim();

  if (!token.startsWith("hf_")) {
    res.status(400).json({
      error: "Hugging Face tokens start with 'hf_'. Double-check the value.",
    });
    return;
  }

  const verification = await verifyHfToken(token);
  if (!verification.ok || !verification.username) {
    req.log.warn("Hugging Face token rejected");
    res.status(401).json({
      error:
        verification.message ??
        "Hugging Face rejected the provided token. Make sure it has read access.",
    });
    return;
  }

  setHfCreds(token, verification.username);
  res.json(ConnectHfResponse.parse(getHfStatus()));
});

router.delete("/integrations/hf", (_req, res): void => {
  clearHfCreds();
  res.json(DisconnectHfResponse.parse(getHfStatus()));
});

router.post("/integrations/hf/test", async (_req, res): Promise<void> => {
  const creds = getHfCreds();
  if (!creds) {
    res.status(401).json({ error: "Hugging Face is not connected." });
    return;
  }
  const verification = await verifyHfToken(creds.token);
  if (!verification.ok || !verification.username) {
    res.status(401).json({
      error: verification.message ?? "Hugging Face rejected the stored token.",
    });
    return;
  }
  setHfCreds(creds.token, verification.username);
  res.json(TestHfConnectionResponse.parse(getHfStatus()));
});

export default router;
