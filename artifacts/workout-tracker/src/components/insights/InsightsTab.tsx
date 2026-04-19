import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WeeklySnapshotWidget } from "./WeeklySnapshotWidget";
import { MostImprovedWidget } from "./MostImprovedWidget";
import { ConsistencyHeatmapWidget } from "./ConsistencyHeatmapWidget";
import { VolumeByMuscleGroupWidget } from "./VolumeByMuscleGroupWidget";
import { BodyCompositionWidget } from "./BodyCompositionWidget";
import { CalorieAdherenceWidget } from "./CalorieAdherenceWidget";
import { PersonalRecordsTimelineWidget } from "./PersonalRecordsTimelineWidget";

type WidgetId =
  | "weeklySnapshot"
  | "mostImproved"
  | "heatmap"
  | "volumeByMuscleGroup"
  | "bodyComposition"
  | "calorieAdherence"
  | "prTimeline";

const WIDGET_LABELS: Record<WidgetId, string> = {
  weeklySnapshot: "Weekly Snapshot",
  mostImproved: "Most Improved Exercises",
  heatmap: "Training Consistency",
  volumeByMuscleGroup: "Volume by Muscle Group",
  bodyComposition: "Body Composition",
  calorieAdherence: "Calorie Adherence",
  prTimeline: "Personal Records Timeline",
};

const WIDGET_ORDER: WidgetId[] = [
  "weeklySnapshot",
  "mostImproved",
  "heatmap",
  "volumeByMuscleGroup",
  "bodyComposition",
  "calorieAdherence",
  "prTimeline",
];

const DEFAULT_STATE: Record<WidgetId, boolean> = {
  weeklySnapshot: true,
  mostImproved: true,
  heatmap: true,
  volumeByMuscleGroup: true,
  bodyComposition: true,
  calorieAdherence: true,
  prTimeline: true,
};

const STORAGE_KEY = "insights-widget-visibility";

function loadVisibility(): Record<WidgetId, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_STATE;
}

export function InsightsTab() {
  const [visibility, setVisibility] = useState<Record<WidgetId, boolean>>(loadVisibility);

  const toggle = (id: WidgetId) => {
    setVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const on = (id: WidgetId) => visibility[id];
  const both = (a: WidgetId, b: WidgetId) => on(a) && on(b);
  const either = (a: WidgetId, b: WidgetId) => on(a) || on(b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Insights</h2>
          <p className="text-muted-foreground text-sm mt-1">Your progress at a glance.</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Customize
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <p className="text-sm font-semibold mb-4">Visible widgets</p>
            <div className="space-y-3">
              {WIDGET_ORDER.map((id) => (
                <div key={id} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`w-${id}`} className="text-sm font-normal cursor-pointer leading-tight">
                    {WIDGET_LABELS[id]}
                  </Label>
                  <Switch id={`w-${id}`} checked={visibility[id]} onCheckedChange={() => toggle(id)} />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {on("weeklySnapshot") && <WeeklySnapshotWidget />}

      {either("mostImproved", "volumeByMuscleGroup") && (
        <div className={`grid gap-6 ${both("mostImproved", "volumeByMuscleGroup") ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {on("mostImproved") && <MostImprovedWidget />}
          {on("volumeByMuscleGroup") && <VolumeByMuscleGroupWidget />}
        </div>
      )}

      {on("heatmap") && <ConsistencyHeatmapWidget />}

      {either("bodyComposition", "calorieAdherence") && (
        <div className={`grid gap-6 ${both("bodyComposition", "calorieAdherence") ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {on("bodyComposition") && <BodyCompositionWidget />}
          {on("calorieAdherence") && <CalorieAdherenceWidget />}
        </div>
      )}

      {on("prTimeline") && <PersonalRecordsTimelineWidget />}
    </div>
  );
}
