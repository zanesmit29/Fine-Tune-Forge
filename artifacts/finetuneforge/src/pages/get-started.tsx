import { useState } from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Lightbulb, Check, Copy, Zap, ExternalLink } from "lucide-react";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[#1E293B] text-[#E2E8F0] hover:bg-[#334155] transition-colors border border-[#334155]"
        data-testid="button-copy-code"
        aria-label="Copy code"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" /> Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> Copy
          </>
        )}
      </button>
      <pre className="bg-[#0F172A] text-[#E2E8F0] text-sm font-mono rounded-md p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 pb-3 border-b border-[#E2E8F0]">
      <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
      {subtitle && (
        <p className="text-sm text-[#64748B] mt-2">{subtitle}</p>
      )}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-2 items-start bg-[#EFF6FF] border-l-2 border-[#2563EB] rounded-md px-3 py-2">
      <Lightbulb className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
      <p className="text-sm text-[#0F172A] leading-relaxed">{children}</p>
    </div>
  );
}

interface StepCardProps {
  num: number;
  title: string;
  body: string;
  tip: React.ReactNode;
}

function StepCard({ num, title, body, tip }: StepCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-sm font-semibold flex items-center justify-center shrink-0">
          {num}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#0F172A]">{title}</h3>
          <p className="text-sm text-[#475569] mt-2 leading-relaxed whitespace-pre-line">
            {body}
          </p>
          <Tip>{tip}</Tip>
        </div>
      </div>
    </div>
  );
}

interface FormatCardProps {
  accent: string;
  badge: string;
  header: string;
  blurb: string;
  children: React.ReactNode;
}

function FormatCard({ accent, badge, header, blurb, children }: FormatCardProps) {
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <div className="p-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            className="font-mono text-lg font-bold"
            style={{ color: accent }}
          >
            {badge}
          </span>
          <span className="text-[#64748B]">·</span>
          <span className="text-[#0F172A] font-semibold">{header}</span>
        </div>
        <p className="text-sm text-[#475569] mt-3 leading-relaxed">{blurb}</p>
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function UseCases({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="text-sm text-[#475569] flex items-start gap-2"
        >
          <span className="text-[#2563EB] mt-0.5">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PracticeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-[#EFF6FF] flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
          <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

const PKL_CODE = `import pickle
from transformers import pipeline

with open("your_model.pkl", "rb") as f:
    model = pickle.load(f)

classifier = pipeline("text-classification",
                       model=model)
result = classifier("Your input text here")
print(result)`;

const ONNX_CODE = `import onnxruntime as ort
import numpy as np

session = ort.InferenceSession("your_model.onnx")
inputs = {"input_ids": np.array([[101, 2054, 2003, 102]])}
outputs = session.run(None, inputs)
print(outputs)`;

const OLLAMA_CODE = `ollama create my-model -f ./Modelfile
# In your Modelfile:
# FROM ./your_model.gguf

ollama run my-model
"Tell me about your return policy"`;

export default function GetStarted() {
  return (
    <Layout title="Get Started" breadcrumb="Get Started">
      <div className="max-w-[960px] mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
            Get Started with FineTuneForge
          </h1>
          <p className="text-base text-[#64748B] mt-2">
            Everything you need to train your first model and put it to work.
          </p>
        </div>

        {/* Section 1 — Workflow */}
        <section className="mb-14">
          <SectionHeading title="Training your first model" />
          <div className="space-y-5">
            <StepCard
              num={1}
              title="Choose a Task Type"
              body={`Start by selecting the business problem you want to solve. FineTuneForge is built around tasks, not model architectures — so you don't need to know the difference between BERT and GPT to get started.
Currently available: Text Classification, Sentiment Analysis, and Instruction Tuning.`}
              tip="Not sure which task to pick? If you want to sort or label text, choose Classification. If you want to detect tone or opinion, choose Sentiment Analysis. If you want a model that answers questions, choose Instruction Tuning."
            />
            <StepCard
              num={2}
              title="Upload Your Data or Use a Template"
              body={`Upload a CSV file with your training data, or pick one of our built-in templates to get started immediately. Your CSV needs at least two columns: the input text and the label or response.
For Classification and Sentiment: columns are 'text' and 'label'. For Instruction Tuning: columns are 'instruction' and 'response'.`}
              tip="Start with at least 50 rows for meaningful results. More data generally means better accuracy — 200+ rows is ideal for Classification tasks."
            />
            <StepCard
              num={3}
              title="Configure Your Training"
              body={`Set your training parameters using the sliders. If you're unsure, the defaults are a safe starting point for most datasets.
Epochs: how many times the model reads your full dataset. More epochs can improve accuracy but may overfit on small datasets — 3 is a good default.
Learning Rate: how fast the model adapts. Lower is safer. Default 2e-4 works for most cases.
LoRA Rank: controls the size of the fine-tuning adapter. Higher rank = more capacity but slower training. r=8 is recommended for most tasks.`}
              tip="Use CPU for small datasets and quick tests. Switch to GPU (requires your Modal API key) for larger datasets or bigger models like Mistral-7B."
            />
            <StepCard
              num={4}
              title="Download Your Model and Code"
              body={`Once training completes, download your model in one or more export formats. You'll also get the full Python training script that was used — so you can reproduce or modify the run anytime.
Your results page shows accuracy, loss, and a sample prediction so you can verify the model is working before you download.`}
              tip="Save the Python training script — it's a complete, runnable fine-tuning pipeline you can use independently of FineTuneForge."
            />
          </div>
        </section>

        {/* Section 1.5 — GPU via Modal */}
        <section className="mb-14">
          <SectionHeading
            title="Enabling GPU training with Modal"
            subtitle="CPU works great for small models and quick experiments. For larger models like Mistral-7B or Llama-3.2-3B, connect your own Modal account for GPU compute."
          />

          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-md bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[#0F172A]">
                  Why Modal?
                </h3>
                <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                  Modal gives you on-demand A10G GPU compute that spins up in
                  seconds. You bring your own account so jobs run under your
                  billing — FineTuneForge never stores your keys or charges you
                  for compute.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-[#475569]">
                  <div className="flex items-start gap-2">
                    <span className="text-[#2563EB] mt-0.5">·</span>
                    <span>Free tier: $30/month in compute credits</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#2563EB] mt-0.5">·</span>
                    <span>GPU: A10G — ~$2.07/hr</span>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-[#0F172A] mb-3">
              Connect your account in 4 steps
            </h4>
            <ol className="space-y-3">
              {[
                {
                  title: "Create a Modal account",
                  body: (
                    <>
                      Sign up at{" "}
                      <a
                        href="https://modal.com/signup"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#2563EB] hover:underline"
                      >
                        modal.com/signup
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      . The free tier covers most fine-tuning runs on small to
                      mid-size models.
                    </>
                  ),
                },
                {
                  title: "Generate an API token",
                  body: (
                    <>
                      In Modal, go to{" "}
                      <span className="font-medium text-[#0F172A]">
                        Settings → API Tokens
                      </span>{" "}
                      and click{" "}
                      <span className="font-medium text-[#0F172A]">
                        New Token
                      </span>
                      . Copy both the Token ID (starts with{" "}
                      <code className="px-1 py-0.5 rounded bg-[#F1F5F9] font-mono text-[12px]">
                        ak-
                      </code>
                      ) and the Token Secret.
                    </>
                  ),
                },
                {
                  title: "Paste them into Integrations",
                  body: (
                    <>
                      Open the{" "}
                      <Link
                        href="/integrations"
                        className="text-[#2563EB] hover:underline font-medium"
                        data-testid="link-getstarted-integrations"
                      >
                        Integrations page
                      </Link>{" "}
                      in FineTuneForge, paste your Token ID and Token Secret,
                      and click Connect Modal. We verify the credentials
                      against Modal's API before accepting them.
                    </>
                  ),
                },
                {
                  title: "Pick GPU when configuring training",
                  body: (
                    <>
                      In Step 3 of the wizard, switch the Compute toggle to{" "}
                      <span className="font-medium text-[#0F172A]">
                        GPU (Modal A10G)
                      </span>
                      . Bigger base models like Mistral-7B and Llama-3.2-3B
                      will become available, and the job will run on your
                      Modal account.
                    </>
                  ),
                },
              ].map((step, i) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="text-sm text-[#475569] leading-relaxed">
                    <div className="font-semibold text-[#0F172A]">
                      {step.title}
                    </div>
                    <div className="mt-0.5">{step.body}</div>
                  </div>
                </li>
              ))}
            </ol>

            <Tip>
              Your credentials are kept in memory on the server only — they're
              never written to disk, logged, or shared. All GPU usage and
              billing stays visible in your own{" "}
              <a
                href="https://modal.com/usage"
                target="_blank"
                rel="noreferrer"
                className="text-[#2563EB] hover:underline"
              >
                modal.com/usage
              </a>{" "}
              dashboard.
            </Tip>
          </div>
        </section>

        {/* Section 2 — Export Formats */}
        <section className="mb-14">
          <SectionHeading
            title="Understanding your export formats"
            subtitle="Each format is designed for a different use case. Here's what to do with each one."
          />
          <div className="space-y-5">
            <FormatCard
              accent="#2563EB"
              badge="PKL"
              header="For Python pipelines"
              blurb="The PKL file contains your fine-tuned model weights in Python's native serialization format. It's the easiest format to load inside a Python script or Jupyter notebook."
            >
              <CodeBlock code={PKL_CODE} />
              <UseCases
                items={[
                  "Internal Python scripts and automation",
                  "Jupyter notebook experiments",
                  "Integrating into an existing Flask or FastAPI app",
                  "scikit-learn pipeline compatibility",
                ]}
              />
            </FormatCard>

            <FormatCard
              accent="#7C3AED"
              badge="ONNX"
              header="For cross-platform inference"
              blurb="ONNX is an open format for running models across different frameworks and languages. Use it when you want to run inference in .NET, Java, C++, or in a browser — anywhere Python isn't available."
            >
              <CodeBlock code={ONNX_CODE} />
              <UseCases
                items={[
                  "Production inference servers (low latency)",
                  ".NET, Java, or C++ applications",
                  "Edge devices and mobile deployment",
                  "Browser inference via ONNX.js",
                ]}
              />
            </FormatCard>

            <FormatCard
              accent="#059669"
              badge="GGUF"
              header="For local offline use"
              blurb="GGUF is the format used by LM Studio and Ollama to run models entirely on your local machine — no internet connection required after download. This is only available for generative models (Instruction Tuning task)."
            >
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] mb-3">
                  Loading in LM Studio
                </h4>
                <ol className="space-y-2">
                  {[
                    "Download your .gguf file from the Results page",
                    "Open LM Studio on your computer",
                    'Go to "My Models" → click "Add Model"',
                    "Select your downloaded .gguf file",
                    'Click "Load Model" and start chatting',
                  ].map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 text-sm text-[#475569]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] mb-3">
                  Loading in Ollama
                </h4>
                <CodeBlock code={OLLAMA_CODE} />
              </div>
              <UseCases
                items={[
                  "Fully offline company FAQ assistant",
                  "Local product support chatbot",
                  "Air-gapped or privacy-sensitive environments",
                  "No API costs — runs entirely on your hardware",
                ]}
              />
            </FormatCard>
          </div>
        </section>

        {/* Section 3 — Tips */}
        <section className="mb-8">
          <SectionHeading title="Tips for better results" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PracticeCard
              title="Start small, iterate fast"
              body="Train on 50–100 rows first to verify your data format works. Scale up once you're getting reasonable accuracy."
            />
            <PracticeCard
              title="Data quality beats quantity"
              body="Clean, consistent labels matter more than volume. 100 well-labelled rows outperform 500 messy ones every time."
            />
            <PracticeCard
              title="Use GPU for models over 300M parameters"
              body="DistilBERT and BERT-Tiny run fine on CPU. For DeBERTa, RoBERTa, or any model over 300M params, switch to GPU in Step 3."
            />
            <PracticeCard
              title="Save your training script"
              body="The exported Python script is a full, standalone fine-tuning pipeline. Keep it — you can run it on any machine with PyTorch and HuggingFace installed."
            />
          </div>
        </section>
      </div>
    </Layout>
  );
}
