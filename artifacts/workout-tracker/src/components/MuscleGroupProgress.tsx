import { useMemo } from "react";
import { useGetWorkoutsByMuscleGroup } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

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

export function MuscleGroupProgress() {
  const { data: rawData = [], isLoading } = useGetWorkoutsByMuscleGroup();

  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    // Group by date
    const byDate = rawData.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date };
      }
      // Assuming curr.muscleGroup is mapped directly to the key
      acc[curr.date][curr.muscleGroup] = curr.totalKg;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rawData]);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Systemic Load</h2>
        <p className="text-muted-foreground">Track volume distribution across primary muscle groups.</p>
      </div>

      {chartData.length === 0 ? (
        <Card className="h-[500px] flex items-center justify-center border-dashed">
          <div className="text-center text-muted-foreground">
            <p>Upload data to see your muscle group progression.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Regional Volume History</CardTitle>
            <CardDescription>Aggregate total kilograms lifted per session, separated by group.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                    tickFormatter={(val) => `${val}kg`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 8 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  
                  {MUSCLE_GROUPS.map((mg, i) => (
                    <Line 
                      key={mg}
                      type="monotone" 
                      dataKey={mg} 
                      name={mg}
                      stroke={COLORS[i % COLORS.length]} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
