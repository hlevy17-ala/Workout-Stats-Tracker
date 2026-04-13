import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, FileUp, RotateCcw, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadWorkoutCsv, getGetAvgWeightByExerciseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWorkoutsByExerciseQueryKey, getGetWorkoutsByMuscleGroupQueryKey, getGetExerciseListQueryKey } from "@workspace/api-client-react";

type UploadResult = { inserted: number; total: number; fileName: string };

export function CsvUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useUploadWorkoutCsv();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    const fileName = file.name;
    uploadMutation.mutate(
      { data: { file } },
      {
        onSuccess: (res) => {
          setResult({ inserted: res.inserted, total: res.total, fileName });
          setFile(null);
          queryClient.invalidateQueries({ queryKey: getGetWorkoutsByExerciseQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWorkoutsByMuscleGroupQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExerciseListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAvgWeightByExerciseQueryKey() });
        },
        onError: () => {
          setResult(null);
        },
      }
    );
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-xl">Import Data</CardTitle>
        <CardDescription>Upload your workout CSV file to populate your training log.</CardDescription>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-foreground">Report Processed</h3>
              <p className="text-muted-foreground text-sm">{result.fileName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-muted/40 rounded-xl p-4 text-center border border-border">
                <p className="text-3xl font-black text-primary">{result.inserted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Sets Imported</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 text-center border border-border">
                <Dumbbell className="w-6 h-6 mx-auto text-chart-2 mb-1" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Charts Updated</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Import Another File
            </Button>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
              data-testid="input-csv-upload"
            />

            {file ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  disabled={uploadMutation.isPending}
                  data-testid="button-submit-csv"
                >
                  {uploadMutation.isPending ? "Processing..." : "Process File"}
                </Button>
                {uploadMutation.isError && (
                  <p className="text-sm text-destructive">Upload failed — please try again.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileUp className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-foreground">Click or drag CSV file here</p>
                  <p className="text-sm text-muted-foreground">Supports standard workout export formats</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
