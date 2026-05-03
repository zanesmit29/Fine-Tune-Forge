import { WizardState } from "@/pages/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Cpu, Zap, Info, MessageSquareCode, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import {
  CreateJobBodyLoraRank,
  useListModels,
  useGetModalStatus,
} from "@workspace/api-client-react";

export function StepConfig({
  state,
  updateState,
  onBack,
  onStart,
  isPending,
}: {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onBack: () => void;
  onStart: () => void;
  isPending: boolean;
}) {
  const { data: models } = useListModels();
  const { data: modalStatus } = useGetModalStatus();
  const modalConnected = !!modalStatus?.connected;
  const isInstruction = state.taskType === "instruction";
  const seqLengths = [128, 256, 512] as const;
  const seqIndex = Math.max(0, seqLengths.indexOf(state.maxSeqLength as 128 | 256 | 512));

  const handleSelectMode = (mode: "cpu" | "gpu") => {
    if (mode === state.computeMode) return;
    const updates: Partial<WizardState> = { computeMode: mode };
    if (mode === "cpu") {
      const selected = models?.find((m) => m.id === state.modelId);
      if (!selected || !(selected.computeModes ?? ["cpu"]).includes("cpu")) {
        // Pick a CPU-compatible fallback that matches the current task type.
        // Causal LM tasks need a generative model — never DistilBERT.
        const cpuFallback = isInstruction
          ? "Qwen/Qwen2.5-0.5B"
          : "distilbert-base-uncased";
        updates.modelId = cpuFallback;
      }
    }
    updateState(updates);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold">Hyperparameters</h2>
        <p className="text-muted-foreground">Configure the training settings. We've provided safe defaults.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Compute</Label>
            <p className="text-sm text-muted-foreground -mt-2">
              Choose where this fine-tuning job runs.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSelectMode("cpu")}
                className={`flex items-center justify-center gap-2 rounded-full border-2 py-3 px-4 text-sm font-medium transition-colors ${
                  state.computeMode === "cpu"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                }`}
                data-testid="button-compute-cpu"
              >
                <Cpu className="w-4 h-4" /> CPU (Free)
              </button>
              <button
                type="button"
                onClick={() => handleSelectMode("gpu")}
                className={`flex items-center justify-center gap-2 rounded-full border-2 py-3 px-4 text-sm font-medium transition-colors ${
                  state.computeMode === "gpu"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                }`}
                data-testid="button-compute-gpu"
              >
                <Zap className="w-4 h-4" /> GPU (Modal A10G)
                <Badge className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px] px-1.5 py-0">
                  Faster · Larger models
                </Badge>
              </button>
            </div>
            {state.computeMode === "gpu" && !modalConnected && (
              <div
                className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
                data-testid="banner-modal-not-connected"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  GPU training requires a Modal account. Connect yours in
                  Integrations →{" "}
                  <Link
                    href="/integrations"
                    className="font-medium text-blue-700 dark:text-blue-300 hover:underline"
                    data-testid="link-go-to-integrations"
                  >
                    Go to Integrations
                  </Link>
                </span>
              </div>
            )}
            {state.computeMode === "gpu" && modalConnected && (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-200">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Training on Modal A10G GPU ⚡ — runs under your Modal account.</span>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Epochs</Label>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{state.epochs}</span>
            </div>
            <p className="text-sm text-muted-foreground">Number of times the model will iterate over the entire dataset.</p>
            <Slider
              value={[state.epochs]}
              min={1}
              max={5}
              step={1}
              onValueChange={([val]) => updateState({ epochs: val })}
              className="pt-4"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Learning Rate</Label>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{state.learningRate}</span>
            </div>
            <p className="text-sm text-muted-foreground">Controls how much the model's weights are updated during training.</p>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[0.0001, 0.0002, 0.0005, 0.001].map((lr) => (
                <Button
                  key={lr}
                  variant={state.learningRate === lr ? "default" : "outline"}
                  onClick={() => updateState({ learningRate: lr })}
                  className="font-mono text-xs h-9"
                >
                  {lr}
                </Button>
              ))}
            </div>
          </div>

          {isInstruction && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2 rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-200">
                <MessageSquareCode className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Causal language modeling with chat template:
                  <code className="ml-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 font-mono text-[11px]">
                    ### Instruction:\n{"{instruction}"}\n### Response:\n{"{response}"}
                  </code>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Max sequence length</Label>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {state.maxSeqLength} tokens
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Longer sequences cover bigger Q&amp;A pairs but slow down training.
              </p>
              <Slider
                value={[seqIndex]}
                min={0}
                max={2}
                step={1}
                onValueChange={([val]) =>
                  updateState({ maxSeqLength: seqLengths[val] })
                }
                className="pt-4"
                data-testid="slider-max-seq-length"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                {seqLengths.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <Label className="text-base font-semibold">LoRA Rank (r)</Label>
              <p className="text-sm text-muted-foreground mt-1">Lower rank = faster, smaller footprint. Higher rank = better capacity to learn.</p>
            </div>
            
            <RadioGroup 
              value={state.loraRank.toString()} 
              onValueChange={(val) => updateState({ loraRank: parseInt(val) as CreateJobBodyLoraRank })}
              className="grid grid-cols-3 gap-4 pt-2"
            >
              {[4, 8, 16].map((rank) => (
                <div key={rank} className="relative">
                  <RadioGroupItem value={rank.toString()} id={`r-${rank}`} className="peer sr-only" />
                  <Label
                    htmlFor={`r-${rank}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-xl font-bold font-mono">{rank}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {rank === 4 ? "Fastest" : rank === 8 ? "Balanced" : "Highest Capacity"}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isPending}>Back</Button>
        <Button onClick={onStart} disabled={isPending} size="lg" className="min-w-[150px]">
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</> : "Start Training"}
        </Button>
      </div>
    </div>
  );
}
