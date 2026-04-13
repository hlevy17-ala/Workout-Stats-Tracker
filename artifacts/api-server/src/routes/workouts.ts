import { Router, type IRouter } from "express";
import multer from "multer";
import { sql } from "drizzle-orm";
import { db, workoutSetsTable, bodyMetricsTable } from "@workspace/db";
import {
  UploadWorkoutCsvResponse,
  GetWorkoutsByExerciseResponse,
  GetWorkoutsByMuscleGroupResponse,
  GetExerciseListResponse,
  GetBodyMetricsResponse,
  CreateBodyMetricBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const CARDIO_EXERCISES = new Set(["Walking - Treadmill", "Running - Treadmill"]);

const MUSCLE_GROUP_MAP: Record<string, string> = {
  "Machine Bench Press": "Chest",
  "Machine Fly": "Chest",
  "Lat Pulldown": "Back",
  "Machine Row": "Back",
  "Seated Back Extension": "Back",
  "Machine Shoulder Press": "Shoulders",
  "Machine Rear Delt Fly": "Shoulders",
  "Machine Tricep Dip": "Triceps",
  "Machine Bicep Curl": "Biceps",
  "Machine Leg Press": "Legs",
  "Calf Raise": "Legs",
  "Machine Hip Adductor": "Legs",
  "Machine Hip Abductor": "Legs",
  "Air Squats": "Legs",
  "Crunches": "Core",
  "Dead Bug": "Core",
};

function parseDate(raw: string): string {
  const d = new Date(raw);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

router.post("/workouts/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const text = req.file.buffer.toString("utf-8");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    res.status(400).json({ error: "CSV file appears empty" });
    return;
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const dateIdx = header.indexOf("Date");
  const exerciseIdx = header.indexOf("Exercise");
  const repsIdx = header.indexOf("Reps");
  const weightIdx = header.indexOf("Weight(kg)");
  const warmupIdx = header.indexOf("isWarmup");
  const multiplierIdx = header.indexOf("multiplier");

  if (dateIdx < 0 || exerciseIdx < 0 || repsIdx < 0 || weightIdx < 0) {
    res.status(400).json({ error: "CSV format not recognized — missing required columns" });
    return;
  }

  const toInsert: { date: string; exercise: string; reps: number; weightKg: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const rawDate = cols[dateIdx]?.trim() ?? "";
    const exercise = cols[exerciseIdx]?.trim() ?? "";
    const reps = parseInt(cols[repsIdx]?.trim() ?? "0", 10);
    const weightKg = parseFloat(cols[weightIdx]?.trim() ?? "0");
    const isWarmup = cols[warmupIdx]?.trim().toLowerCase() === "true";
    const multiplier = multiplierIdx >= 0 ? parseFloat(cols[multiplierIdx]?.trim() ?? "1") : 1;

    if (CARDIO_EXERCISES.has(exercise)) continue;
    if (isWarmup) continue;
    if (multiplier === 0) continue;
    if (weightKg <= 0) continue;
    if (!rawDate || !exercise) continue;

    const date = parseDate(rawDate);

    toInsert.push({
      date,
      exercise,
      reps,
      weightKg: weightKg.toFixed(6),
    });
  }

  let inserted = 0;
  let skipped = 0;

  for (const row of toInsert) {
    try {
      const result = await db
        .insert(workoutSetsTable)
        .values(row)
        .onConflictDoNothing()
        .returning({ id: workoutSetsTable.id });

      if (result.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  req.log.info({ inserted, skipped, total: toInsert.length }, "Workout CSV upload complete");
  res.json(UploadWorkoutCsvResponse.parse({ inserted, skipped, total: toInsert.length }));
});

router.get("/workouts/by-exercise", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: workoutSetsTable.date,
      exercise: workoutSetsTable.exercise,
      totalKg: sql<number>`SUM(${workoutSetsTable.weightKg} * ${workoutSetsTable.reps})`,
    })
    .from(workoutSetsTable)
    .groupBy(workoutSetsTable.date, workoutSetsTable.exercise)
    .orderBy(workoutSetsTable.date, workoutSetsTable.exercise);

  res.json(GetWorkoutsByExerciseResponse.parse(rows));
});

router.get("/workouts/by-muscle-group", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: workoutSetsTable.date,
      exercise: workoutSetsTable.exercise,
      totalKg: sql<number>`SUM(${workoutSetsTable.weightKg} * ${workoutSetsTable.reps})`,
    })
    .from(workoutSetsTable)
    .groupBy(workoutSetsTable.date, workoutSetsTable.exercise)
    .orderBy(workoutSetsTable.date);

  const grouped: Map<string, Map<string, number>> = new Map();

  for (const row of rows) {
    const muscleGroup = MUSCLE_GROUP_MAP[row.exercise] ?? "Other";
    if (!grouped.has(row.date)) {
      grouped.set(row.date, new Map());
    }
    const dateMap = grouped.get(row.date)!;
    dateMap.set(muscleGroup, (dateMap.get(muscleGroup) ?? 0) + Number(row.totalKg));
  }

  const result: { date: string; muscleGroup: string; totalKg: number }[] = [];
  for (const [date, muscleGroups] of grouped) {
    for (const [muscleGroup, totalKg] of muscleGroups) {
      result.push({ date, muscleGroup, totalKg: Math.round(totalKg * 100) / 100 });
    }
  }
  result.sort((a, b) => a.date.localeCompare(b.date) || a.muscleGroup.localeCompare(b.muscleGroup));

  res.json(GetWorkoutsByMuscleGroupResponse.parse(result));
});

router.get("/workouts/exercises", async (req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ exercise: workoutSetsTable.exercise })
    .from(workoutSetsTable)
    .orderBy(workoutSetsTable.exercise);

  res.json(GetExerciseListResponse.parse(rows.map((r) => r.exercise)));
});

router.get("/body-metrics", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(bodyMetricsTable)
    .orderBy(bodyMetricsTable.date);

  res.json(GetBodyMetricsResponse.parse(rows));
});

router.post("/body-metrics", async (req, res): Promise<void> => {
  const parsed = CreateBodyMetricBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date, weightLbs, waistInches } = parsed.data;

  const [metric] = await db
    .insert(bodyMetricsTable)
    .values({
      date,
      weightLbs: weightLbs != null ? String(weightLbs) : null,
      waistInches: waistInches != null ? String(waistInches) : null,
    })
    .onConflictDoUpdate({
      target: bodyMetricsTable.date,
      set: {
        weightLbs: weightLbs != null ? String(weightLbs) : null,
        waistInches: waistInches != null ? String(waistInches) : null,
      },
    })
    .returning();

  res.status(201).json(metric);
});

export default router;
