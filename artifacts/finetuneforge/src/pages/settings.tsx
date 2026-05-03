import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <Layout title="Settings" breadcrumb="Settings">
      <Card className="max-w-3xl p-12 flex flex-col items-center text-center gap-4 border border-[#E2E8F0] shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-[#2563EB]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Settings coming soon
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-md">
            Workspace, billing, and team preferences will live here.
          </p>
        </div>
      </Card>
    </Layout>
  );
}
