import { useState, useEffect, useRef } from "react";
import { useGetJobStats, useListJobs, useGetJob, useGetJobLogs } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Loader2, Code, Download, ChevronRight } from "lucide-react";

function JobStatusBadge({ status }: { status: string }) {
  const isRunning = status === "running" || status === "queued";
  return (
    <Badge
      variant={status === "completed" ? "default" : status === "failed" ? "destructive" : "secondary"}
      className={isRunning ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" : ""}
    >
      {status}
    </Badge>
  );
}

function JobDetailSheet({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [scriptCode, setScriptCode] = useState<string | null>(null);

  const { data: job } = useGetJob(jobId, {
    query: {
      enabled: open,
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === "running" || s === "queued" ? 2000 : false;
      },
    },
  });

  const { data: logs } = useGetJobLogs(jobId, {
    query: {
      enabled: open,
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === "running" || s === "queued" ? 2000 : false;
      },
    },
  });

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs?.lines]);

  // Reset script when job changes
  useEffect(() => {
    setScriptCode(null);
  }, [jobId]);

  const loadScript = async () => {
    if (scriptCode) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/download/script`);
      if (res.ok) setScriptCode(await res.text());
    } catch (e) {
      console.error(e);
    }
  };

  const isCompleted = job?.status === "completed";
  const isFailed = job?.status === "failed";
  const isRunning = job?.status === "running" || job?.status === "queued";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-6 p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            {isRunning && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {isFailed && <XCircle className="w-5 h-5 text-destructive" />}
            {job?.modelName || "Loading…"}
            {job && <JobStatusBadge status={job.status} />}
          </SheetTitle>
        </SheetHeader>

        {/* Meta */}
        {job && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Job ID</span>
            <span className="font-mono text-xs truncate">{job.id}</span>
            <span className="text-muted-foreground">Dataset</span>
            <span className="font-mono text-xs truncate">{job.datasetId.slice(0, 16)}…</span>
            <span className="text-muted-foreground">Epochs</span>
            <span>{job.epochs}</span>
            <span className="text-muted-foreground">Learning Rate</span>
            <span>{job.learningRate}</span>
            <span className="text-muted-foreground">LoRA Rank</span>
            <span>{job.loraRank}</span>
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}</span>
          </div>
        )}

        {/* Metrics */}
        {(isCompleted || isFailed) && job && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Train Loss</p>
              <p className="text-xl font-mono font-bold">{job.trainLoss?.toFixed(4) ?? "—"}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Eval Loss</p>
              <p className="text-xl font-mono font-bold">{job.evalLoss?.toFixed(4) ?? "—"}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
              <p className="text-xl font-mono font-bold text-primary">
                {job.accuracy ? `${(job.accuracy * 100).toFixed(2)}%` : "—"}
              </p>
            </Card>
          </div>
        )}

        {/* Error */}
        {isFailed && job?.errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20 text-xs font-mono whitespace-pre-wrap">
            {job.errorMessage}
          </div>
        )}

        {/* Logs */}
        <div className="flex flex-col flex-1 min-h-0">
          <Card className="border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="border-b bg-muted/40 px-4 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-2"><Code className="w-3.5 h-3.5" /> Terminal Output</span>
              <span>{logs?.lines?.length ?? 0} lines</span>
            </div>
            <div className="p-4 h-72 overflow-y-auto font-mono text-xs bg-white dark:bg-black text-slate-800 dark:text-slate-300">
              {!logs?.lines?.length ? (
                <span className="text-muted-foreground/50 italic">No logs available.</span>
              ) : (
                logs.lines.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">{line}</div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </Card>
        </div>

        {/* Actions */}
        {isCompleted && (
          <div className="flex gap-3 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={loadScript}>
                  <Code className="w-4 h-4 mr-2" /> View Script
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Training Script (Python)</DialogTitle>
                </DialogHeader>
                <div className="mt-4 bg-slate-50 dark:bg-zinc-950 border rounded-md p-4 max-h-[500px] overflow-y-auto">
                  <pre><code className="text-sm font-mono text-slate-800 dark:text-slate-300">{scriptCode || "Loading…"}</code></pre>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" asChild>
              <a href={`/api/jobs/${jobId}/download/model`} download>
                <Download className="w-4 h-4 mr-2" /> Download Model
              </a>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function History() {
  const { data: stats } = useGetJobStats();
  const { data: jobs, isLoading: jobsLoading } = useListJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training History</h1>
          <p className="text-muted-foreground mt-2">Click any run to view its logs and metrics.</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Jobs", value: stats.total, color: "" },
              { label: "Completed", value: stats.completed, color: "text-green-600" },
              { label: "Running", value: stats.running, color: "text-blue-600" },
              { label: "Failed", value: stats.failed, color: "text-destructive" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${color}`}>{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Dataset ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading jobs…
                  </TableCell>
                </TableRow>
              ) : jobs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No jobs found. Start your first fine-tuning run from the Wizard.
                  </TableCell>
                </TableRow>
              ) : (
                jobs?.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <TableCell className="font-medium">{job.modelName}</TableCell>
                    <TableCell className="font-mono text-xs">{job.datasetId.slice(0, 8)}…</TableCell>
                    <TableCell><JobStatusBadge status={job.status} /></TableCell>
                    <TableCell>{job.accuracy ? `${(job.accuracy * 100).toFixed(1)}%` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {selectedJobId && (
        <JobDetailSheet
          jobId={selectedJobId}
          open={!!selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </Layout>
  );
}
