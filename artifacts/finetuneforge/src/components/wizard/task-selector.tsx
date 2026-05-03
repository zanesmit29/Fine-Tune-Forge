import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
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
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">What do you want to fine-tune?</h1>
          <p className="text-muted-foreground">
            Pick a task type to get started. We'll pre-configure the wizard with the right
            models and dataset templates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TASK_TYPES.map((task) => {
            const Icon = task.icon;
            const isSelected = selected === task.id;
            const baseClasses =
              "relative h-full transition-all duration-200 group";
            const availableClasses = isSelected
              ? "cursor-pointer border-primary ring-2 ring-primary/30 shadow-md"
              : "cursor-pointer border-border hover:border-primary hover:shadow-md hover:-translate-y-0.5";
            const disabledClasses =
              "border-2 border-dashed border-muted-foreground/30 bg-muted/20 opacity-70 cursor-not-allowed";

            return (
              <Card
                key={task.id}
                onClick={() => task.available && onSelect(task.id)}
                className={`${baseClasses} ${
                  task.available ? availableClasses : disabledClasses
                }`}
                data-testid={`card-task-${task.id}`}
              >
                {isSelected && task.available && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1 shadow">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                )}
                {!task.available && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 text-[10px] uppercase tracking-wide">
                      Coming Soon
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.available
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-200/60 dark:bg-slate-800/60 text-[#9CA3AF]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-base ${
                        task.available ? "" : "text-[#9CA3AF]"
                      }`}
                    >
                      {task.name}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        task.available ? "text-muted-foreground" : "text-[#9CA3AF]"
                      }`}
                    >
                      {task.description}
                    </p>
                  </div>
                  <p
                    className={`text-xs italic ${
                      task.available ? "text-muted-foreground/80" : "text-[#9CA3AF]"
                    }`}
                  >
                    e.g. {task.example}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
