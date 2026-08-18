import { Trip, Expense, DaySummary, UserSettings } from "../types";

export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId'> = {
  ownerCcPercent: 0.30,
  driverPartPercent: 0.70,
  expenseReimbPercent: 1.0,
};

export const calculateDaySummary = (
  date: string, 
  trips: Trip[], 
  expenses: Expense[],
  settings: Omit<UserSettings, 'userId'> = DEFAULT_SETTINGS
): DaySummary => {
  const dayTrips = trips.filter(t => t.date === date);
  const dayExpenses = expenses.filter(e => e.date === date);

  let incomeCC = 0;
  let incomePart = 0;
  let waitCC = 0;
  let waitPart = 0;

  dayTrips.forEach(t => {
    if (t.type === 'CC') {
      incomeCC += t.amount;
      waitCC += t.wait;
    } else {
      incomePart += t.amount;
      waitPart += t.wait;
    }
  });

  const totalIncome = incomeCC + incomePart + waitCC + waitPart;
  const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Owner owes Driver: X% of CC (Trip + Wait) + Y% of Expenses
  const ownerOwes = ((incomeCC + waitCC) * settings.ownerCcPercent) + (totalExpenses * settings.expenseReimbPercent);

  // Driver owes Owner: Z% of Particular (Trip + Wait)
  const driverOwes = (incomePart + waitPart) * settings.driverPartPercent;

  // Balance: Positive means Owner pays Driver
  const balance = ownerOwes - driverOwes;

  // Pocket Cash: Driver holds 100% of Particular (Trip + Wait)
  const cashInHand = incomePart + waitPart;
  const cashExpenses = totalExpenses;
  const pocketBalance = cashInHand - cashExpenses;

  return {
    date,
    totalIncome,
    totalExpenses,
    tripCount: dayTrips.length,
    expenseCount: dayExpenses.length,
    incomeCC,
    incomePart,
    waitCC,
    waitPart,
    ownerOwes,
    driverOwes,
    balance,
    cashInHand,
    cashExpenses,
    pocketBalance
  };
};
