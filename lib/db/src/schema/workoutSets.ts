import { pgTable, serial, text, numeric, integer, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workoutSetsTable = pgTable(
  "workout_sets",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    exercise: text("exercise").notNull(),
    reps: integer("reps").notNull(),
    weightKg: numeric("weight_kg", { precision: 12, scale: 6 }).notNull(),
  },
  (table) => [
    uniqueIndex("workout_sets_unique_idx").on(
      table.date,
      table.exercise,
      table.reps,
      table.weightKg,
    ),
  ],
);

export const insertWorkoutSetSchema = createInsertSchema(workoutSetsTable).omit({ id: true });
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type WorkoutSet = typeof workoutSetsTable.$inferSelect;
