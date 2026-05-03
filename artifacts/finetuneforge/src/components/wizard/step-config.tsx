import { WizardState } from "@/pages/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Cpu, Zap, Info } from "lucide-react";
import { CreateJobBodyLoraRank, useListModels } from "@workspace/api-client-react";

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

  const handleSelectMode = (mode: "cpu" | "gpu") => {
    if (mode === state.computeMode) return;
    const updates: Partial<WizardState> = { computeMode: mode };
    if (mode === "cpu") {
      const selected = models?.find((m) => m.id === state.modelId);
      if (!selected || !(selected.computeModes ?? ["cpu"]).includes("cpu")) {
        updates.modelId = "distilbert-base-uncased";
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
            {state.computeMode === "gpu" && (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-200">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Requires Modal credits. Training runs on an A10G GPU.</span>
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
