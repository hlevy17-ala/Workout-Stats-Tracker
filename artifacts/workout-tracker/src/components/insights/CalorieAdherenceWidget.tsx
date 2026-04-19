import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetCalorieLogs, useGetCalorieDailyGoal, useGetCalorieBurnGoal } from "@workspace/api-client-react";

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d}`;
}

export function CalorieAdherenceWidget() {
  const { data: logs } = useGetCalorieLogs();
  const { data: consumeGoalData } = useGetCalorieDailyGoal();
  const { data: burnGoalData } = useGetCalorieBurnGoal();

  const consumeGoal = consumeGoalData?.value ?? null;
  const burnGoal = burnGoalData?.value ?? null;
  const targetDeficit = burnGoal != null && consumeGoal != null ? burnGoal - consumeGoal : null;

  const { chartData, adherenceRate, avgDeficit } = useMemo(() => {
    const recent = (logs ?? []).slice(-30);
    const chartData = recent
      .filter(l => l.caloriesConsumed != null || l.caloriesBurned != null)
      .map(l => ({
        date: shortDate(l.date),
        deficit: (l.caloriesBurned ?? 0) - (l.caloriesConsumed ?? 0),
      }));

    const daysWithDeficit = chartData.filter(d => d.deficit > 0).length;
    const adherenceRate = chartData.length > 0 ? Math.round((daysWithDeficit / chartData.length) * 100) : null;
    const avgDeficit = chartData.length > 0
      ? Math.round(chartData.reduce((s, d) => s + d.deficit, 0) / chartData.length)
      : null;

    return { chartData, adherenceRate, avgDeficit };
  }, [logs]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">Calorie Adherence</CardTitle>
            <p className="text-xs text-muted-foreground">Daily deficit (burned − consumed)</p>
          </div>
          {adherenceRate != null && (
            <div className="text-right shrink-0">
              <p className="text-xl font-black tabular-nums text-primary">{adherenceRate}%</p>
              <p className="text-xs text-muted-foreground">days in deficit</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No nutrition data logged yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                  formatter={(v: number) => [`${v > 0 ? "+" : ""}${v} kcal`, "Deficit"]}
                />
                {targetDeficit != null && (
                  <ReferenceLine y={targetDeficit} stroke="hsl(20 95% 58%)" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Goal", position: "right", fontSize: 9, fill: "hsl(20 95% 58%)" }} />
                )}
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                <Bar dataKey="deficit" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.deficit >= (targetDeficit ?? 0) ? "hsl(150 60% 45%)" : "hsl(20 80% 50%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {avgDeficit != null && (
              <p className="text-xs text-muted-foreground text-center mt-1">
                Avg deficit: <span className={`font-semibold tabular-nums ${avgDeficit >= 0 ? "text-green-500" : "text-red-400"}`}>{avgDeficit > 0 ? "+" : ""}{avgDeficit} kcal/day</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
