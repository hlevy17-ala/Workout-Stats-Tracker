import { useState, useRef, useCallback } from "react";
import { UploadCloud, CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadWorkoutCsv } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWorkoutsByExerciseQueryKey, getGetWorkoutsByMuscleGroupQueryKey, getGetExerciseListQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function CsvUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useUploadWorkoutCsv();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    uploadMutation.mutate(
      { data: { file } },
      {
        onSuccess: (res) => {
          toast({
            title: "Upload Successful",
            description: `${res.inserted} new sets added, ${res.skipped} duplicates skipped.`,
          });
          setFile(null);
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: getGetWorkoutsByExerciseQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWorkoutsByMuscleGroupQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExerciseListQueryKey() });
        },
        onError: () => {
          toast({
            title: "Upload Failed",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-xl">Import Data</CardTitle>
        <CardDescription>Upload your workout CSV file to populate your training log.</CardDescription>
      </CardHeader>
      <CardContent>
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={uploadMutation.isPending}
                data-testid="button-submit-csv"
              >
                {uploadMutation.isPending ? "Uploading..." : "Process File"}
              </Button>
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
      </CardContent>
    </Card>
  );
}
