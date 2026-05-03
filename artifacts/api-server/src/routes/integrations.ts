import { Router, type IRouter } from "express";
import {
  ConnectModalBody,
  ConnectModalResponse,
  DisconnectModalResponse,
  GetModalStatusResponse,
  TestModalConnectionResponse,
} from "@workspace/api-zod";
import {
  clearModalCreds,
  getModalCreds,
  getModalStatus,
  setModalCreds,
  verifyModalCredentials,
} from "../lib/modalSession";

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

export default router;
