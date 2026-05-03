import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { TASK_TYPES, type TaskTypeId } from "@/lib/task-types";

export function TaskSelector({
  selected,
  onSelect,
}: {
  selected: TaskTypeId | null;
  onSelect: (id: TaskTypeId) => void;
}) {
  return (
    <Layout title="New Fine-Tune" breadcrumb="New Fine-Tune / Choose a task">
      <div className="max-w-6xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            What do you want to fine-tune?
          </h2>
          <p className="text-sm text-[#64748B]">
            Pick a task type to get started. We'll pre-configure the wizard
            with the right models and dataset templates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TASK_TYPES.map((task) => {
            const Icon = task.icon;
            const isSelected = selected === task.id;
            const disabled = !task.available;

            const baseClasses =
              "relative h-full p-5 transition-all duration-150 bg-white border";
            const stateClasses = disabled
              ? "border-[#E2E8F0] opacity-50 cursor-not-allowed"
              : isSelected
              ? "border-[#2563EB] ring-1 ring-[#2563EB] shadow-md cursor-pointer"
              : "border-[#E2E8F0] shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-[#CBD5E1]";

            return (
              <Card
                key={task.id}
                onClick={() => task.available && onSelect(task.id)}
                className={`${baseClasses} ${stateClasses}`}
                data-testid={`card-task-${task.id}`}
              >
                {disabled && (
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className="bg-[#F1F5F9] text-[#64748B] border-0 text-[10px] uppercase tracking-wide font-medium"
                    >
                      Coming Soon
                    </Badge>
                  </div>
                )}
                {isSelected && !disabled && (
                  <div className="absolute top-3 right-3 bg-[#2563EB] text-white rounded-full p-1">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${
                      disabled ? "bg-[#F1F5F9]" : "bg-[#EFF6FF]"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        disabled ? "text-[#94A3B8]" : "text-[#2563EB]"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {task.name}
                    </h3>
                    <p className="text-sm text-[#64748B] mt-1 leading-snug">
                      {task.description}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-3">
                      e.g. {task.example}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
