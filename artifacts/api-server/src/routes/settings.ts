import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userSettingsTable } from "@workspace/db";
import {
  GetCalorieDailyGoalResponse,
  SetCalorieDailyGoalBody,
  SetCalorieDailyGoalResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const CALORIE_GOAL_KEY = "calorie_daily_goal";

router.get("/settings/calorie-daily-goal", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.key, CALORIE_GOAL_KEY));

  res.json(GetCalorieDailyGoalResponse.parse({ value: row ? parseInt(row.value, 10) : null }));
});

router.post("/settings/calorie-daily-goal", async (req, res): Promise<void> => {
  const parsed = SetCalorieDailyGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(userSettingsTable)
    .values({ key: CALORIE_GOAL_KEY, value: String(parsed.data.value) })
    .onConflictDoUpdate({
      target: userSettingsTable.key,
      set: { value: String(parsed.data.value) },
    })
    .returning();

  res.json(SetCalorieDailyGoalResponse.parse({ value: parseInt(row.value, 10) }));
});

export default router;
