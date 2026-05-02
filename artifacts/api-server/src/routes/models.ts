import { Router, type IRouter } from "express";
import { ListModelsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const AVAILABLE_MODELS = [
  {
    id: "distilbert-base-uncased",
    name: "DistilBERT",
    paramCount: "66M",
    estimatedMinutes: 5,
    description: "A fast, lightweight BERT model. Best for text classification tasks.",
    taskType: "classification",
  },
  {
    id: "gpt2",
    name: "GPT-2 Small",
    paramCount: "117M",
    estimatedMinutes: 10,
    description: "OpenAI's compact text generation model. Good for causal LM fine-tuning.",
    taskType: "text-generation",
  },
  {
    id: "Qwen/Qwen2.5-0.5B",
    name: "Qwen2.5-0.5B",
    paramCount: "500M",
    estimatedMinutes: 25,
    description: "Alibaba's efficient small language model. Strong multilingual understanding.",
    taskType: "text-generation",
  },
  {
    id: "distilgpt2",
    name: "DistilGPT-2",
    paramCount: "82M",
    estimatedMinutes: 8,
    description: "Distilled version of GPT-2. Fastest text generation model available.",
    taskType: "text-generation",
  },
];

router.get("/models", async (_req, res): Promise<void> => {
  res.json(ListModelsResponse.parse(AVAILABLE_MODELS));
});

export default router;
