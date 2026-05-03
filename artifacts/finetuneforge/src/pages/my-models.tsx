import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Sparkles,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  Cpu,
  Zap,
  Pencil,
  Check,
  X,
  Inbox,
} from "lucide-react";
import {
  useListTrainedModels,
  useRenameTrainedModel,
  useDeleteTrainedModel,
  getListTrainedModelsQueryKey,
  type TrainingJob,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useNavHighlight } from "@/lib/nav-highlight";
import { TASK_TYPES } from "@/lib/task-types";

type SortKey = "createdAt" | "accuracy" | "taskType";
type SortDir = "asc" | "desc";

const TASK_LABEL: Record<string, string> = Object.fromEntries(
  TASK_TYPES.map((t) => [t.id, t.name]),
);

const TASK_CHIP_CLASS: Record<string, string> = {
  classification: "bg-blue-100 text-blue-800 border-blue-200",
  sentiment: "bg-purple-100 text-purple-800 border-purple-200",
  ner: "bg-emerald-100 text-emerald-800 border-emerald-200",
  summarization: "bg-amber-100 text-amber-800 border-amber-200",
  qa: "bg-pink-100 text-pink-800 border-pink-200",
  instruction: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

function defaultDisplayName(job: TrainingJob): string {
  const taskShort = job.taskType
    ? (TASK_LABEL[job.taskType] ?? job.taskType).replace(/Analysis|Recognition|Classification/i, (m) => m.split(" ")[0])
    : "Fine-Tune";
  const date = format(new Date(job.createdAt), "MMM d");
  return `${job.modelName} · ${taskShort} · ${date}`;
}

function accuracyTone(acc: number | null | undefined): {
  color: string;
  fill: string;
} {
  if (acc == null) return { color: "text-muted-foreground", fill: "bg-muted" };
  const pct = acc * 100;
  if (pct >= 80) return { color: "text-green-700", fill: "bg-green-500" };
  if (pct >= 60) return { color: "text-amber-700", fill: "bg-amber-500" };
  return { color: "text-red-700", fill: "bg-red-500" };
}

function TaskChip({ taskType }: { taskType: string | null }) {
  if (!taskType) return <span className="text-xs text-muted-foreground">—</span>;
  const label = TASK_LABEL[taskType] ?? taskType;
  const cls = TASK_CHIP_CLASS[taskType] ?? "bg-slate-100 text-slate-800 border-slate-200";
  return (
    <Badge variant="outline" className={`${cls} font-medium`}>
      {label}
    </Badge>
  );
}

function ComputeBadge({ mode }: { mode: "cpu" | "gpu" }) {
  return mode === "gpu" ? (
    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 gap-1">
      <Zap className="w-3 h-3" /> GPU
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
      <Cpu className="w-3 h-3" /> CPU
    </Badge>
  );
}

function AccuracyCell({ accuracy }: { accuracy: number | null }) {
  const { color, fill } = accuracyTone(accuracy);
  if (accuracy == null) return <span className="text-muted-foreground font-mono">—</span>;
  return (
    <span className={`inline-flex items-center gap-2 ${color} font-medium font-mono text-sm`}>
      <span className={`inline-block w-2 h-2 rounded-full ${fill}`} />
      {(accuracy * 100).toFixed(1)}%
    </span>
  );
}

function NicknameCell({
  job,
  onSaved,
}: {
  job: TrainingJob;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(job.nickname ?? defaultDisplayName(job));
  const rename = useRenameTrainedModel();
  const { toast } = useToast();

  useEffect(() => {
    setValue(job.nickname ?? defaultDisplayName(job));
  }, [job.id, job.nickname, job.createdAt, job.modelName, job.taskType]);

  const save = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(job.nickname ?? defaultDisplayName(job));
      setEditing(false);
      return;
    }
    rename.mutate(
      { jobId: job.id, data: { nickname: trimmed } },
      {
        onSuccess: () => {
          setEditing(false);
          onSaved();
          toast({ title: "Renamed", description: "Model name updated." });
        },
        onError: () => {
          toast({ title: "Rename failed", variant: "destructive" });
        },
      },
    );
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(job.nickname ?? defaultDisplayName(job));
              setEditing(false);
            }
          }}
          className="h-8 text-sm"
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save} disabled={rename.isPending}>
          <Check className="w-4 h-4 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => {
            setValue(job.nickname ?? defaultDisplayName(job));
            setEditing(false);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-2 text-left font-medium hover:text-primary transition-colors"
      data-testid={`button-rename-${job.id}`}
    >
      <span className="truncate max-w-[28ch]">{job.nickname ?? defaultDisplayName(job)}</span>
      <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
    </button>
  );
}

function DownloadMenu({ jobId }: { jobId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem asChild>
          <a href={`/api/jobs/${jobId}/download/pkl`} download>PKL</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/api/jobs/${jobId}/download/onnx`} download>ONNX</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/api/jobs/${jobId}/download/gguf`} download>GGUF</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteButton({ job, onDeleted }: { job: TrainingJob; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const del = useDeleteTrainedModel();
  const { toast } = useToast();

  const confirm = () => {
    del.mutate(
      { jobId: job.id },
      {
        onSuccess: () => {
          setOpen(false);
          onDeleted();
          toast({ title: "Deleted", description: "Model removed." });
        },
        onError: () => {
          toast({ title: "Delete failed", variant: "destructive" });
        },
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
          data-testid={`button-delete-${job.id}`}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-medium mb-1">Delete this model?</p>
        <p className="text-xs text-muted-foreground mb-3">This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" onClick={confirm} disabled={del.isPending}>
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
        {active && (dir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
      </button>
    </TableHead>
  );
}

export default function MyModels() {
  const { data: models, isLoading } = useListTrainedModels();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { clearHighlight } = useNavHighlight();
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Clear nav highlight once the user lands on this page
  useEffect(() => {
    clearHighlight();
  }, [clearHighlight]);

  const onSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "createdAt" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    if (!models) return [];
    const arr = [...models];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "accuracy") {
        cmp = (a.accuracy ?? -1) - (b.accuracy ?? -1);
      } else if (sortKey === "taskType") {
        cmp = (a.taskType ?? "").localeCompare(b.taskType ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [models, sortKey, sortDir]);

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: getListTrainedModelsQueryKey() });

  return (
    <Layout title="My Models" breadcrumb={`My Models${sorted.length ? ` / ${sorted.length}` : ""}`}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">Trained Models</h2>
          <p className="text-sm text-[#64748B] mt-1">
            {isLoading
              ? "Loading…"
              : `${sorted.length} model${sorted.length === 1 ? "" : "s"} trained`}
          </p>
        </div>

        {!isLoading && sorted.length === 0 ? (
          <Card className="py-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No models yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Train a model to see it here.
              </p>
            </div>
            <Button
              onClick={() => setLocation("/app")}
              className="gap-2"
              data-testid="button-start-first-finetune"
            >
              <Sparkles className="w-4 h-4" /> Start your first fine-tune
            </Button>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden md:block overflow-hidden border border-[#E2E8F0] shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 bg-[#F8FAFC] z-10">
                  <TableRow className="hover:bg-transparent border-b border-[#E2E8F0]">
                    <TableHead>Name</TableHead>
                    <SortHeader
                      label="Task"
                      sortKey="taskType"
                      current={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                    <TableHead>Base Model</TableHead>
                    <TableHead>Dataset</TableHead>
                    <SortHeader
                      label="Accuracy"
                      sortKey="accuracy"
                      current={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                    <TableHead>Compute</TableHead>
                    <SortHeader
                      label="Trained"
                      sortKey="createdAt"
                      current={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((job, idx) => (
                    <TableRow
                      key={job.id}
                      className={`h-[52px] transition-colors hover:!bg-[#F1F5F9] ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                      }`}
                    >
                      <TableCell>
                        <NicknameCell job={job} onSaved={refetch} />
                      </TableCell>
                      <TableCell>
                        <TaskChip taskType={job.taskType ?? null} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {job.modelId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[20ch]">
                        {job.datasetName ?? `${job.datasetId.slice(0, 8)}…`}
                      </TableCell>
                      <TableCell>
                        <AccuracyCell accuracy={job.accuracy ?? null} />
                      </TableCell>
                      <TableCell>
                        <ComputeBadge mode={job.computeMode} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(job.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex"><DownloadMenu jobId={job.id} /></span>
                            </TooltipTrigger>
                            <TooltipContent>Download model</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex"><DeleteButton job={job} onDeleted={refetch} /></span>
                            </TooltipTrigger>
                            <TooltipContent>Delete model</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {sorted.map((job) => (
                <Card key={job.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <NicknameCell job={job} onSaved={refetch} />
                    <ComputeBadge mode={job.computeMode} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskChip taskType={job.taskType ?? null} />
                    <AccuracyCell accuracy={job.accuracy ?? null} />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div><span className="font-medium text-foreground">Base:</span> <span className="font-mono">{job.modelId}</span></div>
                    <div><span className="font-medium text-foreground">Dataset:</span> {job.datasetName ?? `${job.datasetId.slice(0, 8)}…`}</div>
                    <div><span className="font-medium text-foreground">Trained:</span> {format(new Date(job.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <DownloadMenu jobId={job.id} />
                    <DeleteButton job={job} onDeleted={refetch} />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
