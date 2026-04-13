import { useState, useMemo, useEffect } from "react";
import { useGetWorkoutsByExercise, useGetExerciseList } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity } from "lucide-react";

export function ExerciseProgress() {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  
  const { data: exercises = [], isLoading: isLoadingList } = useGetExerciseList();
  
  const { data: allWorkouts = [], isLoading: isLoadingWorkouts } = useGetWorkoutsByExercise();

  useEffect(() => {
    if (exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(exercises[0]);
    }
  }, [exercises, selectedExercise]);

  const chartData = useMemo(() => {
    if (!selectedExercise || !allWorkouts.length) return [];
    
    // Filter and sort by date ascending
    return allWorkouts
      .filter(w => w.exercise === selectedExercise)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allWorkouts, selectedExercise]);

  const maxWeight = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map(d => d.totalKg));
  }, [chartData]);

  if (isLoadingList || isLoadingWorkouts) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Movement Tracking</h2>
          <p className="text-muted-foreground">Analyze your volume progression for specific exercises.</p>
        </div>
        
        <div className="w-full sm:w-[300px]">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger>
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map(ex => (
                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedExercise ? (
        <Card className="h-[400px] flex items-center justify-center border-dashed">
          <div className="text-center text-muted-foreground flex flex-col items-center">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p>Select an exercise to view history</p>
          </div>
        </Card>
      ) : chartData.length === 0 ? (
        <Card className="h-[400px] flex items-center justify-center border-dashed">
          <div className="text-center text-muted-foreground">
            <p>No data found for this exercise.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-chart-1" />
                  {selectedExercise}
                </CardTitle>
                <CardDescription>Total volume (kg) over time</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-mono">Max Volume</p>
                <p className="text-2xl font-bold text-chart-1 font-mono">{maxWeight.toLocaleString()} kg</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}
                    formatter={(value: number) => [`${value} kg`, 'Total Volume']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalKg" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                    activeDot={{ r: 6, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
