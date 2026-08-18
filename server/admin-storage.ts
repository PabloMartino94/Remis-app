import { 
  userAccounts, billingSettings, billingStatements, billingPayments, users,
  type UserAccount, type UpdateUserAccount,
  type BillingSettings, type UpdateBillingSettings,
  type BillingStatement, type InsertBillingStatement, type UpdateBillingStatement,
  type BillingPayment, type InsertBillingPayment,
  type User, type BillingPeriod
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lte, and, isNotNull } from "drizzle-orm";
import { addMonths, format } from "date-fns";

function getPeriodMonths(period: BillingPeriod): number {
  const periodMonths: Record<BillingPeriod, number> = {
    monthly: 1,
    bimonthly: 2,
    quarterly: 3,
    four_month: 4,
    semiannual: 6,
    annual: 12,
  };
  return periodMonths[period] || 1;
}

function calculatePeriodEnd(startDate: Date, period: BillingPeriod): Date {
  const months = getPeriodMonths(period);
  const endDate = addMonths(startDate, months);
  endDate.setDate(endDate.getDate() - 1);
  return endDate;
}

function calculateNextRunDate(fromDate: Date, period: BillingPeriod): Date {
  const months = getPeriodMonths(period);
  return addMonths(fromDate, months);
}

export interface UserWithDetails {
  user: User;
  account: UserAccount | null;
  billing: BillingSettings | null;
  totalOwed: number;
}

export class AdminStorage {
  async getAllUsersWithDetails(): Promise<UserWithDetails[]> {
    const allUsers = await db.select().from(users);
    const results: UserWithDetails[] = [];

    for (const user of allUsers) {
      const [account] = await db.select().from(userAccounts).where(eq(userAccounts.userId, user.id));
      const [billing] = await db.select().from(billingSettings).where(eq(billingSettings.userId, user.id));
      const totalOwed = await this.getUserTotalOwed(user.id);

      results.push({ user, account, billing, totalOwed });
    }

    return results;
  }

  async getUserWithDetails(userId: string): Promise<UserWithDetails | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const [account] = await db.select().from(userAccounts).where(eq(userAccounts.userId, userId));
    const [billing] = await db.select().from(billingSettings).where(eq(billingSettings.userId, userId));
    const totalOwed = await this.getUserTotalOwed(userId);

    return { user, account, billing, totalOwed };
  }

  async ensureUserAccount(userId: string): Promise<UserAccount> {
    const [existing] = await db.select().from(userAccounts).where(eq(userAccounts.userId, userId));
    if (existing) return existing;

    const [newAccount] = await db.insert(userAccounts).values({ userId }).returning();
    return newAccount;
  }

  async updateUserAccount(userId: string, data: UpdateUserAccount): Promise<UserAccount | null> {
    await this.ensureUserAccount(userId);
    const [updated] = await db.update(userAccounts).set(data).where(eq(userAccounts.userId, userId)).returning();
    return updated || null;
  }

  async suspendUser(userId: string, reason: string): Promise<UserAccount | null> {
    await this.ensureUserAccount(userId);
    const [updated] = await db.update(userAccounts).set({
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: new Date(),
    }).where(eq(userAccounts.userId, userId)).returning();
    return updated || null;
  }

  async activateUser(userId: string): Promise<UserAccount | null> {
    await this.ensureUserAccount(userId);
    const [updated] = await db.update(userAccounts).set({
      status: 'active',
      suspensionReason: null,
      reactivatedAt: new Date(),
    }).where(eq(userAccounts.userId, userId)).returning();
    return updated || null;
  }

  async getUserAccount(userId: string): Promise<UserAccount | null> {
    const [account] = await db.select().from(userAccounts).where(eq(userAccounts.userId, userId));
    return account || null;
  }

  async ensureBillingSettings(userId: string): Promise<BillingSettings> {
    const [existing] = await db.select().from(billingSettings).where(eq(billingSettings.userId, userId));
    if (existing) return existing;

    const [newSettings] = await db.insert(billingSettings).values({ userId }).returning();
    return newSettings;
  }

  async updateBillingSettings(userId: string, data: UpdateBillingSettings): Promise<BillingSettings | null> {
    const existing = await this.ensureBillingSettings(userId);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const period = (data.billingPeriod || existing.billingPeriod || 'monthly') as BillingPeriod;
    const newBaseAmount = data.baseAmount ?? existing.baseAmount ?? 0;
    const newDiscountPercent = data.discountPercent ?? existing.discountPercent ?? 0;
    
    const isFirstConfiguration = !existing.nextRunDate && !existing.lastRunAt;
    const amountChanged = data.baseAmount !== undefined && data.baseAmount !== existing.baseAmount;
    const discountChanged = data.discountPercent !== undefined && data.discountPercent !== existing.discountPercent;
    const shouldCreateInitialStatement = isFirstConfiguration && newBaseAmount > 0;
    
    const periodEnd = calculatePeriodEnd(today, period);
    const nextRunDate = calculateNextRunDate(today, period);
    
    const updateData: any = {
      ...data,
      lastConfiguredAt: today,
    };
    
    if (isFirstConfiguration) {
      updateData.nextRunDate = format(nextRunDate, 'yyyy-MM-dd');
      updateData.lastRunAt = today;
    }
    
    const [updated] = await db.update(billingSettings).set(updateData)
      .where(eq(billingSettings.userId, userId)).returning();

    if (shouldCreateInitialStatement) {
      const discountAmount = newBaseAmount * (newDiscountPercent / 100);
      const totalDue = newBaseAmount - discountAmount;

      await db.insert(billingStatements).values({
        userId,
        periodStart: todayStr,
        periodEnd: format(periodEnd, 'yyyy-MM-dd'),
        billingPeriod: period,
        amount: newBaseAmount,
        discountAmount,
        totalDue,
        status: 'pending',
        notes: 'Cargo inicial',
      });
    }

    return updated || null;
  }

  async getBillingSettings(userId: string): Promise<BillingSettings | null> {
    const [settings] = await db.select().from(billingSettings).where(eq(billingSettings.userId, userId));
    return settings || null;
  }

  async createBillingStatement(data: InsertBillingStatement): Promise<BillingStatement> {
    const [statement] = await db.insert(billingStatements).values(data).returning();
    return statement;
  }

  async updateBillingStatement(id: string, data: UpdateBillingStatement): Promise<BillingStatement | null> {
    const [updated] = await db.update(billingStatements).set(data).where(eq(billingStatements.id, id)).returning();
    return updated || null;
  }

  async getUserStatements(userId: string): Promise<BillingStatement[]> {
    return await db.select().from(billingStatements).where(eq(billingStatements.userId, userId)).orderBy(desc(billingStatements.createdAt));
  }

  async getStatement(id: string): Promise<BillingStatement | null> {
    const [statement] = await db.select().from(billingStatements).where(eq(billingStatements.id, id));
    return statement || null;
  }

  async deleteStatement(id: string): Promise<boolean> {
    const result = await db.delete(billingStatements).where(eq(billingStatements.id, id)).returning();
    return result.length > 0;
  }

  async getUserTotalOwed(userId: string): Promise<number> {
    const statements = await this.getUserStatements(userId);
    const payments = await this.getUserPayments(userId);
    
    const totalCharges = statements
      .filter(s => s.status === 'pending' || s.status === 'overdue')
      .reduce((sum, s) => sum + (s.totalDue - s.amountPaid), 0);
    
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return totalCharges - totalPayments;
  }

  async createPayment(data: InsertBillingPayment): Promise<BillingPayment> {
    const [payment] = await db.insert(billingPayments).values(data).returning();
    return payment;
  }

  async getUserPayments(userId: string): Promise<BillingPayment[]> {
    return await db.select().from(billingPayments).where(eq(billingPayments.userId, userId)).orderBy(desc(billingPayments.createdAt));
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(billingPayments).where(eq(billingPayments.id, id)).returning();
    return result.length > 0;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, userId)).returning();
    return result.length > 0;
  }

  async processDueBilling(): Promise<number> {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const dueSettings = await db.select()
      .from(billingSettings)
      .where(
        and(
          isNotNull(billingSettings.nextRunDate),
          lte(billingSettings.nextRunDate, todayStr)
        )
      );
    
    let processed = 0;
    
    for (const setting of dueSettings) {
      if (setting.baseAmount <= 0) continue;
      
      const period = setting.billingPeriod as BillingPeriod;
      const periodStartDate = new Date(setting.nextRunDate + 'T00:00:00');
      const periodEnd = calculatePeriodEnd(periodStartDate, period);
      const nextRunDate = calculateNextRunDate(periodStartDate, period);
      const discountAmount = setting.baseAmount * (setting.discountPercent / 100);
      const totalDue = setting.baseAmount - discountAmount;
      
      await db.insert(billingStatements).values({
        userId: setting.userId,
        periodStart: setting.nextRunDate!,
        periodEnd: format(periodEnd, 'yyyy-MM-dd'),
        billingPeriod: period,
        amount: setting.baseAmount,
        discountAmount,
        totalDue,
        status: 'pending',
        notes: 'Cargo periódico automático',
      });
      
      await db.update(billingSettings).set({
        nextRunDate: format(nextRunDate, 'yyyy-MM-dd'),
        lastRunAt: today,
      }).where(eq(billingSettings.userId, setting.userId));
      
      processed++;
    }
    
    return processed;
  }
}

export const adminStorage = new AdminStorage();
