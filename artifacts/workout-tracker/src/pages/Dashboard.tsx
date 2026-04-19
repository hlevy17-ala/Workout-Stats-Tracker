import { Dumbbell, Activity, Scale, Upload, Shield, Flame, BarChart2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvUpload } from "@/components/CsvUpload";
import { ExerciseProgress } from "@/components/ExerciseProgress";
import { MuscleGroupProgress } from "@/components/MuscleGroupProgress";
import { BodyMetrics } from "@/components/BodyMetrics";
import { CalorieTracker } from "@/components/CalorieTracker";
import { InsightsTab } from "@/components/insights/InsightsTab";

export default function Dashboard() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-sans font-extrabold text-xl tracking-widest uppercase text-foreground">Harry's Lifestyle Tracker</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid grid-cols-6 w-full h-auto p-1 bg-muted/40 rounded-xl border border-border">
            <TabsTrigger value="insights" className="py-3 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <BarChart2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="py-3 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Dumbbell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Movements</span>
            </TabsTrigger>
            <TabsTrigger value="muscles" className="py-3 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Systemic</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="py-3 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Scale className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Biometrics</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="py-3 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Flame className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nutrition</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="py-3 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="insights" className="animate-in fade-in-50 zoom-in-95 duration-200">
              <InsightsTab />
            </TabsContent>

            <TabsContent value="exercises" className="animate-in fade-in-50 zoom-in-95 duration-200">
              <ExerciseProgress />
            </TabsContent>

            <TabsContent value="muscles" className="animate-in fade-in-50 zoom-in-95 duration-200">
              <MuscleGroupProgress />
            </TabsContent>

            <TabsContent value="metrics" className="animate-in fade-in-50 zoom-in-95 duration-200">
              <BodyMetrics />
            </TabsContent>

            <TabsContent value="nutrition" className="animate-in fade-in-50 zoom-in-95 duration-200">
              <CalorieTracker />
            </TabsContent>

            <TabsContent value="upload" className="animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold tracking-tight">Data Synchronization</h2>
                  <p className="text-muted-foreground mt-2">Import your raw training logs to update the visualization engine.</p>
                </div>
                <CsvUpload />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
