import { Router, type IRouter } from "express";
import multer from "multer";
import { sql } from "drizzle-orm";
import { db, workoutSetsTable, bodyMetricsTable, calorieLogsTable } from "@workspace/db";
import {
  UploadWorkoutCsvResponse,
  GetWorkoutsByExerciseResponse,
  GetWorkoutsByMuscleGroupResponse,
  GetAvgWeightByExerciseResponse,
  GetAvgWeightByMuscleGroupResponse,
  GetPersonalRecordsResponse,
  GetExerciseListResponse,
  GetBodyMetricsResponse,
  CreateBodyMetricBody,
  GetCalorieLogsResponse,
  CreateCalorieLogBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const CARDIO_EXERCISES = new Set(["Walking - Treadmill", "Running - Treadmill"]);

const MUSCLE_GROUP_MAP: Record<string, string> = {
  "Bench Press": "Chest",
  "Machine Bench Press": "Chest",
  "Fly": "Chest",
  "Machine Fly": "Chest",
  "Chest Fly": "Chest",
  "Lat Pulldown": "Back",
  "Row": "Back",
  "Machine Row": "Back",
  "Seated Row": "Back",
  "Cable Row": "Back",
  "Seated Back Extension": "Back",
  "Back Extension": "Back",
  "Shoulder Press": "Shoulders",
  "Machine Shoulder Press": "Shoulders",
  "Overhead Press": "Shoulders",
  "Rear Delt Fly": "Shoulders",
  "Machine Rear Delt Fly": "Shoulders",
  "Tricep Dip": "Triceps",
  "Machine Tricep Dip": "Triceps",
  "Tricep Extension": "Triceps",
  "Tricep Pushdown": "Triceps",
  "Bicep Curl": "Biceps",
  "Machine Bicep Curl": "Biceps",
  "Dumbbell Bicep Curl": "Biceps",
  "Leg Press": "Legs",
  "Machine Leg Press": "Legs",
  "Calf Raise": "Legs",
  "Machine Calf Raise": "Legs",
  "Hip Adductor": "Legs",
  "Machine Hip Adductor": "Legs",
  "Hip Abductor": "Legs",
  "Machine Hip Abductor": "Legs",
  "Air Squats": "Legs",
  "Squat": "Legs",
  "Leg Extension": "Legs",
  "Leg Curl": "Legs",
  "Crunches": "Core",
  "Dead Bug": "Core",
  "Plank": "Core",
  "Ab Crunch": "Core",
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

  // Parse column mapping from request body
  let mapping: {
    date: string;
    exercise: string;
    reps: string;
    weight: string;
    weightUnit: "kg" | "lbs";
    isWarmup?: string;
    multiplier?: string;
  };
  try {
    mapping = JSON.parse(req.body?.mapping ?? "{}");
  } catch {
    res.status(400).json({ error: "Invalid column mapping — could not parse JSON" });
    return;
  }

  if (!mapping.date || !mapping.exercise || !mapping.reps || !mapping.weight) {
    res.status(400).json({ error: "Column mapping is incomplete — date, exercise, reps, and weight are required" });
    return;
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const dateIdx = header.indexOf(mapping.date);
  const exerciseIdx = header.indexOf(mapping.exercise);
  const repsIdx = header.indexOf(mapping.reps);
  const weightIdx = header.indexOf(mapping.weight);
  const warmupIdx = mapping.isWarmup ? header.indexOf(mapping.isWarmup) : -1;
  const multiplierIdx = mapping.multiplier ? header.indexOf(mapping.multiplier) : -1;
  const weightUnit = mapping.weightUnit ?? "kg";

  if (dateIdx < 0 || exerciseIdx < 0 || repsIdx < 0 || weightIdx < 0) {
    res.status(400).json({ error: "One or more mapped columns were not found in the CSV header row" });
    return;
  }

  const toInsert: { date: string; exercise: string; reps: number; weightKg: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const rawDate = cols[dateIdx]?.trim() ?? "";
    const exercise = cols[exerciseIdx]?.trim() ?? "";
    const reps = parseInt(cols[repsIdx]?.trim() ?? "0", 10);
    const weightRaw = parseFloat(cols[weightIdx]?.trim() ?? "0");
    const weightKg = weightUnit === "lbs" ? weightRaw / 2.20462 : weightRaw;
    const isWarmup = warmupIdx >= 0 ? cols[warmupIdx]?.trim().toLowerCase() === "true" : false;
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

  if (toInsert.length === 0) {
    res.status(400).json({ error: "No valid rows found after applying your column mapping. Your existing data was not changed." });
    return;
  }

  const CHUNK_SIZE = 1000;

  await db.transaction(async (tx) => {
    await tx.delete(workoutSetsTable);
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      await tx.insert(workoutSetsTable).values(toInsert.slice(i, i + CHUNK_SIZE));
    }
  });

  const inserted = toInsert.length;
  req.log.info({ inserted, total: inserted }, "Workout CSV upload complete");

  res.json(UploadWorkoutCsvResponse.parse({ inserted, skipped: 0, total: inserted }));
});

router.get("/workouts/by-exercise", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: workoutSetsTable.date,
      exercise: workoutSetsTable.exercise,
      totalKg: sql<number>`CAST(SUM(${workoutSetsTable.weightKg}::numeric * ${workoutSetsTable.reps}) AS float8)`,
    })
    .from(workoutSetsTable)
    .groupBy(workoutSetsTable.date, workoutSetsTable.exercise)
    .orderBy(workoutSetsTable.date, workoutSetsTable.exercise);

  res.json(GetWorkoutsByExerciseResponse.parse(rows));
});

router.get("/workouts/avg-weight-by-exercise", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: workoutSetsTable.date,
      exercise: workoutSetsTable.exercise,
      avgWeightKg: sql<number>`CAST(AVG(${workoutSetsTable.weightKg}::numeric) AS float8)`,
    })
    .from(workoutSetsTable)
    .groupBy(workoutSetsTable.date, workoutSetsTable.exercise)
    .orderBy(workoutSetsTable.date, workoutSetsTable.exercise);

  res.json(GetAvgWeightByExerciseResponse.parse(rows));
});

router.get("/workouts/avg-weight-by-muscle-group", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: workoutSetsTable.date,
      exercise: workoutSetsTable.exercise,
      avgWeightKg: sql<number>`CAST(AVG(${workoutSetsTable.weightKg}::numeric) AS float8)`,
    })
    .from(workoutSetsTable)
    .groupBy(workoutSetsTable.date, workoutSetsTable.exercise)
    .orderBy(workoutSetsTable.date);

  const grouped: Map<string, Map<string, { sum: number; count: number }>> = new Map();

  for (const row of rows) {
    const muscleGroup = MUSCLE_GROUP_MAP[row.exercise] ?? "Other";
    if (!grouped.has(row.date)) grouped.set(row.date, new Map());
    const dateMap = grouped.get(row.date)!;
    if (!dateMap.has(muscleGroup)) dateMap.set(muscleGroup, { sum: 0, count: 0 });
    const entry = dateMap.get(muscleGroup)!;
    entry.sum += Number(row.avgWeightKg);
    entry.count += 1;
  }

  const result: { date: string; muscleGroup: string; avgWeightKg: number }[] = [];
  for (const [date, muscleGroups] of grouped) {
    for (const [muscleGroup, { sum, count }] of muscleGroups) {
      result.push({ date, muscleGroup, avgWeightKg: Math.round((sum / count) * 100) / 100 });
    }
  }
  result.sort((a, b) => a.date.localeCompare(b.date) || a.muscleGroup.localeCompare(b.muscleGroup));

  res.json(GetAvgWeightByMuscleGroupResponse.parse(result));
});

router.get("/workouts/by-muscle-group", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: workoutSetsTable.date,
      exercise: workoutSetsTable.exercise,
      totalKg: sql<number>`CAST(SUM(${workoutSetsTable.weightKg}::numeric * ${workoutSetsTable.reps}) AS float8)`,
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

function normalizeBodyMetric(row: {
  id: number;
  date: string;
  weightLbs: string | null;
  waistInches: string | null;
}) {
  return {
    id: row.id,
    date: row.date,
    weightLbs: row.weightLbs != null ? parseFloat(row.weightLbs) : null,
    waistInches: row.waistInches != null ? parseFloat(row.waistInches) : null,
  };
}

router.get("/body-metrics", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(bodyMetricsTable)
    .orderBy(bodyMetricsTable.date);

  res.json(GetBodyMetricsResponse.parse(rows.map(normalizeBodyMetric)));
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

  res.status(201).json(normalizeBodyMetric(metric));
});

router.get("/calorie-logs", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(calorieLogsTable)
    .orderBy(calorieLogsTable.date);

  const normalized = rows.map((r) => ({
    id: r.id,
    date: r.date,
    caloriesConsumed: r.caloriesConsumed ?? null,
    caloriesBurned: r.caloriesBurned ?? null,
  }));

  res.json(GetCalorieLogsResponse.parse(normalized));
});

router.get("/workouts/personal-records", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      exercise: workoutSetsTable.exercise,
      maxWeightKg: sql<number>`CAST(MAX(${workoutSetsTable.weightKg}::numeric) AS float8)`,
    })
    .from(workoutSetsTable)
    .groupBy(workoutSetsTable.exercise)
    .orderBy(workoutSetsTable.exercise);

  const records = rows.map((r) => ({
    exercise: r.exercise,
    maxWeightKg: r.maxWeightKg,
  }));

  res.json(GetPersonalRecordsResponse.parse(records));
});

router.post("/calorie-logs", async (req, res): Promise<void> => {
  const parsed = CreateCalorieLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date, caloriesConsumed, caloriesBurned } = parsed.data;

  const [log] = await db
    .insert(calorieLogsTable)
    .values({
      date,
      caloriesConsumed: caloriesConsumed ?? null,
      caloriesBurned: caloriesBurned ?? null,
    })
    .onConflictDoUpdate({
      target: calorieLogsTable.date,
      set: {
        caloriesConsumed: caloriesConsumed ?? null,
        caloriesBurned: caloriesBurned ?? null,
      },
    })
    .returning();

  res.status(201).json({
    id: log.id,
    date: log.date,
    caloriesConsumed: log.caloriesConsumed ?? null,
    caloriesBurned: log.caloriesBurned ?? null,
  });
});

export default router;
