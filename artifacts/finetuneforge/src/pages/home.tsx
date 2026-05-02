import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Progress } from "@/components/ui/progress";
import { useCreateJob } from "@workspace/api-client-react";
import { DatasetPreview, CreateJobBodyLoraRank } from "@workspace/api-client-react";
import { StepModel } from "@/components/wizard/step-model";
import { StepData } from "@/components/wizard/step-data";
import { StepConfig } from "@/components/wizard/step-config";
import { StepTrain } from "@/components/wizard/step-train";

export interface WizardState {
  modelId: string;
  datasetPreview: DatasetPreview | null;
  textColumn: string;
  labelColumn: string;
  epochs: number;
  learningRate: number;
  loraRank: CreateJobBodyLoraRank;
  jobId: string | null;
}

const STEPS = ["Model", "Data", "Config", "Train"];

interface HomeProps {
  step: number;
  setStep: (step: number) => void;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
}

export default function Home({ step, setStep, state, setState }: HomeProps) {
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

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Fine-tune a Model</h1>
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {STEPS.length}
            </span>
          </div>
          
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
          {step === 4 && <StepTrain jobId={state.jobId} />}
        </div>
      </div>
    </Layout>
  );
}
