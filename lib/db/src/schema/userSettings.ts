import { pgTable, text } from "drizzle-orm/pg-core";

export const userSettingsTable = pgTable("user_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type UserSetting = typeof userSettingsTable.$inferSelect;
