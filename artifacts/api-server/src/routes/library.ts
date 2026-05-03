import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { db, trainingJobsTable } from "@workspace/db";
import {
  ListTrainedModelsResponse,
  RenameTrainedModelResponse,
  RenameTrainedModelBody,
  RenameTrainedModelParams,
  DeleteTrainedModelParams,
} from "@workspace/api-zod";
import { formatJob } from "./jobs";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const RESULTS_DIR = path.join(process.cwd(), "results");

router.get("/trained-models", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.status, "completed"))
    .orderBy(desc(trainingJobsTable.createdAt));
  res.json(ListTrainedModelsResponse.parse(rows.map(formatJob)));
});

router.patch("/trained-models/:jobId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = RenameTrainedModelParams.safeParse({ jobId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = RenameTrainedModelBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select({ status: trainingJobsTable.status })
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.id, params.data.jobId));

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (existing.status !== "completed") {
    res.status(400).json({ error: "Only completed trained models can be renamed." });
    return;
  }

  const [updated] = await db
    .update(trainingJobsTable)
    .set({ nickname: body.data.nickname })
    .where(eq(trainingJobsTable.id, params.data.jobId))
    .returning();

  res.json(RenameTrainedModelResponse.parse(formatJob(updated)));
});

router.delete("/trained-models/:jobId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = DeleteTrainedModelParams.safeParse({ jobId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.id, params.data.jobId));

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (existing.status !== "completed") {
    res.status(400).json({ error: "Only completed trained models can be deleted." });
    return;
  }

  // Remove on-disk artifacts (defense-in-depth path check)
  const outputDir = path.join(RESULTS_DIR, params.data.jobId);
  const resolved = path.resolve(outputDir);
  if (resolved.startsWith(path.resolve(RESULTS_DIR) + path.sep) && fs.existsSync(resolved)) {
    try {
      fs.rmSync(resolved, { recursive: true, force: true });
    } catch (err) {
      logger.warn({ err, jobId: params.data.jobId }, "Failed to remove model files");
    }
  }

  await db.delete(trainingJobsTable).where(eq(trainingJobsTable.id, params.data.jobId));
  res.status(204).send();
});

export default router;
