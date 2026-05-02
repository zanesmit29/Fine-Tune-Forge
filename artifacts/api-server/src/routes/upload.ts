import { Router, type IRouter } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { UploadDatasetResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, `${randomUUID()}.csv`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

function detectColumns(
  columns: string[]
): { textCol: string | null; labelCol: string | null } {
  const textHints = ["text", "content", "message", "sentence", "review", "comment", "input", "description", "body"];
  const labelHints = ["label", "class", "category", "target", "sentiment", "output", "tag", "type"];

  const lower = columns.map((c) => c.toLowerCase());
  const textCol =
    columns[lower.findIndex((c) => textHints.some((h) => c.includes(h)))] ?? null;
  const labelCol =
    columns[lower.findIndex((c) => labelHints.some((h) => c.includes(h)))] ?? null;

  return { textCol, labelCol };
}

router.post(
  "/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      const content = fs.readFileSync(req.file.path, "utf-8");
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      if (records.length === 0) {
        res.status(400).json({ error: "CSV file is empty" });
        return;
      }

      const columns = Object.keys(records[0]).filter((c) => c.trim() !== "");
      const previewRows = records.slice(0, 5);
      const { textCol, labelCol } = detectColumns(columns);

      const datasetId = path.basename(req.file.filename, ".csv");

      const result = UploadDatasetResponse.parse({
        datasetId,
        columns,
        previewRows,
        rowCount: records.length,
        detectedTextColumn: textCol,
        detectedLabelColumn: labelCol,
      });

      res.json(result);
    } catch (err) {
      req.log.error({ err }, "Failed to parse CSV");
      res.status(400).json({ error: "Failed to parse CSV. Ensure it is a valid CSV file." });
    }
  }
);

export default router;
