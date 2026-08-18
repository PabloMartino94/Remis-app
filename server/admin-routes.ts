import type { Express, RequestHandler } from "express";
import { adminStorage } from "./admin-storage";
import { ADMIN_EMAIL, updateUserAccountSchema, updateBillingSettingsSchema, insertBillingStatementSchema, updateBillingStatementSchema, insertBillingPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./auth";

const isAdminCheck: RequestHandler = async (req: any, res, next) => {
  const email = req.user?.email;
  if (email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/users", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const users = await adminStorage.getAllUsersWithDetails();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:userId", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await adminStorage.getUserWithDetails(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/admin/users/:userId/account", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const validatedData = updateUserAccountSchema.parse(req.body);
      const account = await adminStorage.updateUserAccount(userId, validatedData);
      if (!account) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating account:", error);
        res.status(500).json({ error: "Failed to update account" });
      }
    }
  });

  app.post("/api/admin/users/:userId/suspend", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const account = await adminStorage.suspendUser(userId, reason || "Falta de pago");
      if (!account) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(account);
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ error: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/users/:userId/activate", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const account = await adminStorage.activateUser(userId);
      if (!account) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(account);
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ error: "Failed to activate user" });
    }
  });

  app.delete("/api/admin/users/:userId", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const deleted = await adminStorage.deleteUser(userId);
      if (!deleted) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.put("/api/admin/users/:userId/billing", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const validatedData = updateBillingSettingsSchema.parse(req.body);
      
      if (validatedData.baseAmount !== undefined && validatedData.baseAmount < 0) {
        res.status(400).json({ error: "baseAmount must be >= 0" });
        return;
      }
      if (validatedData.discountPercent !== undefined && (validatedData.discountPercent < 0 || validatedData.discountPercent > 100)) {
        res.status(400).json({ error: "discountPercent must be between 0 and 100" });
        return;
      }

      const settings = await adminStorage.updateBillingSettings(userId, validatedData);
      if (!settings) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating billing settings:", error);
        res.status(500).json({ error: "Failed to update billing settings" });
      }
    }
  });

  app.get("/api/admin/users/:userId/statements", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const statements = await adminStorage.getUserStatements(userId);
      res.json(statements);
    } catch (error) {
      console.error("Error fetching statements:", error);
      res.status(500).json({ error: "Failed to fetch statements" });
    }
  });

  app.get("/api/admin/users/:userId/payments", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const payments = await adminStorage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/admin/users/:userId/payments", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const data = { ...req.body, userId };
      const validatedData = insertBillingPaymentSchema.parse(data);
      const payment = await adminStorage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error creating payment:", error);
        res.status(500).json({ error: "Failed to create payment" });
      }
    }
  });

  app.delete("/api/admin/payments/:id", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await adminStorage.deletePayment(id);
      if (!deleted) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  app.post("/api/admin/users/:userId/statements", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const data = { ...req.body, userId };
      const validatedData = insertBillingStatementSchema.parse(data);
      const statement = await adminStorage.createBillingStatement(validatedData);
      res.status(201).json(statement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error creating statement:", error);
        res.status(500).json({ error: "Failed to create statement" });
      }
    }
  });

  app.patch("/api/admin/statements/:id", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateBillingStatementSchema.parse(req.body);
      const statement = await adminStorage.updateBillingStatement(id, validatedData);
      if (!statement) {
        res.status(404).json({ error: "Statement not found" });
        return;
      }
      res.json(statement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating statement:", error);
        res.status(500).json({ error: "Failed to update statement" });
      }
    }
  });

  app.delete("/api/admin/statements/:id", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await adminStorage.deleteStatement(id);
      if (!deleted) {
        res.status(404).json({ error: "Statement not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting statement:", error);
      res.status(500).json({ error: "Failed to delete statement" });
    }
  });

  app.get("/api/account/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const account = await adminStorage.getUserAccount(userId);
      const billing = await adminStorage.getBillingSettings(userId);
      const statements = await adminStorage.getUserStatements(userId);
      const totalOwed = await adminStorage.getUserTotalOwed(userId);

      res.json({
        account: account || { status: 'active', role: 'driver' },
        billing,
        statements,
        totalOwed,
      });
    } catch (error) {
      console.error("Error fetching account status:", error);
      res.status(500).json({ error: "Failed to fetch account status" });
    }
  });

  app.get("/api/auth/role", isAuthenticated, async (req: any, res) => {
    try {
      const email = req.user?.email;
      const isAdmin = email === ADMIN_EMAIL;
      res.json({ isAdmin, email });
    } catch (error) {
      console.error("Error checking role:", error);
      res.status(500).json({ error: "Failed to check role" });
    }
  });

  app.post("/api/admin/billing/process", isAuthenticated, isAdminCheck, async (req: any, res) => {
    try {
      const processed = await adminStorage.processDueBilling();
      res.json({ processed, message: `Se procesaron ${processed} cargos pendientes` });
    } catch (error) {
      console.error("Error processing billing:", error);
      res.status(500).json({ error: "Failed to process billing" });
    }
  });
}

export async function runBillingCheck(): Promise<void> {
  try {
    const processed = await adminStorage.processDueBilling();
    if (processed > 0) {
      console.log(`[Billing] Processed ${processed} due billing charges`);
    }
  } catch (error) {
    console.error("[Billing] Error processing due billing:", error);
  }
}
