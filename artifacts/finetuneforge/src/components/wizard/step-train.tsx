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
import { Loader2, Download, Code, CheckCircle2, XCircle, Cpu, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ExportFmt = "pkl" | "onnx" | "gguf";

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

export function StepTrain({ jobId }: { jobId: string | null }) {
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
            <span className="text-sm text-muted-foreground mb-1">Accuracy</span>
            <span className="text-2xl font-mono font-bold text-primary">
              {job.accuracy ? `${(job.accuracy * 100).toFixed(2)}%` : "-"}
            </span>
          </Card>
        </div>
      )}

      {isFailed && job?.errorMessage && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 text-sm font-mono whitespace-pre-wrap">
          {job.errorMessage}
        </div>
      )}

      <Card className="border border-border shadow-sm overflow-hidden bg-white dark:bg-zinc-950 flex flex-col">
        <div className="border-b bg-muted/40 px-4 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-2"><Code className="w-4 h-4" /> Terminal Output</span>
          <span>{logs?.lines?.length || 0} lines</span>
        </div>
        <div className="p-4 h-[400px] overflow-y-auto font-mono text-sm terminal-log bg-white dark:bg-black text-slate-800 dark:text-slate-300">
          {!logs?.lines?.length ? (
            <div className="text-muted-foreground/50 italic">Waiting for logs...</div>
          ) : (
            logs.lines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap leading-relaxed animate-in fade-in duration-300">
                {line}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </Card>

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
        </div>
      )}
    </div>
  );
}
