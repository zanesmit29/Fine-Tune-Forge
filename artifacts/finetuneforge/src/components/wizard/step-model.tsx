import { WizardState } from "@/pages/home";
import { useListModels } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, Cpu, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StepModel({
  state,
  updateState,
  onNext,
}: {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}) {
  const { data: models, isLoading } = useListModels();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold">Select Base Model</h2>
        <p className="text-muted-foreground">Choose a pre-trained model to fine-tune for your specific task.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {models?.map((model) => (
            <Card
              key={model.id}
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                state.modelId === model.id ? "border-primary ring-1 ring-primary shadow-sm" : ""
              }`}
              onClick={() => updateState({ modelId: model.id })}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5 text-primary" />
                      {model.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{model.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono">{model.taskType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  {model.paramCount} Params
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  ~{model.estimatedMinutes}m est.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} disabled={!state.modelId} size="lg">
          Continue to Data
        </Button>
      </div>
    </div>
  );
}
