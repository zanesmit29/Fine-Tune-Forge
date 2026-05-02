import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { eq, desc, avg, count, sql } from "drizzle-orm";
import { db, trainingJobsTable } from "@workspace/db";
import {
  CreateJobBody,
  GetJobParams,
  GetJobLogsParams,
  ListJobsResponse,
  GetJobResponse,
  GetJobLogsResponse,
  GetJobStatsResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const RESULTS_DIR = path.join(process.cwd(), "results");
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function formatJob(row: typeof trainingJobsTable.$inferSelect) {
  return {
    id: row.id,
    modelId: row.modelId,
    modelName: row.modelName,
    datasetId: row.datasetId,
    textColumn: row.textColumn,
    labelColumn: row.labelColumn,
    epochs: row.epochs,
    learningRate: row.learningRate,
    loraRank: row.loraRank,
    status: row.status as "queued" | "running" | "completed" | "failed",
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    trainLoss: row.trainLoss ?? null,
    evalLoss: row.evalLoss ?? null,
    accuracy: row.accuracy ?? null,
    errorMessage: row.errorMessage ?? null,
  };
}

async function appendLog(jobId: string, line: string) {
  const [job] = await db
    .select({ logLines: trainingJobsTable.logLines })
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.id, jobId));
  if (!job) return;
  const lines: string[] = JSON.parse(job.logLines);
  lines.push(line);
  await db
    .update(trainingJobsTable)
    .set({ logLines: JSON.stringify(lines) })
    .where(eq(trainingJobsTable.id, jobId));
}

async function runTraining(jobId: string, body: typeof CreateJobBody._type) {
  await db
    .update(trainingJobsTable)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(trainingJobsTable.id, jobId));

  const csvPath = path.join(UPLOAD_DIR, `${body.datasetId}.csv`);
  const outputDir = path.join(RESULTS_DIR, jobId);

  const pythonScript = path.join(__dirname, "..", "training", "train.py");

  const args = [
    pythonScript,
    "--job-id", jobId,
    "--model-id", body.modelId,
    "--csv-path", csvPath,
    "--text-column", body.textColumn,
    "--label-column", body.labelColumn,
    "--epochs", String(body.epochs),
    "--lr", String(body.learningRate),
    "--lora-rank", String(body.loraRank),
    "--output-dir", outputDir,
  ];

  await appendLog(jobId, `[FineTuneForge] Starting training job ${jobId}`);
  await appendLog(jobId, `[FineTuneForge] Model: ${body.modelId}`);
  await appendLog(jobId, `[FineTuneForge] Dataset: ${body.datasetId}.csv`);
  await appendLog(jobId, `[FineTuneForge] Config: epochs=${body.epochs}, lr=${body.learningRate}, lora_rank=${body.loraRank}`);
  await appendLog(jobId, `[FineTuneForge] Spawning Python training process...`);

  const pythonLibs = "/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages";
  const existingPythonPath = process.env.PYTHONPATH ?? "";
  const pythonPath = existingPythonPath
    ? `${pythonLibs}:${existingPythonPath}`
    : pythonLibs;

  const proc = spawn("python3", args, {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      PYTHONPATH: pythonPath,
    },
  });

  proc.stdout.on("data", async (chunk: Buffer) => {
    const text = chunk.toString("utf-8").trim();
    for (const line of text.split("\n")) {
      if (line.trim()) {
        await appendLog(jobId, line);
      }
    }
  });

  proc.stderr.on("data", async (chunk: Buffer) => {
    const text = chunk.toString("utf-8").trim();
    for (const line of text.split("\n")) {
      if (line.trim()) {
        await appendLog(jobId, `[WARN] ${line}`);
      }
    }
  });

  proc.on("close", async (code) => {
    if (code === 0) {
      const resultsFile = path.join(outputDir, "metrics.json");
      let trainLoss: number | null = null;
      let evalLoss: number | null = null;
      let accuracy: number | null = null;

      if (fs.existsSync(resultsFile)) {
        try {
          const metrics = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
          trainLoss = metrics.train_loss ?? null;
          evalLoss = metrics.eval_loss ?? null;
          accuracy = metrics.accuracy ?? null;
        } catch {
          logger.warn({ jobId }, "Failed to read metrics file");
        }
      }

      await appendLog(jobId, `[FineTuneForge] Training completed successfully!`);
      if (trainLoss !== null) await appendLog(jobId, `[FineTuneForge] Final train loss: ${trainLoss.toFixed(4)}`);
      if (evalLoss !== null) await appendLog(jobId, `[FineTuneForge] Final eval loss: ${evalLoss.toFixed(4)}`);
      if (accuracy !== null) await appendLog(jobId, `[FineTuneForge] Accuracy: ${(accuracy * 100).toFixed(2)}%`);

      await db
        .update(trainingJobsTable)
        .set({
          status: "completed",
          completedAt: new Date(),
          trainLoss,
          evalLoss,
          accuracy,
        })
        .where(eq(trainingJobsTable.id, jobId));
    } else {
      await appendLog(jobId, `[FineTuneForge] Training failed with exit code ${code}`);
      await db
        .update(trainingJobsTable)
        .set({
          status: "failed",
          completedAt: new Date(),
          errorMessage: `Process exited with code ${code}`,
        })
        .where(eq(trainingJobsTable.id, jobId));
    }
    logger.info({ jobId, code }, "Training process finished");
  });

  proc.on("error", async (err) => {
    const msg = err.message;
    await appendLog(jobId, `[ERROR] Failed to start training: ${msg}`);
    await db
      .update(trainingJobsTable)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: msg,
      })
      .where(eq(trainingJobsTable.id, jobId));
  });
}

router.get("/jobs/stats/summary", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      status: trainingJobsTable.status,
      count: count(),
    })
    .from(trainingJobsTable)
    .groupBy(trainingJobsTable.status);

  const avgRow = await db
    .select({ avg: avg(trainingJobsTable.trainLoss) })
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.status, "completed"));

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  const completed = Number(rows.find((r) => r.status === "completed")?.count ?? 0);
  const running = Number(rows.find((r) => r.status === "running")?.count ?? 0);
  const failed = Number(rows.find((r) => r.status === "failed")?.count ?? 0);
  const avgTrainLoss = avgRow[0]?.avg ? Number(avgRow[0].avg) : null;

  res.json(GetJobStatsResponse.parse({ total, completed, running, failed, avgTrainLoss }));
});

router.get("/jobs", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(trainingJobsTable)
    .orderBy(desc(trainingJobsTable.createdAt));
  res.json(ListJobsResponse.parse(rows.map(formatJob)));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const body = parsed.data;
  const csvPath = path.join(UPLOAD_DIR, `${body.datasetId}.csv`);
  if (!fs.existsSync(csvPath)) {
    res.status(400).json({ error: "Dataset not found. Please re-upload your CSV." });
    return;
  }

  const MODEL_NAMES: Record<string, string> = {
    "distilbert-base-uncased": "DistilBERT",
    "gpt2": "GPT-2 Small",
    "Qwen/Qwen2.5-0.5B": "Qwen2.5-0.5B",
    "distilgpt2": "DistilGPT-2",
  };

  const jobId = randomUUID();
  const [job] = await db
    .insert(trainingJobsTable)
    .values({
      id: jobId,
      modelId: body.modelId,
      modelName: MODEL_NAMES[body.modelId] ?? body.modelId,
      datasetId: body.datasetId,
      textColumn: body.textColumn,
      labelColumn: body.labelColumn,
      epochs: body.epochs,
      learningRate: body.learningRate,
      loraRank: body.loraRank,
      status: "queued",
      logLines: "[]",
    })
    .returning();

  runTraining(jobId, body).catch((err) => {
    logger.error({ err, jobId }, "Unhandled error in training runner");
  });

  res.status(201).json(GetJobResponse.parse(formatJob(job)));
});

router.get("/jobs/:jobId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetJobParams.safeParse({ jobId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.id, params.data.jobId));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(GetJobResponse.parse(formatJob(job)));
});

router.get("/jobs/:jobId/logs", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetJobLogsParams.safeParse({ jobId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select({ logLines: trainingJobsTable.logLines, status: trainingJobsTable.status })
    .from(trainingJobsTable)
    .where(eq(trainingJobsTable.id, params.data.jobId));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const lines: string[] = JSON.parse(job.logLines);
  res.json(GetJobLogsResponse.parse({ jobId: params.data.jobId, lines, status: job.status }));
});

router.get("/jobs/:jobId/download/model", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const outputDir = path.join(RESULTS_DIR, raw);
  const modelFile = path.join(outputDir, "model.pkl");

  if (!fs.existsSync(modelFile)) {
    res.status(404).json({ error: "Model file not found. Training may not be complete." });
    return;
  }

  res.download(modelFile, `finetuned_model_${raw.slice(0, 8)}.pkl`);
});

router.get("/jobs/:jobId/download/script", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const outputDir = path.join(RESULTS_DIR, raw);
  const scriptFile = path.join(outputDir, "train_script.py");

  if (!fs.existsSync(scriptFile)) {
    res.status(404).json({ error: "Training script not found. Training may not be complete." });
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  res.download(scriptFile, `train_${raw.slice(0, 8)}.py`);
});

export default router;
