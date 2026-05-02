import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingJobsTable = pgTable("training_jobs", {
  id: text("id").primaryKey(),
  modelId: text("model_id").notNull(),
  modelName: text("model_name").notNull(),
  datasetId: text("dataset_id").notNull(),
  textColumn: text("text_column").notNull(),
  labelColumn: text("label_column").notNull(),
  epochs: integer("epochs").notNull(),
  learningRate: real("learning_rate").notNull(),
  loraRank: integer("lora_rank").notNull(),
  status: text("status").notNull().default("queued"),
  logLines: text("log_lines").notNull().default("[]"),
  trainLoss: real("train_loss"),
  evalLoss: real("eval_loss"),
  accuracy: real("accuracy"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertTrainingJobSchema = createInsertSchema(trainingJobsTable).omit({
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export type InsertTrainingJob = z.infer<typeof insertTrainingJobSchema>;
export type TrainingJob = typeof trainingJobsTable.$inferSelect;
