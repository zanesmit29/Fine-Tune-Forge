import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft } from "lucide-react";
import { useCreateJob } from "@workspace/api-client-react";
import {
  DatasetPreview,
  CreateJobBodyLoraRank,
  CreateJobBodyComputeMode,
} from "@workspace/api-client-react";
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
  datasetName: string | null;
  textColumn: string;
  labelColumn: string;
  epochs: number;
  learningRate: number;
  loraRank: CreateJobBodyLoraRank;
  computeMode: CreateJobBodyComputeMode;
  jobId: string | null;
}

const STEPS = ["Model", "Data", "Config", "Train"];

function computeClassDistribution(
  state: WizardState,
): { label: string; count: number }[] | null {
  if (!state.datasetPreview || !state.labelColumn) return null;
  const counts = new Map<string, number>();
  for (const row of state.datasetPreview.previewRows) {
    const v = row[state.labelColumn];
    if (v == null || String(v).trim() === "") continue;
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const previewTotal = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const scale =
    previewTotal > 0 ? state.datasetPreview.rowCount / previewTotal : 1;
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
  onTrainingStarted?: () => void;
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="hidden md:block w-[200px] shrink-0 border-r border-[#E2E8F0] py-8 pl-6 pr-4">
      <ol className="relative space-y-6">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={label} className="relative flex items-start gap-3">
              {!isLast && (
                <span
                  className={`absolute left-[11px] top-6 w-px h-8 ${
                    isCompleted ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
                  }`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold shrink-0 ${
                  isCompleted
                    ? "bg-[#2563EB] text-white"
                    : isActive
                    ? "bg-white border-2 border-[#2563EB] text-[#2563EB]"
                    : "bg-white border border-[#CBD5E1] text-[#94A3B8]"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  stepNum
                )}
              </span>
              <div className="pt-0.5">
                <div
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-[#0F172A]"
                      : isCompleted
                      ? "text-[#475569]"
                      : "text-[#94A3B8]"
                  }`}
                >
                  {label}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Home({
  step,
  setStep,
  state,
  setState,
  onSelectTaskType,
  onResetTaskType,
  onTrainingStarted,
}: HomeProps) {
  const createJob = useCreateJob();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStartTraining = () => {
    if (
      !state.modelId ||
      !state.datasetPreview ||
      !state.textColumn ||
      !state.labelColumn
    )
      return;

    createJob.mutate(
      {
        data: {
          modelId: state.modelId,
          taskType: state.taskType,
          datasetId: state.datasetPreview.datasetId,
          datasetName: state.datasetName ?? null,
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
          onTrainingStarted?.();
        },
      },
    );
  };

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  if (step === 0 || !state.taskType) {
    return (
      <TaskSelector selected={state.taskType} onSelect={onSelectTaskType} />
    );
  }

  const task = getTaskType(state.taskType);
  const breadcrumb = `New Fine-Tune / ${task?.name ?? "Fine-Tune"} / Step ${step} of ${STEPS.length}`;

  return (
    <Layout title="New Fine-Tune" breadcrumb={breadcrumb}>
      <div className="max-w-[900px] mx-auto">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 -ml-2 text-[#64748B] hover:text-[#0F172A]"
            onClick={onResetTaskType}
            data-testid="button-change-task"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Change task
          </Button>
        </div>

        <Card className="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex">
            <StepIndicator step={step} />
            <div className="flex-1 p-8 min-w-0">
              {step === 1 && (
                <StepModel
                  state={state}
                  updateState={updateState}
                  onNext={handleNext}
                />
              )}
              {step === 2 && (
                <StepData
                  state={state}
                  updateState={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
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
        </Card>
      </div>
    </Layout>
  );
}
