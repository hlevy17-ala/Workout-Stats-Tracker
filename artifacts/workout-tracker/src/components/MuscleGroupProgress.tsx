import { useMemo } from "react";
import { useGetWorkoutsByMuscleGroup, useGetAvgWeightByMuscleGroup } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Weight, TrendingUp } from "lucide-react";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Triceps", "Biceps", "Legs", "Core"];
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
];

const KG_TO_LBS = 2.20462;

type ChartRow = { date: string } & Record<string, string | number>;

export function MuscleGroupProgress() {
  const { data: rawVolume = [], isLoading: isLoadingVolume } = useGetWorkoutsByMuscleGroup();
  const { data: rawAvg = [], isLoading: isLoadingAvg } = useGetAvgWeightByMuscleGroup();

  const volumeData = useMemo((): ChartRow[] => {
    if (!rawVolume.length) return [];
    const byDate: Record<string, ChartRow> = {};
    for (const curr of rawVolume) {
      if (!byDate[curr.date]) byDate[curr.date] = { date: curr.date };
      byDate[curr.date][curr.muscleGroup] = Math.round(curr.totalKg * KG_TO_LBS);
    }
    return Object.values(byDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [rawVolume]);

  const avgWeightData = useMemo((): ChartRow[] => {
    if (!rawAvg.length) return [];
    const byDate: Record<string, ChartRow> = {};
    for (const curr of rawAvg) {
      if (!byDate[curr.date]) byDate[curr.date] = { date: curr.date };
      byDate[curr.date][curr.muscleGroup] = Math.round(curr.avgWeightKg * KG_TO_LBS * 10) / 10;
    }
    return Object.values(byDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [rawAvg]);

  const tickFormatter = (val: string) => {
    const d = new Date(val);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const axisStyle = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
    tickLine: false as const,
    axisLine: false as const,
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--card))",
      borderColor: "hsl(var(--border))",
      borderRadius: "var(--radius-md)",
      color: "hsl(var(--foreground))",
    },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 8 },
  };

  if (isLoadingVolume || isLoadingAvg) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const isEmpty = volumeData.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Systemic Load</h2>
        <p className="text-muted-foreground">Track average weight and volume distribution across primary muscle groups.</p>
      </div>

      {isEmpty ? (
        <Card className="h-[500px] flex items-center justify-center border-dashed">
          <div className="text-center text-muted-foreground">
            <p>Upload data to see your muscle group progression.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Weight className="w-5 h-5 text-chart-2" />
                Average Weight per Set
              </CardTitle>
              <CardDescription>Average weight lifted per set (lbs) per muscle group over time.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={avgWeightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={tickFormatter} dy={10} {...axisStyle} />
                    <YAxis dx={-10} tickFormatter={(val) => `${val}lbs`} {...axisStyle} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) => [`${value} lbs`, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                    {MUSCLE_GROUPS.map((mg, i) => (
                      <Line
                        key={mg}
                        type="monotone"
                        dataKey={mg}
                        name={mg}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-chart-1" />
                Regional Volume History
              </CardTitle>
              <CardDescription>Total pounds lifted per session, separated by muscle group.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={tickFormatter} dy={10} {...axisStyle} />
                    <YAxis dx={-10} tickFormatter={(val) => `${val}lbs`} {...axisStyle} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) => [`${value} lbs`, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                    {MUSCLE_GROUPS.map((mg, i) => (
                      <Line
                        key={mg}
                        type="monotone"
                        dataKey={mg}
                        name={mg}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
