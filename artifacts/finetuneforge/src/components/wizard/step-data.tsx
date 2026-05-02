import { useState } from "react";
import { WizardState } from "@/pages/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Table as TableIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DatasetPreview } from "@workspace/api-client-react";

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
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data: DatasetPreview = await res.json();
      updateState({
        datasetPreview: data,
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold">Upload Training Data</h2>
        <p className="text-muted-foreground">Upload a CSV file containing your examples and labels.</p>
      </div>

      {!state.datasetPreview ? (
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
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
                  <p className="font-medium text-base mb-1">Click to upload CSV</p>
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
