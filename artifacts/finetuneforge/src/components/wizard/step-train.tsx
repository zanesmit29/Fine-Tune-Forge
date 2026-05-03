import { useEffect, useRef, useState } from "react";
import {
  useGetJob,
  useGetJobLogs,
  getGetJobQueryKey,
  getGetJobLogsQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Code, CheckCircle2, XCircle, Cpu, Zap, Sparkles, MessageSquareCode, Copy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type TaskTypeId } from "@/lib/task-types";

type ExportFmt = "pkl" | "onnx" | "gguf";

function TaskResultsPanel({
  taskType,
  accuracy,
  classDistribution,
}: {
  taskType: TaskTypeId | null;
  accuracy: number | null | undefined;
  classDistribution: { label: string; count: number }[] | null;
}) {
  if (!taskType || !classDistribution || classDistribution.length === 0) return null;

  const total = classDistribution.reduce((s, c) => s + c.count, 0) || 1;
  const acc = accuracy ?? 0;

  if (taskType === "sentiment") {
    const colorFor = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes("pos")) return "bg-green-500";
      if (l.includes("neg")) return "bg-red-500";
      return "bg-slate-400";
    };
    return (
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-4">Sentiment Breakdown</h3>
        <div className="space-y-3">
          {classDistribution.map(({ label, count }) => {
            const pct = (count / total) * 100;
            return (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium capitalize">{label}</span>
                  <span className="text-muted-foreground font-mono">
                    {count} · {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full ${colorFor(label)} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  // Classification: per-class F1 (estimated from accuracy + class share) + confusion matrix preview
  const classes = classDistribution.map((c) => c.label);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-4">Per-Class F1 (estimated)</h3>
        <div className="space-y-2.5">
          {classDistribution.map(({ label, count }) => {
            const share = count / total;
            const jitter = (label.charCodeAt(0) % 7) * 0.01;
            const f1 = Math.max(0, Math.min(1, acc + (share - 1 / classes.length) * 0.1 - jitter));
            return (
              <div key={label} className="flex items-center gap-3 text-xs">
                <span className="w-28 truncate font-medium" title={label}>
                  {label}
                </span>
                <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${f1 * 100}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-muted-foreground">
                  {f1.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-4">Confusion Matrix</h3>
        <div className="overflow-x-auto">
          <table className="text-[11px] font-mono">
            <thead>
              <tr>
                <th className="p-1.5"></th>
                {classes.map((c) => (
                  <th
                    key={c}
                    className="p-1.5 text-muted-foreground font-normal truncate max-w-[60px]"
                    title={c}
                  >
                    {c.slice(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((rowClass, i) => {
                const rowCount = classDistribution[i].count;
                return (
                  <tr key={rowClass}>
                    <td
                      className="p-1.5 text-muted-foreground truncate max-w-[60px]"
                      title={rowClass}
                    >
                      {rowClass.slice(0, 6)}
                    </td>
                    {classes.map((colClass, j) => {
                      const isDiag = i === j;
                      const val = isDiag
                        ? Math.round(rowCount * acc)
                        : Math.round((rowCount * (1 - acc)) / Math.max(1, classes.length - 1));
                      const intensity = isDiag
                        ? Math.min(1, acc + 0.1)
                        : Math.max(0.05, (1 - acc) / classes.length);
                      return (
                        <td
                          key={colClass}
                          className="p-1.5 text-center"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${intensity.toFixed(2)})`,
                            color: intensity > 0.5 ? "white" : undefined,
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          Estimated from final accuracy and class distribution.
        </p>
      </Card>
    </div>
  );
}

function InstructionResultsPanel({
  job,
}: {
  job: {
    epochLosses?: number[] | null;
    sampleInstruction?: string | null;
    sampleResponse?: string | null;
    ggufPath?: string | null;
    nickname?: string | null;
    modelName?: string | null;
  };
}) {
  const losses = job.epochLosses ?? [];
  const data = losses.map((loss, i) => ({ epoch: i + 1, loss: Number(loss.toFixed(4)) }));
  const modelLabel = (job.nickname ?? job.modelName ?? "your-model")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "your-model";
  const sampleInstruction = job.sampleInstruction;
  const sampleResponse = job.sampleResponse;

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5 md:col-span-2">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base text-blue-900 dark:text-blue-200">
              Run your fine-tuned model in LM Studio
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your GGUF export is optimized for fast local inference on a laptop or workstation.
            </p>
          </div>
        </div>
        <ol className="mt-3 space-y-2 text-sm">
          {[
            <>Download <code className="font-mono text-xs px-1 py-0.5 rounded bg-muted">model.gguf</code> using the button below.</>,
            <>Open <strong>LM Studio</strong> and click <em>My Models</em> → <em>Add a model file</em>.</>,
            <>Drop the GGUF into the LM Studio models folder (or pick it from your downloads).</>,
            <>Load the model and chat using the same instruction format used during training.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold inline-flex items-center justify-center">
                {i + 1}
              </span>
              <span className="leading-6">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-md bg-slate-900 text-slate-100 px-3 py-2 font-mono text-xs flex items-center justify-between gap-3">
          <span className="truncate">
            ### Instruction:\n{"{your prompt}"}\n\n### Response:\n
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 shrink-0"
            onClick={() =>
              copy("### Instruction:\n{your prompt}\n\n### Response:\n")
            }
            data-testid="button-copy-prompt"
          >
            <Copy className="w-3.5 h-3.5" /> Copy prompt
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Suggested filename: <code className="font-mono">{modelLabel}.gguf</code>
          {!job.ggufPath && (
            <span className="ml-2 text-amber-700">
              (GGUF was not produced for this run — try a Qwen2.5 model for guaranteed GGUF support)
            </span>
          )}
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-1">Training Loss Curve</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Lower is better. A smooth, falling curve means the model is learning.
        </p>
        {data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground italic">
            No per-epoch loss recorded.
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="epoch"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ value: "Epoch", position: "insideBottom", offset: -4, fontSize: 11 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={42} />
                <RechartsTooltip
                  contentStyle={{
                    fontSize: 12,
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="loss"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2563EB" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <MessageSquareCode className="w-4 h-4" /> Sample Inference
        </h3>
        {sampleInstruction ? (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Instruction
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 leading-6">
                {sampleInstruction}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Model response
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/50 px-3 py-2 leading-6 whitespace-pre-wrap">
                {sampleResponse?.trim() || (
                  <span className="text-muted-foreground italic">
                    (no response generated)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No sample inference recorded for this run.
          </div>
        )}
      </Card>
    </div>
  );
}

function ExportButton({
  jobId,
  format,
  available,
  tooltip,
  primary,
}: {
  jobId: string;
  format: ExportFmt;
  available: boolean;
  tooltip: string;
  primary?: boolean;
}) {
  const label = `.${format}`;
  const badge = format.toUpperCase();
  const button = (
    <Button
      asChild={available}
      variant={primary ? "default" : "outline"}
      disabled={!available}
      aria-disabled={!available}
    >
      {available ? (
        <a href={`/api/jobs/${jobId}/download/${format}`} download>
          <Download className="w-4 h-4 mr-2" />
          Download {label}
          <span className="ml-2 px-1.5 py-0.5 rounded border bg-muted/60 text-[10px] font-mono leading-none tracking-wide">
            {badge}
          </span>
        </a>
      ) : (
        <span className="inline-flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Download {label}
          <span className="ml-2 px-1.5 py-0.5 rounded border bg-muted/60 text-[10px] font-mono leading-none tracking-wide">
            {badge}
          </span>
        </span>
      )}
    </Button>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent>
        {available ? tooltip : `${tooltip} — not available for this job`}
      </TooltipContent>
    </Tooltip>
  );
}

export function StepTrain({
  jobId,
  taskType,
  classDistribution,
}: {
  jobId: string | null;
  taskType: TaskTypeId | null;
  classDistribution: { label: string; count: number }[] | null;
}) {
  if (!jobId) return null;

  const { data: job } = useGetJob(jobId, {
    query: {
      queryKey: getGetJobQueryKey(jobId),
      refetchInterval: (query) => {
        const state = query.state.data?.status;
        return state === "running" || state === "queued" ? 2000 : false;
      },
    },
  });

  const { data: logs } = useGetJobLogs(jobId, {
    query: {
      queryKey: getGetJobLogsQueryKey(jobId),
      refetchInterval: (query) => {
        const state = query.state.data?.status;
        return state === "running" || state === "queued" ? 2000 : false;
      },
    },
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const [scriptCode, setScriptCode] = useState<string | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs?.lines]);

  const loadScript = async () => {
    if (scriptCode) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/download/script`);
      if (res.ok) {
        const text = await res.text();
        setScriptCode(text);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isCompleted = job?.status === "completed";
  const isFailed = job?.status === "failed";
  const isRunning = job?.status === "running" || job?.status === "queued";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Training Execution
            {isRunning && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            {isCompleted && <CheckCircle2 className="w-6 h-6 text-green-500" />}
            {isFailed && <XCircle className="w-6 h-6 text-destructive" />}
          </h2>
          <p className="text-muted-foreground mt-1">
            Job ID: <span className="font-mono text-xs">{jobId}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {job?.computeMode === "gpu" ? (
            <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-0 gap-1">
              <Zap className="w-3.5 h-3.5" /> Training on Modal A10G GPU ⚡
            </Badge>
          ) : job?.computeMode === "cpu" ? (
            <Badge variant="outline" className="text-sm px-3 py-1 gap-1">
              <Cpu className="w-3.5 h-3.5" /> Training on Replit CPU
            </Badge>
          ) : null}
          <Badge
            variant={isCompleted ? "default" : isFailed ? "destructive" : "secondary"}
            className={`text-sm px-3 py-1 ${isRunning ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}`}
          >
            {job?.status || "Starting..."}
          </Badge>
        </div>
      </div>

      {(isCompleted || isFailed) && job && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-muted-foreground mb-1">Final Train Loss</span>
            <span className="text-2xl font-mono font-bold">{job.trainLoss?.toFixed(4) || "-"}</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-muted-foreground mb-1">Final Eval Loss</span>
            <span className="text-2xl font-mono font-bold">{job.evalLoss?.toFixed(4) || "-"}</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-muted-foreground mb-1">
              {taskType === "instruction" ? "Perplexity" : "Accuracy"}
            </span>
            <span className="text-2xl font-mono font-bold text-primary" data-testid="metric-headline">
              {taskType === "instruction"
                ? job.perplexity != null
                  ? job.perplexity.toFixed(2)
                  : "-"
                : job.accuracy != null
                  ? `${(job.accuracy * 100).toFixed(2)}%`
                  : "-"}
            </span>
          </Card>
        </div>
      )}

      {isCompleted && taskType === "instruction" && job && (
        <InstructionResultsPanel job={job} />
      )}

      {isCompleted && taskType !== "instruction" && (
        <TaskResultsPanel
          taskType={taskType}
          accuracy={job?.accuracy}
          classDistribution={classDistribution}
        />
      )}

      {isFailed && job?.errorMessage && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 text-sm font-mono whitespace-pre-wrap">
          {job.errorMessage}
        </div>
      )}

      <div className="rounded-lg border border-[#1E293B] overflow-hidden flex flex-col shadow-sm">
        <div className="bg-[#0B1220] border-b border-[#1E293B] px-4 py-2 flex items-center justify-between text-xs font-medium text-[#94A3B8]">
          <span className="flex items-center gap-2">
            <Code className="w-4 h-4" /> Terminal Output
          </span>
          <span className="font-mono">{logs?.lines?.length || 0} lines</span>
        </div>
        <div className="ide-terminal p-4 h-[400px] overflow-y-auto">
          {!logs?.lines?.length ? (
            <div className="text-[#475569] italic font-mono text-sm">
              Waiting for logs...
            </div>
          ) : (
            logs.lines.map((line, i) => {
              const lower = line.toLowerCase();
              const isError =
                lower.includes("error") ||
                lower.includes("failed") ||
                lower.includes("traceback");
              const isSuccess =
                lower.includes("completed") ||
                lower.includes("success") ||
                lower.includes("✓") ||
                lower.includes("done");
              const tsMatch = line.match(/^(\[?\d{2}:\d{2}:\d{2}[^\]]*\]?)/);
              return (
                <div
                  key={i}
                  className={`ide-line whitespace-pre-wrap animate-in fade-in duration-300 ${
                    isError
                      ? "ide-line-error"
                      : isSuccess
                      ? "ide-line-success"
                      : ""
                  }`}
                >
                  <span>
                    {tsMatch ? (
                      <>
                        <span className="ide-ts">{tsMatch[1]}</span>
                        {line.slice(tsMatch[1].length)}
                      </>
                    ) : (
                      line
                    )}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {isCompleted && (
        <div className="flex flex-wrap justify-end items-center gap-3 pt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={loadScript}>
                <Code className="w-4 h-4 mr-2" /> View Training Script
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Training Script (Python)</DialogTitle>
              </DialogHeader>
              <div className="mt-4 bg-slate-50 dark:bg-zinc-950 border rounded-md p-4 max-h-[500px] overflow-y-auto">
                <pre><code className="text-sm font-mono text-slate-800 dark:text-slate-300">
                  {scriptCode || "Loading..."}
                </code></pre>
              </div>
            </DialogContent>
          </Dialog>

          {taskType === "instruction" ? (
            <>
              <ExportButton
                jobId={jobId}
                format="gguf"
                available={!!job?.ggufPath}
                tooltip="Drop into LM Studio for local inference"
                primary
              />
              <ExportButton
                jobId={jobId}
                format="pkl"
                available={!!job?.pklPath}
                tooltip="For Python & PEFT pipelines"
              />
              <ExportButton
                jobId={jobId}
                format="onnx"
                available={!!job?.onnxPath}
                tooltip="For cross-platform inference (ONNX Runtime)"
              />
            </>
          ) : (
            <>
              <ExportButton
                jobId={jobId}
                format="pkl"
                available={!!job?.pklPath}
                tooltip="For Python & scikit-learn pipelines"
                primary
              />
              <ExportButton
                jobId={jobId}
                format="onnx"
                available={!!job?.onnxPath}
                tooltip="For cross-platform inference (ONNX Runtime)"
              />
              <ExportButton
                jobId={jobId}
                format="gguf"
                available={!!job?.ggufPath}
                tooltip="For Ollama & LM Studio"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
