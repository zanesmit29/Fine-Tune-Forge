import { Router, type IRouter } from "express";
import { ListModelsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const AVAILABLE_MODELS = [
  {
    id: "distilbert-base-uncased",
    name: "DistilBERT",
    paramCount: "66M",
    estimatedMinutesCpu: 5,
    estimatedMinutesGpu: 1,
    description: "A fast, lightweight BERT model. Best for text classification tasks.",
    taskType: "classification",
    computeModes: ["cpu", "gpu"],
  },
  {
    id: "prajjwal1/bert-tiny",
    name: "BERT-Tiny",
    paramCount: "4M",
    estimatedMinutesCpu: 2,
    estimatedMinutesGpu: 1,
    description: "Tiny BERT for quick experiments. Trains in minutes on CPU.",
    taskType: "classification",
    computeModes: ["cpu", "gpu"],
  },
  {
    id: "microsoft/deberta-v3-base",
    name: "DeBERTa-v3-base",
    paramCount: "184M",
    estimatedMinutesCpu: null,
    estimatedMinutesGpu: 4,
    description: "State-of-the-art classification model. GPU only.",
    taskType: "classification",
    computeModes: ["gpu"],
  },
  {
    id: "roberta-base",
    name: "RoBERTa-base",
    paramCount: "125M",
    estimatedMinutesCpu: null,
    estimatedMinutesGpu: 3,
    description: "Robust BERT variant tuned for sentiment & classification. GPU only.",
    taskType: "classification",
    computeModes: ["gpu"],
  },
  {
    id: "gpt2",
    name: "GPT-2 Small",
    paramCount: "117M",
    estimatedMinutesCpu: 10,
    estimatedMinutesGpu: 2,
    description: "OpenAI's compact text generation model. Good for causal LM fine-tuning.",
    taskType: "text-generation",
    computeModes: ["cpu", "gpu"],
  },
  {
    id: "Qwen/Qwen2.5-0.5B",
    name: "Qwen2.5-0.5B",
    paramCount: "500M",
    estimatedMinutesCpu: 25,
    estimatedMinutesGpu: 3,
    description: "Alibaba's efficient small language model. Strong multilingual understanding. GGUF export ready.",
    taskType: "text-generation",
    computeModes: ["cpu", "gpu"],
  },
  {
    id: "Qwen/Qwen2.5-1.5B",
    name: "Qwen2.5-1.5B + LoRA",
    paramCount: "1.5B",
    estimatedMinutesCpu: null,
    estimatedMinutesGpu: 5,
    description: "Mid-size Qwen with LoRA adapters. Great balance of quality and speed for instruction tuning. GPU only.",
    taskType: "text-generation",
    computeModes: ["gpu"],
  },
  {
    id: "Qwen/Qwen2.5-3B",
    name: "Qwen2.5-3B + LoRA",
    paramCount: "3B",
    estimatedMinutesCpu: null,
    estimatedMinutesGpu: 9,
    description: "Larger Qwen with LoRA adapters. Higher-quality assistant responses. GPU only.",
    taskType: "text-generation",
    computeModes: ["gpu"],
  },
  {
    id: "mistralai/Mistral-7B-v0.1",
    name: "Mistral-7B + LoRA",
    paramCount: "7B",
    estimatedMinutesCpu: null,
    estimatedMinutesGpu: 12,
    description: "Mistral 7B with LoRA adapters. High-quality general-purpose LLM. GPU only.",
    taskType: "text-generation",
    computeModes: ["gpu"],
  },
  {
    id: "meta-llama/Llama-3.2-3B",
    name: "Llama-3.2-3B + LoRA",
    paramCount: "3B",
    estimatedMinutesCpu: null,
    estimatedMinutesGpu: 7,
    description: "Meta's Llama 3.2 3B with LoRA adapters. Strong reasoning at smaller size. GPU only.",
    taskType: "text-generation",
    computeModes: ["gpu"],
  },
];

router.get("/models", async (_req, res): Promise<void> => {
  res.json(ListModelsResponse.parse(AVAILABLE_MODELS));
});

export default router;
