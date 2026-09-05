import type { Trip, Expense, ClosedDay } from "@/types";

const API_BASE = "/api";

// Helper con credentials incluidas en todas las requests
function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });
}

// ============ TRIPS API ============

export async function fetchTrips(): Promise<Trip[]> {
  const response = await apiFetch(`${API_BASE}/trips`);
  if (!response.ok) throw new Error("Failed to fetch trips");
  return response.json();
}

export async function createTrip(trip: Omit<Trip, "id">): Promise<Trip> {
  const response = await apiFetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  if (!response.ok) throw new Error("Failed to create trip");
  return response.json();
}

export async function updateTrip(trip: Trip): Promise<Trip> {
  const response = await apiFetch(`${API_BASE}/trips/${trip.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: trip.date,
      amount: trip.amount,
      wait: trip.wait,
      type: trip.type,
      origin: trip.origin,
      destination: trip.destination,
    }),
  });
  if (!response.ok) throw new Error("Failed to update trip");
  return response.json();
}

export async function deleteTrip(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/trips/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete trip");
}

// ============ EXPENSES API ============

export async function fetchExpenses(): Promise<Expense[]> {
  const response = await apiFetch(`${API_BASE}/expenses`);
  if (!response.ok) throw new Error("Failed to fetch expenses");
  return response.json();
}

export async function createExpense(expense: Omit<Expense, "id">): Promise<Expense> {
  const response = await apiFetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!response.ok) throw new Error("Failed to create expense");
  return response.json();
}

export async function updateExpense(expense: Expense): Promise<Expense> {
  const response = await apiFetch(`${API_BASE}/expenses/${expense.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: expense.date,
      amount: expense.amount,
      type: expense.type,
      note: expense.note,
    }),
  });
  if (!response.ok) throw new Error("Failed to update expense");
  return response.json();
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete expense");
}

// ============ CLOSED DAYS API ============

export async function fetchClosedDays(): Promise<ClosedDay[]> {
  const response = await apiFetch(`${API_BASE}/closed-days`);
  if (!response.ok) throw new Error("Failed to fetch closed days");
  return response.json();
}

export async function closeDay(date: string): Promise<ClosedDay> {
  const response = await apiFetch(`${API_BASE}/closed-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!response.ok) throw new Error("Failed to close day");
  return response.json();
}

export async function openDay(date: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/closed-days/${date}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to open day");
}

// ============ SETTINGS API ============

export interface UserSettings {
  userId: string;
  ownerCcPercent: number;
  driverPartPercent: number;
  expenseReimbPercent: number;
}

export async function fetchSettings(): Promise<UserSettings> {
  const response = await apiFetch(`${API_BASE}/settings`);
  if (!response.ok) throw new Error("Failed to fetch settings");
  return response.json();
}

export async function updateSettings(settings: Partial<Omit<UserSettings, 'userId'>>): Promise<UserSettings> {
  const response = await apiFetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error("Failed to update settings");
  return response.json();
}
