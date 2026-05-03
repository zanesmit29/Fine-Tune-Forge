import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import History from "@/pages/history";
import type { WizardState } from "@/pages/home";
import type { CreateJobBodyLoraRank } from "@workspace/api-client-react";

const queryClient = new QueryClient();

const defaultWizardState: WizardState = {
  modelId: "",
  datasetPreview: null,
  textColumn: "",
  labelColumn: "",
  epochs: 3,
  learningRate: 0.0002,
  loraRank: 8 as CreateJobBodyLoraRank,
  computeMode: "cpu",
  jobId: null,
};

function App() {
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardState, setWizardState] = useState<WizardState>(defaultWizardState);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/">
              <Home
                step={wizardStep}
                setStep={setWizardStep}
                state={wizardState}
                setState={setWizardState}
              />
            </Route>
            <Route path="/history" component={History} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
