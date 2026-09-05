const API_BASE = "/api";

// Helper con credentials incluidas en todas las requests
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });
}

export interface UserWithDetails {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    createdAt: Date | null;
  };
  account: {
    userId: string;
    role: string;
    status: string;
    suspensionReason: string | null;
    suspendedAt: Date | null;
    reactivatedAt: Date | null;
    notes: string | null;
  } | null;
  billing: {
    userId: string;
    billingPeriod: string;
    baseAmount: number;
    discountPercent: number;
    lastConfiguredAt: Date | null;
  } | null;
  totalOwed: number;
}

export interface BillingStatement {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  billingPeriod: string;
  amount: number;
  discountAmount: number;
  totalDue: number;
  amountPaid: number;
  status: string;
  notes: string | null;
  createdAt: Date | null;
}

export interface AccountStatus {
  account: { status: string; role: string };
  billing: UserWithDetails['billing'] | null;
  statements: BillingStatement[];
  totalOwed: number;
}

export interface RoleInfo {
  isAdmin: boolean;
  email: string;
}

export async function fetchRole(): Promise<RoleInfo> {
  const response = await apiFetch(`${API_BASE}/auth/role`);
  if (!response.ok) throw new Error("Failed to fetch role");
  return response.json();
}

export async function fetchAllUsers(): Promise<UserWithDetails[]> {
  const response = await apiFetch(`${API_BASE}/admin/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function fetchUserDetails(userId: string): Promise<UserWithDetails> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/suspend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error("Failed to suspend user");
}

export async function activateUser(userId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/activate`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to activate user");
}

export async function updateBillingSettings(userId: string, data: {
  billingPeriod?: string;
  baseAmount?: number;
  discountPercent?: number;
}): Promise<void> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/billing`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update billing");
}

export async function fetchUserStatements(userId: string): Promise<BillingStatement[]> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/statements`);
  if (!response.ok) throw new Error("Failed to fetch statements");
  return response.json();
}

export async function createStatement(userId: string, data: {
  periodStart: string;
  periodEnd: string;
  billingPeriod: string;
  amount: number;
  discountAmount: number;
  totalDue: number;
  notes?: string;
}): Promise<BillingStatement> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/statements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create statement");
  return response.json();
}

export async function updateStatement(id: string, data: {
  amountPaid?: number;
  status?: string;
  notes?: string;
}): Promise<BillingStatement> {
  const response = await apiFetch(`${API_BASE}/admin/statements/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update statement");
  return response.json();
}

export async function deleteStatement(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/admin/statements/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete statement");
}

export async function fetchAccountStatus(): Promise<AccountStatus> {
  const response = await apiFetch(`${API_BASE}/account/status`);
  if (!response.ok) throw new Error("Failed to fetch account status");
  return response.json();
}

export interface BillingPayment {
  id: string;
  userId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date | null;
}

export async function fetchUserPayments(userId: string): Promise<BillingPayment[]> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/payments`);
  if (!response.ok) throw new Error("Failed to fetch payments");
  return response.json();
}

export async function createPayment(userId: string, data: {
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
}): Promise<BillingPayment> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create payment");
  return response.json();
}

export async function deletePayment(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/admin/payments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete payment");
}

export async function deleteUser(userId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete user");
}
