export type TripType = 'CC' | 'Particular';
export type ExpenseType = 'Nafta' | 'Gas' | 'Otro';

export interface Trip {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  wait: number;
  type: TripType;
  origin?: string | null;
  destination?: string | null;
}

export interface Expense {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  type: ExpenseType;
  note?: string | null;
}

export interface ClosedDay {
  id: string;
  date: string; // ISO string YYYY-MM-DD
}

export interface UserSettings {
  userId: string;
  ownerCcPercent: number;
  driverPartPercent: number;
  expenseReimbPercent: number;
}

export interface DaySummary {
  date: string;
  totalIncome: number;
  totalExpenses: number;
  tripCount: number;
  expenseCount: number;
  
  // Specific totals for calculation
  incomeCC: number;
  incomePart: number;
  waitCC: number;
  waitPart: number;
  
  // Settlement
  ownerOwes: number; // (CC * 0.30) + Expenses
  driverOwes: number; // (Part * 0.70)
  balance: number; // ownerOwes - driverOwes (Positive: Owner pays Driver)
  
  // Pocket Cash Flow
  cashInHand: number; // (Part * 1.00)
  cashExpenses: number; // (Expenses * 1.00)
  pocketBalance: number; // cashInHand - cashExpenses
}
