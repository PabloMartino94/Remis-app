import { 
  type Trip, 
  type InsertTrip, 
  type Expense, 
  type InsertExpense,
  type ClosedDay,
  type InsertClosedDay,
  type UserSettings,
  type UpdateUserSettings,
  trips,
  expenses,
  closedDays,
  userSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

const DEFAULT_SETTINGS: Omit<UserSettings, 'userId'> = {
  ownerCcPercent: 0.30,
  driverPartPercent: 0.70,
  expenseReimbPercent: 1.0,
};

export interface IStorage {
  getAllTrips(userId: string): Promise<Trip[]>;
  getTrip(id: string, userId: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, userId: string, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: string, userId: string): Promise<boolean>;

  getAllExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: string, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<boolean>;

  getAllClosedDays(userId: string): Promise<ClosedDay[]>;
  closeDay(userId: string, date: string): Promise<ClosedDay>;
  openDay(userId: string, date: string): Promise<boolean>;

  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
}

export class DatabaseStorage implements IStorage {
  async getAllTrips(userId: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.userId, userId));
  }

  async getTrip(id: string, userId: string): Promise<Trip | undefined> {
    const result = await db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
    return result[0];
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const result = await db.insert(trips).values(trip).returning();
    return result[0];
  }

  async updateTrip(id: string, userId: string, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const result = await db.update(trips).set(trip).where(and(eq(trips.id, id), eq(trips.userId, userId))).returning();
    return result[0];
  }

  async deleteTrip(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, userId))).returning();
    return result.length > 0;
  }

  async getAllExpenses(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpense(id: string, userId: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(expense).where(and(eq(expenses.id, id), eq(expenses.userId, userId))).returning();
    return result[0];
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId))).returning();
    return result.length > 0;
  }

  async getAllClosedDays(userId: string): Promise<ClosedDay[]> {
    return await db.select().from(closedDays).where(eq(closedDays.userId, userId));
  }

  async closeDay(userId: string, date: string): Promise<ClosedDay> {
    const existing = await db.select().from(closedDays).where(and(eq(closedDays.userId, userId), eq(closedDays.date, date)));
    if (existing.length > 0) {
      return existing[0];
    }
    const result = await db.insert(closedDays).values({ userId, date }).returning();
    return result[0];
  }

  async openDay(userId: string, date: string): Promise<boolean> {
    const result = await db.delete(closedDays).where(and(eq(closedDays.userId, userId), eq(closedDays.date, date))).returning();
    return result.length > 0;
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (result.length > 0) {
      return result[0];
    }
    const newSettings = await db.insert(userSettings).values({ userId, ...DEFAULT_SETTINGS }).returning();
    return newSettings[0];
  }

  async updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings> {
    const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (existing.length === 0) {
      const newSettings = await db.insert(userSettings).values({ userId, ...DEFAULT_SETTINGS, ...settings }).returning();
      return newSettings[0];
    }
    const result = await db.update(userSettings).set(settings).where(eq(userSettings.userId, userId)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
