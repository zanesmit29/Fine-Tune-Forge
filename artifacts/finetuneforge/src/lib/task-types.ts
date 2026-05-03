import { Tags, Smile, ScanLine, FileText, MessageCircleQuestion, Wand2, type LucideIcon } from "lucide-react";

export type TaskTypeId =
  | "classification"
  | "sentiment"
  | "ner"
  | "summarization"
  | "qa"
  | "instruction";

export interface TaskTemplate {
  id: string;
  filename: string;
  name: string;
  description: string;
  textColumn: string;
  labelColumn: string;
  classes: string[];
  rowCount: number;
}

export interface TaskTypeDef {
  id: TaskTypeId;
  name: string;
  description: string;
  example: string;
  icon: LucideIcon;
  available: boolean;
  recommendedModelIdsCpu: string[];
  recommendedModelIdsGpu: string[];
  templates: TaskTemplate[];
}

export const TASK_TYPES: TaskTypeDef[] = [
  {
    id: "classification",
    name: "Text Classification",
    description: "Classify text into custom categories.",
    example: "Support tickets, product feedback, topic tagging",
    icon: Tags,
    available: true,
    recommendedModelIdsCpu: ["distilbert-base-uncased", "prajjwal1/bert-tiny"],
    recommendedModelIdsGpu: ["microsoft/deberta-v3-base"],
    templates: [
      {
        id: "customer_support",
        filename: "customer_support.csv",
        name: "Customer Support Tickets",
        description: "Route incoming tickets into 5 support categories.",
        textColumn: "text",
        labelColumn: "category",
        classes: ["billing", "technical", "account", "shipping", "refund"],
        rowCount: 200,
      },
      {
        id: "topic_classifier",
        filename: "topic_classifier.csv",
        name: "Topic Classifier",
        description: "Classify articles into topic categories.",
        textColumn: "text",
        labelColumn: "topic",
        classes: ["technology", "sport", "politics", "health"],
        rowCount: 200,
      },
    ],
  },
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    description: "Detect positive, negative, or neutral tone in text.",
    example: "Reviews, social posts, survey responses",
    icon: Smile,
    available: true,
    recommendedModelIdsCpu: ["distilbert-base-uncased", "prajjwal1/bert-tiny"],
    recommendedModelIdsGpu: ["roberta-base"],
    templates: [
      {
        id: "product_reviews",
        filename: "product_reviews.csv",
        name: "Product Reviews",
        description: "Three-way sentiment for product reviews.",
        textColumn: "text",
        labelColumn: "sentiment",
        classes: ["positive", "negative", "neutral"],
        rowCount: 200,
      },
      {
        id: "social_posts",
        filename: "social_posts.csv",
        name: "Social Posts",
        description: "Binary sentiment for short social media posts.",
        textColumn: "text",
        labelColumn: "sentiment",
        classes: ["positive", "negative"],
        rowCount: 200,
      },
    ],
  },
  {
    id: "ner",
    name: "Named Entity Recognition",
    description: "Extract entities like people, places, and organizations from text.",
    example: "Resumes, news articles, contracts",
    icon: ScanLine,
    available: false,
    recommendedModelIdsCpu: [],
    recommendedModelIdsGpu: [],
    templates: [],
  },
  {
    id: "summarization",
    name: "Text Summarization",
    description: "Generate concise summaries of longer documents.",
    example: "Articles, meeting notes, reports",
    icon: FileText,
    available: false,
    recommendedModelIdsCpu: [],
    recommendedModelIdsGpu: [],
    templates: [],
  },
  {
    id: "qa",
    name: "Question & Answer Fine-Tuning",
    description: "Train a model to answer questions over your domain.",
    example: "Knowledge bases, support docs, FAQs",
    icon: MessageCircleQuestion,
    available: false,
    recommendedModelIdsCpu: [],
    recommendedModelIdsGpu: [],
    templates: [],
  },
  {
    id: "instruction",
    name: "Instruction Tuning",
    description:
      "Fine-tune a generative model on your own Q&A or instruction data. Export to GGUF and run locally in LM Studio.",
    example: "Assistants, internal Q&A bots, on-device chat",
    icon: Wand2,
    available: true,
    recommendedModelIdsCpu: ["gpt2", "Qwen/Qwen2.5-0.5B"],
    recommendedModelIdsGpu: ["Qwen/Qwen2.5-1.5B", "Qwen/Qwen2.5-3B"],
    templates: [
      {
        id: "company_faq",
        filename: "company_faq.csv",
        name: "Company FAQ",
        description:
          "50 realistic company FAQ instruction/response pairs (support, billing, security).",
        textColumn: "instruction",
        labelColumn: "response",
        classes: [],
        rowCount: 50,
      },
      {
        id: "product_assistant",
        filename: "product_assistant.csv",
        name: "Product Assistant",
        description:
          "50 product Q&A pairs covering features, integrations, and account management.",
        textColumn: "instruction",
        labelColumn: "response",
        classes: [],
        rowCount: 50,
      },
    ],
  },
];

export function getTaskType(id: TaskTypeId | null): TaskTypeDef | null {
  if (!id) return null;
  return TASK_TYPES.find((t) => t.id === id) ?? null;
}

export function getRecommendedModelIds(
  task: TaskTypeDef | null,
  computeMode: "cpu" | "gpu",
): string[] {
  if (!task) return [];
  if (computeMode === "gpu") {
    // GPU-specific picks first (so the primary "Recommended" badge lands on a GPU model),
    // followed by CPU-compatible recommendations as additional options.
    return [...task.recommendedModelIdsGpu, ...task.recommendedModelIdsCpu];
  }
  return task.recommendedModelIdsCpu;
}
