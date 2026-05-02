import { WizardState } from "@/pages/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { CreateJobBodyLoraRank } from "@workspace/api-client-react";

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
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold">Hyperparameters</h2>
        <p className="text-muted-foreground">Configure the training settings. We've provided safe defaults.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
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
