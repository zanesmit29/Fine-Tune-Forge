import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { clearHfCreds } from "../lib/hfSession";
import { clearModalCreds } from "../lib/modalSession";

const router: IRouter = Router();

function handleLogout(req: Request, res: Response): void {
  clearHfCreds();
  clearModalCreds();

  // The frontend "Sign out" link is a plain <a href="/api/logout"> (GET).
  // If the caller accepts HTML, redirect to the app root so the browser
  // navigates cleanly; otherwise return JSON for programmatic consumers.
  if (req.accepts("html")) {
    res.redirect("/");
  } else {
    res.json({ ok: true, message: "All integration credentials cleared." });
  }
}

router.get("/logout", handleLogout);
router.post("/logout", handleLogout);

export default router;
