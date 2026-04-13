import { pgTable, serial, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bodyMetricsTable = pgTable("body_metrics", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  weightLbs: numeric("weight_lbs", { precision: 8, scale: 2 }),
  waistInches: numeric("waist_inches", { precision: 8, scale: 2 }),
});

export const insertBodyMetricSchema = createInsertSchema(bodyMetricsTable).omit({ id: true });
export type InsertBodyMetric = z.infer<typeof insertBodyMetricSchema>;
export type BodyMetric = typeof bodyMetricsTable.$inferSelect;
