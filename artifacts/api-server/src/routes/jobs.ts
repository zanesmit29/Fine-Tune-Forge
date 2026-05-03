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

const EXPORT_FILES = {
  pkl: "model.pkl",
  onnx: "model.onnx",
  gguf: "model.gguf",
} as const;
type ExportFormat = keyof typeof EXPORT_FILES;

function detectExportPaths(jobId: string): {
  pklPath: string | null;
  onnxPath: string | null;
  ggufPath: string | null;
} {
  const dir = path.join(RESULTS_DIR, jobId);
  const exists = (name: string) => {
    const p = path.join(dir, name);
    return fs.existsSync(p) ? p : null;
  };
  return {
    pklPath: exists(EXPORT_FILES.pkl),
    onnxPath: exists(EXPORT_FILES.onnx),
    ggufPath: exists(EXPORT_FILES.gguf),
  };
}

function parseEpochLosses(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function formatJob(row: typeof trainingJobsTable.$inferSelect) {
  return {
    id: row.id,
    modelId: row.modelId,
    modelName: row.modelName,
    nickname: row.nickname ?? null,
    taskType: row.taskType ?? null,
    datasetId: row.datasetId,
    datasetName: row.datasetName ?? null,
    textColumn: row.textColumn,
    labelColumn: row.labelColumn,
    epochs: row.epochs,
    learningRate: row.learningRate,
    loraRank: row.loraRank,
    maxSeqLength: row.maxSeqLength ?? null,
    computeMode: (row.computeMode ?? "cpu") as "cpu" | "gpu",
    status: row.status as "queued" | "running" | "completed" | "failed",
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    trainLoss: row.trainLoss ?? null,
    evalLoss: row.evalLoss ?? null,
    accuracy: row.accuracy ?? null,
    perplexity: row.perplexity ?? null,
    epochLosses: parseEpochLosses(row.epochLosses),
    sampleInstruction: row.sampleInstruction ?? null,
    sampleResponse: row.sampleResponse ?? null,
    errorMessage: row.errorMessage ?? null,
    pklPath: row.pklPath ?? null,
    onnxPath: row.onnxPath ?? null,
    ggufPath: row.ggufPath ?? null,
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

  const trainingDir = path.join(__dirname, "..", "training");
  const isGpu = body.computeMode === "gpu";
  const pythonScript = path.join(
    trainingDir,
    isGpu ? "modal_trainer.py" : "train.py",
  );

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
    "--task-type", body.taskType ?? "classification",
    "--max-seq-length", String(body.maxSeqLength ?? 256),
  ];

  await appendLog(jobId, `[FineTuneForge] Starting training job ${jobId}`);
  await appendLog(jobId, `[FineTuneForge] Compute: ${isGpu ? "Modal A10G GPU" : "Replit CPU"}`);
  await appendLog(jobId, `[FineTuneForge] Model: ${body.modelId}`);
  await appendLog(jobId, `[FineTuneForge] Dataset: ${body.datasetId}.csv`);
  await appendLog(jobId, `[FineTuneForge] Config: epochs=${body.epochs}, lr=${body.learningRate}, lora_rank=${body.loraRank}`);
  await appendLog(jobId, `[FineTuneForge] Spawning ${isGpu ? "Modal GPU" : "Python CPU"} training process...`);

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
      let perplexity: number | null = null;
      let epochLosses: number[] = [];
      let sampleInstruction: string | null = null;
      let sampleResponse: string | null = null;

      if (fs.existsSync(resultsFile)) {
        try {
          const metrics = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
          trainLoss = metrics.train_loss ?? null;
          evalLoss = metrics.eval_loss ?? null;
          accuracy = metrics.accuracy ?? null;
          perplexity = metrics.perplexity ?? null;
          epochLosses = Array.isArray(metrics.epoch_losses) ? metrics.epoch_losses : [];
          sampleInstruction = metrics.sample_instruction ?? null;
          sampleResponse = metrics.sample_response ?? null;
        } catch {
          logger.warn({ jobId }, "Failed to read metrics file");
        }
      }

      await appendLog(jobId, `[FineTuneForge] Training completed successfully!`);
      if (trainLoss !== null) await appendLog(jobId, `[FineTuneForge] Final train loss: ${trainLoss.toFixed(4)}`);
      if (evalLoss !== null) await appendLog(jobId, `[FineTuneForge] Final eval loss: ${evalLoss.toFixed(4)}`);
      if (accuracy !== null) await appendLog(jobId, `[FineTuneForge] Accuracy: ${(accuracy * 100).toFixed(2)}%`);

      const { pklPath, onnxPath, ggufPath } = detectExportPaths(jobId);
      await appendLog(
        jobId,
        `[FineTuneForge] Exports — pkl:${pklPath ? "ok" : "—"} onnx:${onnxPath ? "ok" : "—"} gguf:${ggufPath ? "ok" : "—"}`,
      );
      await db
        .update(trainingJobsTable)
        .set({
          status: "completed",
          completedAt: new Date(),
          trainLoss,
          evalLoss,
          accuracy,
          perplexity,
          epochLosses: JSON.stringify(epochLosses),
          sampleInstruction,
          sampleResponse,
          pklPath,
          onnxPath,
          ggufPath,
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

  const MODEL_COMPUTE_MODES: Record<string, ReadonlyArray<"cpu" | "gpu">> = {
    "distilbert-base-uncased": ["cpu", "gpu"],
    "prajjwal1/bert-tiny": ["cpu", "gpu"],
    "microsoft/deberta-v3-base": ["gpu"],
    "roberta-base": ["gpu"],
    "gpt2": ["cpu", "gpu"],
    "Qwen/Qwen2.5-0.5B": ["cpu", "gpu"],
    "Qwen/Qwen2.5-1.5B": ["gpu"],
    "Qwen/Qwen2.5-3B": ["gpu"],
    "distilgpt2": ["cpu", "gpu"],
    "mistralai/Mistral-7B-v0.1": ["gpu"],
    "meta-llama/Llama-3.2-3B": ["gpu"],
  };
  const supportedModes = MODEL_COMPUTE_MODES[body.modelId];
  if (!supportedModes) {
    res.status(400).json({ error: `Unknown model: ${body.modelId}` });
    return;
  }
  if (!supportedModes.includes(body.computeMode)) {
    res.status(400).json({
      error: `Model ${body.modelId} does not support ${body.computeMode.toUpperCase()} compute. Supported modes: ${supportedModes.join(", ")}.`,
    });
    return;
  }

  const csvPath = path.join(UPLOAD_DIR, `${body.datasetId}.csv`);
  if (!fs.existsSync(csvPath)) {
    res.status(400).json({ error: "Dataset not found. Please re-upload your CSV." });
    return;
  }

  const MODEL_NAMES: Record<string, string> = {
    "distilbert-base-uncased": "DistilBERT",
    "prajjwal1/bert-tiny": "BERT-Tiny",
    "microsoft/deberta-v3-base": "DeBERTa-v3-base",
    "roberta-base": "RoBERTa-base",
    "gpt2": "GPT-2 Small",
    "Qwen/Qwen2.5-0.5B": "Qwen2.5-0.5B",
    "Qwen/Qwen2.5-1.5B": "Qwen2.5-1.5B + LoRA",
    "Qwen/Qwen2.5-3B": "Qwen2.5-3B + LoRA",
    "distilgpt2": "DistilGPT-2",
    "mistralai/Mistral-7B-v0.1": "Mistral-7B + LoRA",
    "meta-llama/Llama-3.2-3B": "Llama-3.2-3B + LoRA",
  };

  const jobId = randomUUID();
  const [job] = await db
    .insert(trainingJobsTable)
    .values({
      id: jobId,
      modelId: body.modelId,
      modelName: MODEL_NAMES[body.modelId] ?? body.modelId,
      taskType: body.taskType ?? null,
      datasetId: body.datasetId,
      datasetName: body.datasetName ?? null,
      textColumn: body.textColumn,
      labelColumn: body.labelColumn,
      epochs: body.epochs,
      learningRate: body.learningRate,
      loraRank: body.loraRank,
      maxSeqLength: body.maxSeqLength ?? null,
      computeMode: body.computeMode,
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

function serveExport(format: ExportFormat) {
  return async (req: import("express").Request, res: import("express").Response): Promise<void> => {
    const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const params = GetJobParams.safeParse({ jobId: raw });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const jobId = params.data.jobId;
    const fileName = EXPORT_FILES[format];
    const outputDir = path.join(RESULTS_DIR, jobId);
    const filePath = path.join(outputDir, fileName);

    // Defense-in-depth: ensure resolved path stays within RESULTS_DIR.
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(RESULTS_DIR) + path.sep)) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({
        error: `${format.toUpperCase()} export not available for this job.`,
      });
      return;
    }

    res.download(resolved, `finetuned_model_${jobId.slice(0, 8)}.${format}`);
  };
}

// Existing route kept for backward compatibility — aliases /download/pkl.
router.get("/jobs/:jobId/download/model", serveExport("pkl"));
router.get("/jobs/:jobId/download/pkl", serveExport("pkl"));
router.get("/jobs/:jobId/download/onnx", serveExport("onnx"));
router.get("/jobs/:jobId/download/gguf", serveExport("gguf"));

router.get("/jobs/:jobId/download/script", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetJobParams.safeParse({ jobId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const jobId = params.data.jobId;
  const outputDir = path.join(RESULTS_DIR, jobId);
  const scriptFile = path.join(outputDir, "train_script.py");
  const resolved = path.resolve(scriptFile);
  if (!resolved.startsWith(path.resolve(RESULTS_DIR) + path.sep)) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }

  if (!fs.existsSync(resolved)) {
    res.status(404).json({ error: "Training script not found. Training may not be complete." });
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  res.download(resolved, `train_${jobId.slice(0, 8)}.py`);
});

export default router;
