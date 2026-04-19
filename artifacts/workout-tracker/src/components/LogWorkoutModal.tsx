import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useLogWorkout,
  useGetExerciseList,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ExerciseRow = {
  id: number;
  exercise: string;
  weightLbs: string;
  reps: string;
  sets: string;
};

function mkRow(): ExerciseRow {
  return { id: Date.now() + Math.random(), exercise: "", weightLbs: "", reps: "", sets: "3" };
}

function isRowValid(r: ExerciseRow): boolean {
  return (
    r.exercise.trim().length > 0 &&
    parseFloat(r.weightLbs) > 0 &&
    parseInt(r.reps, 10) > 0 &&
    parseInt(r.sets, 10) > 0
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LogWorkoutModal({ open, onClose }: Props) {
  const [date, setDate] = useState(todayIso);
  const [rows, setRows] = useState<ExerciseRow[]>([mkRow()]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: exerciseList = [] } = useGetExerciseList();
  const mutation = useLogWorkout();

  const addRow = () => setRows((r) => [...r, mkRow()]);
  const removeRow = (id: number) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateRow = (id: number, key: keyof ExerciseRow, value: string) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: value } : x)));

  const validRows = rows.filter(isRowValid);
  const canSave = validRows.length > 0 && !mutation.isPending;

  const handleSave = () => {
    if (!canSave) return;
    setErrorMsg(null);

    mutation.mutate(
      {
        data: {
          date,
          exercises: validRows.map((r) => ({
            exercise: r.exercise.trim(),
            weightLbs: parseFloat(r.weightLbs),
            reps: parseInt(r.reps, 10),
            sets: parseInt(r.sets, 10),
          })),
        },
      },
      {
        onSuccess: (result) => {
          setSavedCount(result.inserted);
          queryClient.invalidateQueries({
            predicate: (q) =>
              typeof q.queryKey[0] === "string" &&
              String(q.queryKey[0]).startsWith("/api/workouts"),
          });
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Something went wrong. Please try again.";
          setErrorMsg(msg);
        },
      },
    );
  };

  const handleClose = () => {
    setDate(todayIso());
    setRows([mkRow()]);
    setSavedCount(null);
    setErrorMsg(null);
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Log Workout</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record a training session directly — no CSV needed.
          </DialogDescription>
        </DialogHeader>

        {savedCount !== null ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <div>
              <p className="text-lg font-semibold">Session saved!</p>
              <p className="text-muted-foreground text-sm mt-1">
                {savedCount} set{savedCount !== 1 ? "s" : ""} logged for {date}. Charts updated.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="workout-date" className="text-sm font-medium">
                Date
              </Label>
              <Input
                id="workout-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-border text-foreground [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_64px_64px_32px] gap-2 text-xs font-medium text-muted-foreground px-0.5">
                <span>Exercise</span>
                <span>Weight (lbs)</span>
                <span>Reps</span>
                <span>Sets</span>
                <span />
              </div>

              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_80px_64px_64px_32px] gap-2 items-center">
                  <div>
                    <input
                      list="exercise-list"
                      value={row.exercise}
                      onChange={(e) => updateRow(row.id, "exercise", e.target.value)}
                      placeholder="e.g. Bench Press"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <datalist id="exercise-list">
                      {exerciseList.map((ex) => (
                        <option key={ex} value={ex} />
                      ))}
                    </datalist>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={row.weightLbs}
                    onChange={(e) => updateRow(row.id, "weightLbs", e.target.value)}
                    placeholder="135"
                    className="bg-background border-border text-foreground"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={row.reps}
                    onChange={(e) => updateRow(row.id, "reps", e.target.value)}
                    placeholder="10"
                    className="bg-background border-border text-foreground"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={row.sets}
                    onChange={(e) => updateRow(row.id, "sets", e.target.value)}
                    placeholder="3"
                    className="bg-background border-border text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    aria-label="Remove exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRow}
                className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary mt-1"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add exercise
              </Button>
            </div>

            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={handleSave}
                disabled={!canSave}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Session"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
