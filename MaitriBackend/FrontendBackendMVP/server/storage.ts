import { type CallLog, type InsertCallLog, type Alert, type InsertAlert, callLogs, alerts } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Call Logs
  getCallLog(id: string): Promise<CallLog | undefined>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  getAllCallLogs(): Promise<CallLog[]>;
  updateCallLog(id: string, updates: Partial<CallLog>): Promise<CallLog | undefined>;
  
  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAllAlerts(): Promise<Alert[]>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;
  getPendingAlerts(): Promise<Alert[]>;
}

export class MemStorage implements IStorage {
  private callLogs: Map<string, CallLog>;
  private alerts: Map<string, Alert>;

  constructor() {
    this.callLogs = new Map();
    this.alerts = new Map();
  }

  async getCallLog(id: string): Promise<CallLog | undefined> {
    return this.callLogs.get(id);
  }

  async createCallLog(insertCallLog: InsertCallLog): Promise<CallLog> {
    const id = randomUUID();
    const callLog: CallLog = { 
      ...insertCallLog,
      encryptedPhone: insertCallLog.encryptedPhone ?? null,
      transcription: insertCallLog.transcription ?? null,
      aiResponse: insertCallLog.aiResponse ?? null,
      villageLocation: insertCallLog.villageLocation ?? null,
      isBreakGlass: insertCallLog.isBreakGlass ?? false,
      id,
      createdAt: new Date()
    };
    this.callLogs.set(id, callLog);
    return callLog;
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    return Array.from(this.callLogs.values());
  }

  async updateCallLog(id: string, updates: Partial<CallLog>): Promise<CallLog | undefined> {
    const callLog = this.callLogs.get(id);
    if (!callLog) return undefined;
    const updated = { ...callLog, ...updates };
    this.callLogs.set(id, updated);
    return updated;
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = { 
      ...insertAlert,
      status: insertAlert.status ?? "PENDING",
      ashaWorkerId: insertAlert.ashaWorkerId ?? null,
      emergencyReason: insertAlert.emergencyReason ?? null,
      id,
      createdAt: new Date(),
      resolvedAt: null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    const updated = { ...alert, ...updates };
    this.alerts.set(id, updated);
    return updated;
  }

  async getPendingAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.status === "PENDING"
    );
  }
}

export class DatabaseStorage implements IStorage {
  async getCallLog(id: string): Promise<CallLog | undefined> {
    const [callLog] = await db.select().from(callLogs).where(eq(callLogs.id, id));
    return callLog || undefined;
  }

  async createCallLog(insertCallLog: InsertCallLog): Promise<CallLog> {
    const [callLog] = await db
      .insert(callLogs)
      .values(insertCallLog)
      .returning();
    return callLog;
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    return await db.select().from(callLogs);
  }

  async updateCallLog(id: string, updates: Partial<CallLog>): Promise<CallLog | undefined> {
    const [updated] = await db
      .update(callLogs)
      .set(updates)
      .where(eq(callLogs.id, id))
      .returning();
    return updated || undefined;
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const [updated] = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return updated || undefined;
  }

  async getPendingAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.status, "PENDING"));
  }
}

export const storage = new DatabaseStorage();
