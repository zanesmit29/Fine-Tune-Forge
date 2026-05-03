import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import History from "@/pages/history";
import MyModels from "@/pages/my-models";
import Integrations from "@/pages/integrations";
import GetStarted from "@/pages/get-started";
import Settings from "@/pages/settings";
import { NavHighlightContext } from "@/lib/nav-highlight";
import type { WizardState } from "@/pages/home";
import type { CreateJobBodyLoraRank } from "@workspace/api-client-react";
import type { TaskTypeId } from "@/lib/task-types";

const queryClient = new QueryClient();

const defaultWizardState: WizardState = {
  taskType: null,
  modelId: "",
  datasetPreview: null,
  datasetName: null,
  textColumn: "",
  labelColumn: "",
  epochs: 3,
  learningRate: 0.0002,
  loraRank: 8 as CreateJobBodyLoraRank,
  maxSeqLength: 256,
  computeMode: "cpu",
  jobId: null,
};

function App() {
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardState, setWizardState] = useState<WizardState>(defaultWizardState);
  const [highlightMyModels, setHighlightMyModels] = useState(false);

  const setTaskType = (id: TaskTypeId) => {
    setWizardState({ ...defaultWizardState, taskType: id });
    setWizardStep(1);
  };

  const resetWizard = () => {
    setWizardState(defaultWizardState);
    setWizardStep(0);
  };

  const triggerHighlight = () => {
    setHighlightMyModels(true);
    window.setTimeout(() => setHighlightMyModels(false), 6000);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NavHighlightContext.Provider
          value={{
            highlightMyModels,
            clearHighlight: () => setHighlightMyModels(false),
          }}
        >
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/app">
                <Home
                  step={wizardStep}
                  setStep={setWizardStep}
                  state={wizardState}
                  setState={setWizardState}
                  onSelectTaskType={setTaskType}
                  onResetTaskType={resetWizard}
                  onTrainingStarted={triggerHighlight}
                />
              </Route>
              <Route path="/my-models" component={MyModels} />
              <Route path="/history" component={History} />
              <Route path="/get-started" component={GetStarted} />
              <Route path="/integrations" component={Integrations} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </NavHighlightContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
