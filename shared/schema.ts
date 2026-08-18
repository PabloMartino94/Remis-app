import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const ADMIN_EMAIL = "pablomartino94@gmail.com";

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  amount: real("amount").notNull(),
  wait: real("wait").notNull().default(0),
  type: varchar("type", { length: 20 }).notNull(),
  origin: text("origin"),
  destination: text("destination"),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  amount: real("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  note: text("note"),
});

export const closedDays = pgTable("closed_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
});

export const insertTripSchema = createInsertSchema(trips).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export const insertClosedDaySchema = createInsertSchema(closedDays).omit({ id: true });

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type ClosedDay = typeof closedDays.$inferSelect;
export type InsertClosedDay = z.infer<typeof insertClosedDaySchema>;

export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id").primaryKey(),
  ownerCcPercent: real("owner_cc_percent").notNull().default(0.30),
  driverPartPercent: real("driver_part_percent").notNull().default(0.70),
  expenseReimbPercent: real("expense_reimb_percent").notNull().default(1.0),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const updateUserSettingsSchema = insertUserSettingsSchema.omit({ userId: true }).partial();

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

export const userAccounts = pgTable("user_accounts", {
  userId: varchar("user_id").primaryKey(),
  role: varchar("role", { length: 20 }).notNull().default("driver"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  suspensionReason: text("suspension_reason"),
  suspendedAt: timestamp("suspended_at"),
  reactivatedAt: timestamp("reactivated_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billingSettings = pgTable("billing_settings", {
  userId: varchar("user_id").primaryKey(),
  billingPeriod: varchar("billing_period", { length: 20 }).notNull().default("monthly"),
  baseAmount: real("base_amount").notNull().default(0),
  discountPercent: real("discount_percent").notNull().default(0),
  lastConfiguredAt: timestamp("last_configured_at").defaultNow(),
  nextRunDate: date("next_run_date"),
  lastRunAt: timestamp("last_run_at"),
});

export const billingStatements = pgTable("billing_statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  billingPeriod: varchar("billing_period", { length: 20 }).notNull(),
  amount: real("amount").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  totalDue: real("total_due").notNull(),
  amountPaid: real("amount_paid").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billingPayments = pgTable("billing_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: real("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserAccountSchema = createInsertSchema(userAccounts);
export const updateUserAccountSchema = insertUserAccountSchema.omit({ userId: true, createdAt: true }).partial();

export const insertBillingSettingsSchema = createInsertSchema(billingSettings);
export const updateBillingSettingsSchema = insertBillingSettingsSchema.omit({ userId: true, lastConfiguredAt: true }).partial();

export const insertBillingStatementSchema = createInsertSchema(billingStatements).omit({ id: true, createdAt: true });
export const updateBillingStatementSchema = insertBillingStatementSchema.omit({ userId: true }).partial();

export type UserAccount = typeof userAccounts.$inferSelect;
export type InsertUserAccount = z.infer<typeof insertUserAccountSchema>;
export type UpdateUserAccount = z.infer<typeof updateUserAccountSchema>;

export type BillingSettings = typeof billingSettings.$inferSelect;
export type InsertBillingSettings = z.infer<typeof insertBillingSettingsSchema>;
export type UpdateBillingSettings = z.infer<typeof updateBillingSettingsSchema>;

export type BillingStatement = typeof billingStatements.$inferSelect;
export type InsertBillingStatement = z.infer<typeof insertBillingStatementSchema>;
export type UpdateBillingStatement = z.infer<typeof updateBillingStatementSchema>;

export const insertBillingPaymentSchema = createInsertSchema(billingPayments).omit({ id: true, createdAt: true });
export type BillingPayment = typeof billingPayments.$inferSelect;
export type InsertBillingPayment = z.infer<typeof insertBillingPaymentSchema>;

export const BILLING_PERIODS = ["monthly", "bimonthly", "quarterly", "four_month", "semiannual", "annual"] as const;
export type BillingPeriod = typeof BILLING_PERIODS[number];

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Mensual",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  four_month: "Cuatrimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export const ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type AccountStatus = typeof ACCOUNT_STATUSES[number];
