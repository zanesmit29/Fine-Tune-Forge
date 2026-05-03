import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useCreateJob } from "@workspace/api-client-react";
import { DatasetPreview, CreateJobBodyLoraRank, CreateJobBodyComputeMode } from "@workspace/api-client-react";
import { StepModel } from "@/components/wizard/step-model";
import { StepData } from "@/components/wizard/step-data";
import { StepConfig } from "@/components/wizard/step-config";
import { StepTrain } from "@/components/wizard/step-train";
import { TaskSelector } from "@/components/wizard/task-selector";
import { getTaskType, type TaskTypeId } from "@/lib/task-types";

export interface WizardState {
  taskType: TaskTypeId | null;
  modelId: string;
  datasetPreview: DatasetPreview | null;
  textColumn: string;
  labelColumn: string;
  epochs: number;
  learningRate: number;
  loraRank: CreateJobBodyLoraRank;
  computeMode: CreateJobBodyComputeMode;
  jobId: string | null;
}

const STEPS = ["Model", "Data", "Config", "Train"];

function computeClassDistribution(state: WizardState): { label: string; count: number }[] | null {
  if (!state.datasetPreview || !state.labelColumn) return null;
  const counts = new Map<string, number>();
  for (const row of state.datasetPreview.previewRows) {
    const v = row[state.labelColumn];
    if (v == null || String(v).trim() === "") continue;
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  // Scale preview-row counts up to total dataset size proportionally
  const previewTotal = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const scale = previewTotal > 0 ? state.datasetPreview.rowCount / previewTotal : 1;
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count: Math.round(count * scale) }))
    .sort((a, b) => b.count - a.count);
}

interface HomeProps {
  step: number;
  setStep: (step: number) => void;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onSelectTaskType: (id: TaskTypeId) => void;
  onResetTaskType: () => void;
}

export default function Home({ step, setStep, state, setState, onSelectTaskType, onResetTaskType }: HomeProps) {
  const createJob = useCreateJob();
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStartTraining = () => {
    if (!state.modelId || !state.datasetPreview || !state.textColumn || !state.labelColumn) return;

    createJob.mutate(
      {
        data: {
          modelId: state.modelId,
          datasetId: state.datasetPreview.datasetId,
          textColumn: state.textColumn,
          labelColumn: state.labelColumn,
          epochs: state.epochs,
          learningRate: state.learningRate,
          loraRank: state.loraRank,
          computeMode: state.computeMode,
        },
      },
      {
        onSuccess: (job) => {
          setState((prev) => ({ ...prev, jobId: job.id }));
          setStep(4);
        },
      }
    );
  };

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  if (step === 0 || !state.taskType) {
    return <TaskSelector selected={state.taskType} onSelect={onSelectTaskType} />;
  }

  const task = getTaskType(state.taskType);
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={onResetTaskType}
                data-testid="button-change-task"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Change task
              </Button>
              {task && (
                <Badge
                  variant="outline"
                  className="bg-primary/5 border-primary/30 text-primary font-medium"
                >
                  {task.name}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Step {step} of {STEPS.length}
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {task?.name ?? "Fine-tune a Model"}
          </h1>

          <div className="relative">
            <Progress value={progress} className="h-2" />
            <div className="absolute top-4 left-0 right-0 flex justify-between px-1">
              {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isCompleted = step > stepNum;
                const isCurrent = step === stepNum;
                return (
                  <div
                    key={label}
                    className={`text-xs font-medium -translate-x-1/2 ${
                      isCurrent ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                    }`}
                    style={{ left: `${(i / (STEPS.length - 1)) * 100}%`, position: i === 0 || i === STEPS.length - 1 ? 'static' : 'absolute' }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 min-h-[400px]">
          {step === 1 && <StepModel state={state} updateState={updateState} onNext={handleNext} />}
          {step === 2 && <StepData state={state} updateState={updateState} onNext={handleNext} onBack={handleBack} />}
          {step === 3 && (
            <StepConfig
              state={state}
              updateState={updateState}
              onBack={handleBack}
              onStart={handleStartTraining}
              isPending={createJob.isPending}
            />
          )}
          {step === 4 && (
            <StepTrain
              jobId={state.jobId}
              taskType={state.taskType}
              classDistribution={computeClassDistribution(state)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
