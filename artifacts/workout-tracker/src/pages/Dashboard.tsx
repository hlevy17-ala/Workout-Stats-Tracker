import { Dumbbell, Activity, Scale, Upload, Shield, Flame } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvUpload } from "@/components/CsvUpload";
import { ExerciseProgress } from "@/components/ExerciseProgress";
import { MuscleGroupProgress } from "@/components/MuscleGroupProgress";
import { BodyMetrics } from "@/components/BodyMetrics";
import { CalorieTracker } from "@/components/CalorieTracker";

export default function Dashboard() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-chart-1" />
            <span className="font-sans font-bold text-lg tracking-tight uppercase">Forge Journal</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="exercises" className="py-3 data-[state=active]:bg-card rounded-lg data-[state=active]:shadow-sm">
              <Dumbbell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Movements</span>
            </TabsTrigger>
            <TabsTrigger value="muscles" className="py-3 data-[state=active]:bg-card rounded-lg data-[state=active]:shadow-sm">
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Systemic</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="py-3 data-[state=active]:bg-card rounded-lg data-[state=active]:shadow-sm">
              <Scale className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Biometrics</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="py-3 data-[state=active]:bg-card rounded-lg data-[state=active]:shadow-sm">
              <Flame className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nutrition</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="py-3 data-[state=active]:bg-card rounded-lg data-[state=active]:shadow-sm">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-8">
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
