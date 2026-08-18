# Gestión Remís — Especificación completa para Antigravity

## Descripción general

Aplicación web mobile-first en español para conductores de remís (taxi/rideshare). Permite registrar viajes, gastos y cerrar turnos diarios con liquidación automática entre conductor y dueño. Incluye entrada por voz en español, geolocalización GPS, gráficos de ingresos y un panel de administración exclusivo.

**Idioma de interfaz:** Español (Argentina)  
**Stack:** React + TypeScript + Tailwind CSS + shadcn/ui + Express.js + PostgreSQL + Drizzle ORM  
**Autenticación:** Replit Auth (OpenID Connect via Passport.js)  
**Email:** Resend API (notificación al admin cuando se registra un usuario nuevo)  
**Admin exclusivo:** pablomartino94@gmail.com (hardcodeado en servidor)

---

## Base de datos — `shared/schema.ts`

```ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ADMIN_EMAIL = "pablomartino94@gmail.com";

// Viajes
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  amount: real("amount").notNull(),
  wait: real("wait").notNull().default(0),         // Tiempo de espera ($)
  type: varchar("type", { length: 20 }).notNull(), // "CC" | "Particular"
  origin: text("origin"),
  destination: text("destination"),
});

// Gastos
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  amount: real("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "Nafta" | "Gas" | "Otro"
  note: text("note"),
});

// Días cerrados (turno cerrado = no editable)
export const closedDays = pgTable("closed_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
});

// Configuración de porcentajes de liquidación por usuario
export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id").primaryKey(),
  ownerCcPercent: real("owner_cc_percent").notNull().default(0.30),       // % CC que se queda el dueño
  driverPartPercent: real("driver_part_percent").notNull().default(0.70), // % Particular que se queda el dueño
  expenseReimbPercent: real("expense_reimb_percent").notNull().default(1.0), // % gastos que reembolsa el dueño
});

// Cuentas de usuario (admin, estado)
export const userAccounts = pgTable("user_accounts", {
  userId: varchar("user_id").primaryKey(),
  role: varchar("role", { length: 20 }).notNull().default("driver"),     // "driver" | "admin"
  status: varchar("status", { length: 20 }).notNull().default("active"), // "active" | "suspended"
  suspensionReason: text("suspension_reason"),
  suspendedAt: timestamp("suspended_at"),
  reactivatedAt: timestamp("reactivated_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Configuración de facturación por usuario (definida por admin)
export const billingSettings = pgTable("billing_settings", {
  userId: varchar("user_id").primaryKey(),
  billingPeriod: varchar("billing_period", { length: 20 }).notNull().default("monthly"),
  baseAmount: real("base_amount").notNull().default(0),
  discountPercent: real("discount_percent").notNull().default(0),
  lastConfiguredAt: timestamp("last_configured_at").defaultNow(),
  nextRunDate: date("next_run_date"),
  lastRunAt: timestamp("last_run_at"),
});

// Cargos/estados de cuenta individuales
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
  status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending" | "paid" | "overdue"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pagos registrados por el admin
export const billingPayments = pgTable("billing_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: real("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas Zod
export const insertTripSchema = createInsertSchema(trips).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export const insertClosedDaySchema = createInsertSchema(closedDays).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const updateUserSettingsSchema = insertUserSettingsSchema.omit({ userId: true }).partial();
export const insertUserAccountSchema = createInsertSchema(userAccounts);
export const updateUserAccountSchema = insertUserAccountSchema.omit({ userId: true, createdAt: true }).partial();
export const insertBillingSettingsSchema = createInsertSchema(billingSettings);
export const updateBillingSettingsSchema = insertBillingSettingsSchema.omit({ userId: true, lastConfiguredAt: true }).partial();
export const insertBillingStatementSchema = createInsertSchema(billingStatements).omit({ id: true, createdAt: true });
export const updateBillingStatementSchema = insertBillingStatementSchema.omit({ userId: true }).partial();
export const insertBillingPaymentSchema = createInsertSchema(billingPayments).omit({ id: true, createdAt: true });

// Tipos
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type ClosedDay = typeof closedDays.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UserAccount = typeof userAccounts.$inferSelect;
export type UpdateUserAccount = z.infer<typeof updateUserAccountSchema>;
export type BillingSettings = typeof billingSettings.$inferSelect;
export type UpdateBillingSettings = z.infer<typeof updateBillingSettingsSchema>;
export type BillingStatement = typeof billingStatements.$inferSelect;
export type InsertBillingStatement = z.infer<typeof insertBillingStatementSchema>;
export type UpdateBillingStatement = z.infer<typeof updateBillingStatementSchema>;
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
```

---

## Lógica de liquidación — `client/src/lib/calculations.ts`

```ts
// DEFAULT: dueño se queda 30% CC, dueño recibe 70% Particular, dueño reembolsa 100% gastos
// Configurable por usuario desde Configuración

export const calculateDaySummary = (date, trips, expenses, settings) => {
  // Separar CC y Particular (incluye espera en cada categoría)
  let incomeCC = 0, incomePart = 0, waitCC = 0, waitPart = 0;
  dayTrips.forEach(t => {
    if (t.type === 'CC') { incomeCC += t.amount; waitCC += t.wait; }
    else { incomePart += t.amount; waitPart += t.wait; }
  });

  // Dueño le debe al conductor: X% de CC+espera CC + Y% de gastos
  const ownerOwes = ((incomeCC + waitCC) * settings.ownerCcPercent) + (totalExpenses * settings.expenseReimbPercent);

  // Conductor le debe al dueño: Z% de Particular+espera Particular
  const driverOwes = (incomePart + waitPart) * settings.driverPartPercent;

  // Balance: positivo = dueño paga al conductor
  const balance = ownerOwes - driverOwes;

  // Caja conductor: 100% Particular+espera - gastos
  const pocketBalance = (incomePart + waitPart) - totalExpenses;
};
```

---

## API Routes — `server/routes.ts`

Todas protegidas con `isAuthenticated`. Los datos están aislados por `userId = req.user.claims.sub`.

### Viajes
- `GET /api/trips` — Lista todos los viajes del usuario
- `POST /api/trips` — Crea viaje (valida con `insertTripSchema`)
- `PATCH /api/trips/:id` — Edita viaje propio
- `DELETE /api/trips/:id` — Elimina viaje propio

### Gastos
- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`

### Días cerrados
- `GET /api/closed-days`
- `POST /api/closed-days` — Body: `{ date: "yyyy-MM-dd" }`
- `DELETE /api/closed-days/:date` — Reabre el día

### Geocodificación inversa (proxy al servidor para ocultar User-Agent)
- `GET /api/geocode/reverse?lat=X&lng=Y` — Llama a OpenStreetMap Nominatim, retorna `{ address, lat, lng }`. Timeout 5s. Si falla, el cliente usa coordenadas crudas.

### Configuración de porcentajes
- `GET /api/settings` — Retorna `UserSettings` (crea con defaults si no existe)
- `PUT /api/settings` — Actualiza porcentajes. Validación: valores entre 0 y 1.

### Estado de cuenta (usuario)
- `GET /api/account/status` — Retorna `{ account, billing, statements, totalOwed }`

### Rol
- `GET /api/auth/role` — Retorna `{ isAdmin: boolean, email: string }`

---

## API Admin — `server/admin-routes.ts`

Protegidas con `isAuthenticated` + `isAdminCheck` (verifica `email === ADMIN_EMAIL`).

### Usuarios
- `GET /api/admin/users` — Lista todos los usuarios con detalles (cuenta, facturación, total adeudado)
- `GET /api/admin/users/:userId`
- `PATCH /api/admin/users/:userId/account` — Edita campos de la cuenta
- `POST /api/admin/users/:userId/suspend` — Body: `{ reason }`. Default reason: "Falta de pago"
- `POST /api/admin/users/:userId/activate`
- `DELETE /api/admin/users/:userId` — Elimina de la tabla `users` (preserva trips/expenses/billing)

### Facturación
- `PUT /api/admin/users/:userId/billing` — Configura período, monto base, descuento. Si es primera configuración y monto > 0, crea cargo inicial automáticamente.
- `GET /api/admin/users/:userId/statements`
- `POST /api/admin/users/:userId/statements`
- `PATCH /api/admin/statements/:id`
- `DELETE /api/admin/statements/:id`

### Pagos
- `GET /api/admin/users/:userId/payments`
- `POST /api/admin/users/:userId/payments`
- `DELETE /api/admin/payments/:id`

### Facturación automática
- `POST /api/admin/billing/process` — Procesa cargos periódicos vencidos (también se ejecuta al iniciar el servidor via `runBillingCheck()`)

**Lógica de billing automático:** Al configurar billing se setea `nextRunDate`. Cada vez que `nextRunDate <= hoy`, se genera un nuevo `billingStatement` y se avanza `nextRunDate` al próximo período.

---

## Servicio de email — `server/resend-service.ts`

```ts
// Se llama cuando un nuevo usuario se autentica por primera vez
// Notifica al admin: pablomartino94@gmail.com
// Usa: RESEND_API_KEY (env secret)
// From: onboarding@resend.dev
// Subject: "Nuevo usuario registrado en Remis Control"
// Incluye email del usuario y fecha/hora (timezone: America/Argentina/Buenos_Aires)
```

---

## Frontend — Estructura de páginas

### `client/src/App.tsx`
```
/           → LandingPage (si no autenticado) | redirect a /dashboard
/dashboard  → Dashboard (requiere auth)
/admin      → AdminPanel (requiere auth + isAdmin)
/account    → AccountPage (estado de cuenta del usuario, requiere auth)
/settings   → SettingsPage (configuración de porcentajes, requiere auth)
```

### Suspensión de cuenta
Si `account.status === 'suspended'`, mostrar overlay bloqueante con:
- Mensaje de suspensión
- Razón de suspensión
- Total adeudado
- Instrucción de contactar al administrador
- NO permitir usar la app

---

## Dashboard — `client/src/pages/Dashboard.tsx`

Layout mobile-first: `max-w-md mx-auto`. Header arriba, bottom navigation, contenido central.

### Tabs (BottomNav)
1. **Viajes** (`trips`) — Formulario + lista de viajes del día actual
2. **Gastos** (`expenses`) — Formulario + lista de gastos del día actual
3. **Resumen** (`summary`) — Liquidación del día seleccionado
4. **Gráfico** (`charts`) — Tendencia de ingresos 7 días

### Header
- Nombre de la app: "Gestión Remís"
- Fecha actual (navegable: anterior/siguiente día)
- Avatar/menú del usuario (logout)
- Indicador si el día está cerrado (badge "Turno Cerrado")

---

## Formulario de Viajes — `TripForm.tsx`

### Campos
- **Monto ($)** — number, step 0.01, mínimo 0.01
- **Espera ($)** — number, step 0.01, default 0 (tiempo de espera cobrado)
- **Tipo** — RadioGroup visual: `Particular` (verde) | `Cta. Cte.` (azul)
- **Origen** — text opcional + botón MapPin (GPS)
- **Destino** — text opcional + botón MapPin (GPS)
- **Distancia** — se muestra automáticamente si ambos campos tienen coordenadas GPS (fórmula Haversine)
- **Botón voz** — solo en modo creación (no edición)

### GPS
- Al pulsar MapPin: pide ubicación del navegador → llama a `/api/geocode/reverse` → setea campo de texto + guarda lat/lng en estado del form (NO se persisten en BD)
- Si geocoding falla: usa coordenadas crudas como texto
- Fallback: toast "No se pudo obtener la dirección"

### Cálculo de distancia (Haversine)
```ts
// Solo se calcula en memoria cuando ambos campos tienen coordenadas GPS
// Fórmula Haversine con R = 6371 km
// Formato: "1.2 km" o "850 m" (si < 1km)
```

### Voz (solo modo creación)
- Web Speech API, locale `es-AR`
- Botón micrófono: outline normal / destructive cuando está grabando (spinner)
- Al terminar: parsea el transcript con `parseTripVoiceCommand()`
- Toast con campos reconocidos o advertencia si no se entendió nada

---

## Parser de voz — `client/src/lib/voice-parser.ts`

### `parseTripVoiceCommand(text)` → `{ amount, wait, type, origin, destination }`

**Normalización:** minúsculas, sin tildes, sin ñ

**Extracción de monto** (excluye la parte de espera antes de parsear):
- Decimales: "500 con 50" → 500.50 | "500,50 pesos" → 500.50
- Con palabra: "500 pesos", "monto 500"
- Solo número al inicio: "500 ..."
- Palabras: "mil"=1000, "quinientos"=500, etc.

**Extracción de espera:**
- "espera de 100" | "100 de espera" | "100 espera"

**Tipo de viaje:**
- CC: "cuenta corriente", "cta cte", "cc", "empresa", "corporativo", "compania"
- Particular: "particular", "privado", "personal", "calle"

**Origen/Destino:**
- "desde [origen] hasta [destino]"
- "de [origen] a [destino]"
- "origen [o] destino [d]"
- Solo destino: "hasta [destino]"

**Ejemplos de comandos:**
- "500 pesos particular desde centro hasta barrio norte"
- "mil cc desde aeropuerto hasta terminal"
- "800 con 50 de espera 100 particular"
- "quinientos nafta" (gasto)

### `parseExpenseVoiceCommand(text)` → `{ amount, type }`

**Tipos:**
- Nafta: "nafta", "combustible", "gasolina", "super", "premium"
- Gas: "gas", "gnc", "gnv"
- Otro: "otro", "peaje", "estacionamiento", "lavado"

---

## Formulario de Gastos — `ExpenseForm.tsx`

### Campos
- **Monto ($)** — number
- **Tipo** — Select: Nafta | Gas | Otro
- **Nota** — text opcional
- **Botón voz** — `parseExpenseVoiceCommand()`

---

## Lista de Viajes — `TripList.tsx`

- Muestra viajes del `currentDate`
- Si el día está cerrado: badge "Turno Cerrado", sin botones de edición/eliminación
- Cada viaje: monto, tipo (badge CC/Particular), espera si > 0, origen→destino si existen
- Botón editar → activa modo edición en TripForm (editId prop)
- Botón eliminar → confirmación → deleteTrip
- Agrupados por tipo, subtotales CC y Particular

---

## Resumen del día — `SummaryView.tsx`

### Datos mostrados
- Total ingresos (CC + Particular + esperas)
- Total gastos
- Ingresos CC / Particular separados
- Espera CC / Particular separados
- **Dueño le debe al conductor:** X% de CC+espera + Y% de gastos
- **Conductor le debe al dueño:** Z% de Particular+espera
- **Balance neto** (positivo = dueño paga, negativo = conductor paga)
- **Caja del conductor:** 100% Particular+espera − gastos

### Cierre de turno
- Botón "Cerrar Turno" → `POST /api/closed-days`
- Botón "Reabrir Turno" → `DELETE /api/closed-days/:date`
- Día cerrado: datos en modo lectura, sin edición

---

## Gráfico de ingresos — `IncomeChart.tsx`

- Barras apiladas: últimos 7 días con datos
- Serie 1: Ingresos CC
- Serie 2: Ingresos Particular
- Eje X: fecha formateada en español
- Usa Recharts

---

## Configuración de porcentajes — `SettingsPage.tsx`

Permite al conductor configurar sus propios porcentajes de liquidación:
- **% CC que retiene el dueño** (default 30%)
- **% Particular que retiene el dueño** (default 70%)
- **% Gastos que reembolsa el dueño** (default 100%)

Inputs tipo range + número. Validación: 0–100%. Guardado via `PUT /api/settings`.

---

## Panel de administración — `AdminPanel.tsx`

Solo accesible para `pablomartino94@gmail.com`.

### Lista de usuarios
Tabla con columnas:
- Nombre / Email
- Estado (active/suspended) — badge de color
- Rol
- Período de facturación
- Monto base
- Total adeudado
- Acciones: Ver detalle | Suspender | Activar | Eliminar

### Detalle de usuario
- Datos del perfil
- Botones: Suspender (con razón) / Activar
- **Sección Facturación:**
  - Período: Mensual / Bimestral / Trimestral / Cuatrimestral / Semestral / Anual
  - Monto base ($)
  - Descuento (%)
  - Guardar → `PUT /api/admin/users/:id/billing`
- **Estados de cuenta** (tabla):
  - Período, monto, descuento, total, pagado, estado
  - Botones: Editar | Eliminar
  - Botón: + Nuevo cargo manual
- **Pagos registrados** (tabla):
  - Fecha, monto, método, notas
  - Botón: + Registrar pago | Eliminar pago
- **Botón:** "Procesar cargos automáticos" → `POST /api/admin/billing/process`

---

## Estado de cuenta del usuario — `AccountPage.tsx`

Vista para conductores (no admin). Muestra:
- Estado de su cuenta (activo/suspendido)
- Período de facturación configurado
- Lista de estados de cuenta con montos y estado (pending/paid/overdue)
- Total adeudado

---

## AppContext — `client/src/context/AppContext.tsx`

Estado global gestionado con TanStack React Query:
- `currentDate` (string "yyyy-MM-dd") — navegable
- `trips`, `expenses` — cargados para todo el usuario (filtrado por fecha en cliente)
- `closedDays` — lista de `{ date }` cerrados
- `settings` — porcentajes de liquidación
- Mutaciones: addTrip, updateTrip, deleteTrip, addExpense, updateExpense, deleteExpense, closeDay, openDay, updateSettings

---

## Hook de geolocalización — `use-current-position.ts`

```ts
// Envuelve navigator.geolocation.getCurrentPosition
// Retorna: { getPosition, isLoading, error }
// getPosition() → Promise<{ latitude, longitude } | null>
// Maneja errores de permisos con mensajes en español
```

---

## Hook de voz — `use-speech-capture.ts`

```ts
// Usa Web Speech API (window.SpeechRecognition || window.webkitSpeechRecognition)
// lang: "es-AR"
// continuous: false, interimResults: false
// Retorna: { transcript, isListening, error, isSupported, start, stop }
// Si el error es "aborted" no dispara toast (evita duplicados)
// isSupported: false en navegadores sin soporte → el botón no se renderiza
```

---

## Autenticación — `server/replit_integrations/auth/`

- Passport.js con estrategia OIDC (Replit Auth)
- Sesiones en PostgreSQL con `connect-pg-simple`
- Variables necesarias: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`, `DATABASE_URL`
- Al primer login de un usuario nuevo: se llama a `sendNewUserNotification(email)` vía Resend

---

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret para firmar sesiones |
| `REPL_ID` | ID del repl (Replit Auth) |
| `ISSUER_URL` | URL del proveedor OIDC de Replit |
| `RESEND_API_KEY` | API key de Resend para emails |

---

## Integraciones de Replit utilizadas

- `javascript_log_in_with_replit` — autenticación OIDC
- `resend` — envío de emails al admin

---

## Comandos de desarrollo

```bash
npm run dev       # Inicia servidor Express + Vite dev server (HMR)
npm run db:push   # Aplica migraciones de Drizzle al DB
npm run build     # Build para producción (esbuild server + Vite client)
```

---

## Notas de implementación importantes

1. **Aislamiento de datos:** Todo query al DB filtra por `userId`. Nunca se exponen datos de otros usuarios.

2. **Admin hardcodeado:** `ADMIN_EMAIL = "pablomartino94@gmail.com"` en `shared/schema.ts`. El middleware `isAdminCheck` en el servidor verifica `req.user.claims.email === ADMIN_EMAIL`.

3. **Coordenadas GPS no se persisten:** Se guardan solo en el estado del formulario React. La BD solo guarda los campos `origin` y `destination` como texto.

4. **Cierre de turno:** Un día cerrado bloquea la edición en el cliente Y en el servidor (el servidor debe verificar si el día está cerrado antes de permitir mutaciones de viajes/gastos en ese día).

5. **Billing automático:** `runBillingCheck()` se ejecuta al iniciar el servidor y via endpoint admin. Genera cargos para todos los usuarios con `nextRunDate <= hoy`.

6. **Suspensión:** Usuario suspendido ve un overlay que bloquea toda la UI. Se detecta al cargar `/api/account/status`.

7. **Voz solo en creación:** `VoiceInputButton` no aparece en modo edición del TripForm.

8. **Diseño mobile-first:** `max-w-md mx-auto`, bottom navigation de 4 tabs, padding lateral 16px.

9. **Locale:** `date-fns` con `es` locale para fechas en español. Speech Recognition en `es-AR`.

10. **Geocoding:** Proxy en servidor para evitar restricciones de CORS y User-Agent de Nominatim. Timeout de 5 segundos. Si falla, se usan coordenadas crudas.
