import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const callLogs = pgTable("call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerHash: text("caller_hash").notNull(),
  encryptedPhone: text("encrypted_phone"),
  transcription: text("transcription"),
  aiResponse: text("ai_response"),
  severityLevel: integer("severity_level").notNull(),
  category: text("category").notNull(),
  isBreakGlass: boolean("is_break_glass").default(false).notNull(),
  villageLocation: text("village_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callId: varchar("call_id").notNull().references(() => callLogs.id),
  ashaWorkerId: varchar("asha_worker_id"),
  status: text("status").notNull().default("PENDING"),
  emergencyReason: text("emergency_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
