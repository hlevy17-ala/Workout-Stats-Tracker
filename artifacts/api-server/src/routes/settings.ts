import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, userSettingsTable } from "@workspace/db";
import {
  GetCalorieDailyGoalResponse,
  SetCalorieDailyGoalBody,
  SetCalorieDailyGoalResponse,
  GetCalorieBurnGoalResponse,
  SetCalorieBurnGoalBody,
  SetCalorieBurnGoalResponse,
  SetWidgetVisibilityBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_USER_ID = "default";
const CALORIE_GOAL_KEY = "calorie_daily_goal";
const CALORIE_BURN_GOAL_KEY = "calorie_burn_goal";
const WIDGET_VISIBILITY_KEY = "insights_widget_visibility";

function userKeyFilter(key: string) {
  return and(
    eq(userSettingsTable.userId, DEFAULT_USER_ID),
    eq(userSettingsTable.key, key),
  );
}

router.get("/settings/calorie-daily-goal", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(userSettingsTable)
    .where(userKeyFilter(CALORIE_GOAL_KEY));

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
    .values({ userId: DEFAULT_USER_ID, key: CALORIE_GOAL_KEY, value: String(parsed.data.value) })
    .onConflictDoUpdate({
      target: [userSettingsTable.userId, userSettingsTable.key],
      set: { value: String(parsed.data.value) },
    })
    .returning();

  res.json(SetCalorieDailyGoalResponse.parse({ value: parseInt(row.value, 10) }));
});

router.get("/settings/calorie-burn-goal", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(userSettingsTable)
    .where(userKeyFilter(CALORIE_BURN_GOAL_KEY));

  res.json(GetCalorieBurnGoalResponse.parse({ value: row ? parseInt(row.value, 10) : null }));
});

router.post("/settings/calorie-burn-goal", async (req, res): Promise<void> => {
  const parsed = SetCalorieBurnGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(userSettingsTable)
    .values({ userId: DEFAULT_USER_ID, key: CALORIE_BURN_GOAL_KEY, value: String(parsed.data.value) })
    .onConflictDoUpdate({
      target: [userSettingsTable.userId, userSettingsTable.key],
      set: { value: String(parsed.data.value) },
    })
    .returning();

  res.json(SetCalorieBurnGoalResponse.parse({ value: parseInt(row.value, 10) }));
});

router.get("/settings/widget-visibility", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(userSettingsTable)
    .where(userKeyFilter(WIDGET_VISIBILITY_KEY));

  if (!row) {
    res.json(null);
    return;
  }

  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json(null);
  }
});

router.put("/settings/widget-visibility", async (req, res): Promise<void> => {
  const parsed = SetWidgetVisibilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(userSettingsTable)
    .values({ userId: DEFAULT_USER_ID, key: WIDGET_VISIBILITY_KEY, value: JSON.stringify(parsed.data) })
    .onConflictDoUpdate({
      target: [userSettingsTable.userId, userSettingsTable.key],
      set: { value: JSON.stringify(parsed.data) },
    })
    .returning();

  res.json(JSON.parse(row.value));
});

export default router;
