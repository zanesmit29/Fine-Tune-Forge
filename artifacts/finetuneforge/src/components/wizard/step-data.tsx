import { useState } from "react";
import { WizardState } from "@/pages/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Table as TableIcon, Sparkles, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DatasetPreview } from "@workspace/api-client-react";
import { getTaskType, type TaskTemplate } from "@/lib/task-types";

export function StepData({
  state,
  updateState,
  onNext,
  onBack,
}: {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const { toast } = useToast();
  const task = getTaskType(state.taskType);

  const uploadFile = async (file: File): Promise<DatasetPreview | null> => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
      return null;
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return await res.json();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await uploadFile(file);
      if (!data) return;
      updateState({
        datasetPreview: data,
        datasetName: file.name,
        textColumn: data.detectedTextColumn || data.columns[0] || "",
        labelColumn: data.detectedLabelColumn || data.columns[1] || "",
      });
      toast({ title: "Upload successful", description: `Parsed ${data.rowCount} rows.` });
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not process CSV.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseTemplate = async (tpl: TaskTemplate) => {
    setLoadingTemplateId(tpl.id);
    try {
      const url = `${import.meta.env.BASE_URL}templates/${tpl.filename}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load template");
      const blob = await res.blob();
      const file = new File([blob], tpl.filename, { type: "text/csv" });
      const data = await uploadFile(file);
      if (!data) return;
      updateState({
        datasetPreview: data,
        datasetName: tpl.name,
        textColumn: data.detectedTextColumn || tpl.textColumn,
        labelColumn: data.detectedLabelColumn || tpl.labelColumn,
      });
      toast({ title: "Template loaded", description: `${tpl.name} (${data.rowCount} rows).` });
    } catch (err) {
      toast({ title: "Template failed", description: "Could not load template.", variant: "destructive" });
    } finally {
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold">Upload Training Data</h2>
        <p className="text-muted-foreground">
          {task
            ? `Use a ready-made ${task.name} template, or upload your own CSV.`
            : "Upload a CSV file containing your examples and labels."}
        </p>
      </div>

      {!state.datasetPreview && task && task.templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Starter Templates</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {task.templates.map((tpl) => {
              const isLoading = loadingTemplateId === tpl.id;
              return (
                <Card key={tpl.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">{tpl.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <Badge variant="outline" className="font-mono">
                        {tpl.textColumn} → {tpl.labelColumn}
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        {tpl.rowCount} rows
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tpl.classes.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(tpl)}
                        disabled={isLoading || isUploading}
                        data-testid={`button-use-template-${tpl.id}`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Loading...
                          </>
                        ) : (
                          "Use template"
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={`${import.meta.env.BASE_URL}templates/${tpl.filename}`}
                          download
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download CSV
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!state.datasetPreview ? (
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-medium text-sm">Processing dataset...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-base mb-1">Or upload your own CSV</p>
                  <p className="text-sm text-muted-foreground mb-4">Max file size 50MB</p>
                  <label className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Select File
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dataset Uploaded</h3>
                  <p className="text-sm text-muted-foreground">{state.datasetPreview.rowCount} rows detected</p>
                </div>
                <Button variant="outline" className="ml-auto" onClick={() => updateState({ datasetPreview: null })}>
                  Change File
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Text Column (Input)</Label>
                  <Select value={state.textColumn} onValueChange={(val) => updateState({ textColumn: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {state.datasetPreview.columns.filter(col => col.trim() !== "").map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">The text the model will read.</p>
                </div>
                <div className="space-y-2">
                  <Label>Label Column (Output)</Label>
                  <Select value={state.labelColumn} onValueChange={(val) => updateState({ labelColumn: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {state.datasetPreview.columns.filter(col => col.trim() !== "").map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">The target value to predict.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="p-4 border-b border-border flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Data Preview</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {state.datasetPreview.columns.map(col => (
                      <TableHead key={col} className={col === state.textColumn || col === state.labelColumn ? "bg-muted/50 font-bold" : ""}>
                        {col}
                        {col === state.textColumn && <span className="ml-2 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">Input</span>}
                        {col === state.labelColumn && <span className="ml-2 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">Output</span>}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.datasetPreview.previewRows.map((row, i) => (
                    <TableRow key={i}>
                      {state.datasetPreview!.columns.map(col => (
                        <TableCell key={col} className="max-w-[200px] truncate text-sm" title={row[col]}>
                          {row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!state.datasetPreview || !state.textColumn || !state.labelColumn} size="lg">
          Continue to Config
        </Button>
      </div>
    </div>
  );
}
