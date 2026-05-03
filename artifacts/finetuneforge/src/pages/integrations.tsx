import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  useGetModalStatus,
  useConnectModal,
  useDisconnectModal,
  useTestModalConnection,
  getGetModalStatusQueryKey,
} from "@workspace/api-client-react";

function ModalLogo() {
  return (
    <div className="w-10 h-10 rounded-md bg-[#0F172A] flex items-center justify-center text-white font-bold text-lg">
      M
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-[#10B981]" : "bg-[#94A3B8]"
        }`}
      />
      <span
        className={`text-sm font-medium ${
          connected ? "text-[#059669]" : "text-[#94A3B8]"
        }`}
      >
        {connected ? "Connected" : "Not connected"}
      </span>
    </div>
  );
}

function ComingSoonCard({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <Card className="p-5 border border-[#E2E8F0] shadow-sm opacity-50 cursor-not-allowed">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="font-semibold text-[#0F172A]">{name}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-[#64748B]">{description}</p>
    </Card>
  );
}

function ModalCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const statusKey = getGetModalStatusQueryKey();
  const { data: status, isLoading } = useGetModalStatus();

  const [tokenId, setTokenId] = useState("");
  const [tokenSecret, setTokenSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [helpOpen, setHelpOpen] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testResult, setTestResult] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const connect = useConnectModal();
  const disconnect = useDisconnectModal();
  const test = useTestModalConnection();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: statusKey });

  const handleConnect = () => {
    if (!tokenId.trim() || !tokenSecret.trim()) return;
    setTestResult(null);
    connect.mutate(
      { data: { tokenId: tokenId.trim(), tokenSecret: tokenSecret.trim() } },
      {
        onSuccess: () => {
          toast({
            title: "Modal connected",
            description: "GPU training is now available.",
          });
          setTokenId("");
          setTokenSecret("");
          invalidate();
        },
        onError: (err) => {
          const message =
            err instanceof Error
              ? err.message
              : "Could not connect to Modal. Check your credentials.";
          toast({
            title: "Connection failed",
            description: message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDisconnect = () => {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        setTestResult(null);
        toast({ title: "Modal disconnected" });
        invalidate();
      },
    });
  };

  const handleTest = () => {
    setTestResult(null);
    test.mutate(undefined, {
      onSuccess: () => {
        setTestResult({
          kind: "success",
          message: "Modal credentials are valid.",
        });
        invalidate();
      },
      onError: (err) => {
        const message =
          err instanceof Error
            ? err.message
            : "Modal rejected the stored credentials.";
        setTestResult({ kind: "error", message });
      },
    });
  };

  const connected = !!status?.connected;

  return (
    <Card
      className="p-6 border border-[#E2E8F0] shadow-sm"
      data-testid="card-integration-modal"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <ModalLogo />
          <div>
            <div className="font-semibold text-[#0F172A] leading-tight">
              Modal
            </div>
            <div className="text-sm text-[#64748B]">GPU Compute</div>
          </div>
        </div>
        {!isLoading && <StatusBadge connected={connected} />}
      </div>

      {connected ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-3 py-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Modal connected successfully. GPU training is now available.</span>
          </div>

          <div className="text-sm space-y-1">
            <div className="text-[#64748B]">
              Token ID:{" "}
              <span className="font-mono text-[#0F172A]">
                {status?.maskedTokenId ?? "—"}
              </span>
            </div>
            <div className="text-[#64748B]">
              Last verified:{" "}
              <span className="text-[#0F172A]">
                {status?.verifiedAt
                  ? new Date(status.verifiedAt).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>

          {testResult && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                testResult.kind === "success"
                  ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                  : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[#FECACA] text-[#B91C1C] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                  data-testid="button-disconnect-modal"
                >
                  Disconnect
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-[#0F172A]">
                    Disconnect Modal?
                  </div>
                  <p className="text-sm text-[#64748B]">
                    Your Modal credentials will be cleared from this session.
                    GPU training will be unavailable until you reconnect.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                      onClick={handleDisconnect}
                      disabled={disconnect.isPending}
                      data-testid="button-confirm-disconnect"
                    >
                      {disconnect.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              onClick={handleTest}
              disabled={test.isPending}
              data-testid="button-test-modal"
            >
              {test.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test connection"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-[#475569]">
            Modal provides on-demand GPU compute for training larger models like
            Mistral-7B and Llama-3.2-3B. Connect your Modal account to unlock
            GPU training.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#475569]">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-[#64748B] shrink-0" />
              <span>Free tier: $30/month in compute credits</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-[#64748B] shrink-0" />
              <span>GPU: A10G — ~$2.07/hr</span>
            </div>
          </div>

          <a
            href="https://modal.com/signup"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
            data-testid="link-modal-signup"
          >
            Don't have a Modal account?
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-token-id">Modal Token ID</Label>
              <Input
                id="modal-token-id"
                type="text"
                placeholder="ak-..."
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                data-testid="input-modal-token-id"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-token-secret">Modal Token Secret</Label>
              <div className="relative">
                <Input
                  id="modal-token-secret"
                  type={showSecret ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={tokenSecret}
                  onChange={(e) => setTokenSecret(e.target.value)}
                  className="pr-10"
                  data-testid="input-modal-token-secret"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0F172A]"
                  aria-label={showSecret ? "Hide secret" : "Show secret"}
                  data-testid="button-toggle-secret"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Accordion
              type="single"
              collapsible
              value={helpOpen}
              onValueChange={setHelpOpen}
              className="border-none"
            >
              <AccordionItem value="help" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-[#64748B] hover:no-underline">
                  Where do I find these?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#64748B]">
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      Go to{" "}
                      <a
                        href="https://modal.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2563EB] hover:underline"
                      >
                        modal.com
                      </a>{" "}
                      and sign in
                    </li>
                    <li>Navigate to Settings → API Tokens</li>
                    <li>Click "New Token" and copy both values here</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Button
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            onClick={handleConnect}
            disabled={
              connect.isPending || !tokenId.trim() || !tokenSecret.trim()
            }
            data-testid="button-connect-modal"
          >
            {connect.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Modal"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

function PrivacyInfoBox() {
  return (
    <div className="rounded-md bg-[#EFF6FF] border border-[#BFDBFE] p-4 flex items-start gap-3">
      <Info className="w-4 h-4 mt-0.5 text-[#2563EB] shrink-0" />
      <div className="text-sm text-[#1E3A8A]">
        <div className="font-semibold mb-1">Your credentials stay private</div>
        <p className="text-[#1E40AF]">
          Your Modal API keys are stored as environment variables in your
          session and are never logged, shared, or stored on our servers. All
          GPU training jobs run under your own Modal account — so you have full
          visibility into usage and costs at modal.com/usage.
        </p>
      </div>
    </div>
  );
}

export default function Integrations() {
  return (
    <Layout title="Integrations" breadcrumb="Integrations">
      <div className="max-w-[640px] mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">Integrations</h2>
          <p className="text-sm text-[#64748B] mt-1">
            Connect your own compute providers. Your credentials are stored
            securely and never shared.
          </p>
        </div>

        <ModalCard />

        <PrivacyInfoBox />

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
            More integrations coming soon
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ComingSoonCard
              name="RunPod"
              description="Alternative GPU compute provider"
            />
            <ComingSoonCard
              name="Hugging Face Hub"
              description="Push trained models directly to your HF Hub repository"
            />
            <ComingSoonCard
              name="AWS S3"
              description="Store model exports in your own bucket"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
