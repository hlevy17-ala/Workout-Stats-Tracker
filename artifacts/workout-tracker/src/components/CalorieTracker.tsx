import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useGetCalorieLogs, useCreateCalorieLog, getGetCalorieLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  date: z.date(),
  caloriesConsumed: z.coerce.number().int().positive().optional().nullable(),
  caloriesBurned: z.coerce.number().int().positive().optional().nullable(),
});

export function CalorieTracker() {
  const { data: logs = [], isLoading } = useGetCalorieLogs();
  const createLog = useCreateCalorieLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      caloriesConsumed: null,
      caloriesBurned: null,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createLog.mutate(
      {
        data: {
          date: format(values.date, "yyyy-MM-dd"),
          caloriesConsumed: values.caloriesConsumed || null,
          caloriesBurned: values.caloriesBurned || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Calorie entry logged." });
          queryClient.invalidateQueries({ queryKey: getGetCalorieLogsQueryKey() });
          form.reset({ date: new Date(), caloriesConsumed: null, caloriesBurned: null });
        },
        onError: () => {
          toast({ title: "Failed to log entry.", variant: "destructive" });
        },
      }
    );
  };

  const chartData = useMemo(() => {
    if (!logs.length) return [];
    return [...logs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((log) => {
        const consumed = log.caloriesConsumed ?? 0;
        const burned = log.caloriesBurned ?? 0;
        return {
          date: log.date,
          caloriesConsumed: consumed,
          caloriesBurned: burned,
          deficit: burned - consumed,
        };
      });
  }, [logs]);

  const avgDeficit = useMemo(() => {
    if (!chartData.length) return 0;
    const total = chartData.reduce((sum, d) => sum + d.deficit, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    borderColor: "hsl(var(--border))",
    borderRadius: "var(--radius-md)",
    color: "hsl(var(--foreground))",
  };

  const axisStyle = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nutrition</h2>
        <p className="text-muted-foreground">Log your calories to track your daily deficit over time.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Log Entry</CardTitle>
          <CardDescription>Enter your calories consumed and burned for a given day. Re-entering the same date will overwrite the previous entry.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-end">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caloriesConsumed"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Calories Consumed</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="e.g. 2200"
                        className="bg-background"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Calories Burned</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="e.g. 400"
                        className="bg-background"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createLog.isPending} className="w-full sm:w-auto">
                {createLog.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : chartData.length === 0 ? (
        <Card className="h-[300px] flex items-center justify-center border-dashed">
          <div className="text-center text-muted-foreground">
            <p>No calorie data yet. Log your first entry above.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Daily Calories</CardTitle>
                  <CardDescription>Consumed vs. burned per day</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Avg Daily Deficit</p>
                  <p className={`text-2xl font-bold font-mono ${avgDeficit >= 0 ? "text-chart-2" : "text-destructive"}`}>
                    {avgDeficit >= 0 ? "+" : ""}{avgDeficit.toLocaleString()} kcal
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                      {...axisStyle}
                      dy={10}
                    />
                    <YAxis {...axisStyle} dx={-10} tickFormatter={(val) => `${val}`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()} kcal`,
                        name === "caloriesConsumed" ? "Consumed" : "Burned",
                      ]}
                    />
                    <Legend
                      formatter={(value) => (value === "caloriesConsumed" ? "Consumed" : "Burned")}
                      wrapperStyle={{ paddingTop: "16px" }}
                      iconType="circle"
                    />
                    <Bar dataKey="caloriesConsumed" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="caloriesBurned" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Deficit</CardTitle>
              <CardDescription>Net calories burned minus consumed. Positive = deficit (fat loss).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                      {...axisStyle}
                      dy={10}
                    />
                    <YAxis {...axisStyle} dx={-10} tickFormatter={(val) => `${val}`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                      formatter={(value: number) => [`${value.toLocaleString()} kcal`, "Net Deficit"]}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                    <Bar
                      dataKey="deficit"
                      radius={[4, 4, 0, 0]}
                      fill="hsl(var(--chart-2))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
