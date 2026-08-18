import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTripSchema, insertExpenseSchema, updateUserSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { registerAdminRoutes } from "./admin-routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  registerAuthRoutes(app);
  registerAdminRoutes(app);

  app.get("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trips = await storage.getAllTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertTripSchema.parse({ ...req.body, userId });
      const trip = await storage.createTrip(validatedData);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trip data", details: error.errors });
      } else {
        console.error("Error creating trip:", error);
        res.status(500).json({ error: "Failed to create trip" });
      }
    }
  });

  app.patch("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { userId: _, ...bodyWithoutUserId } = req.body;
      const validatedData = insertTripSchema.omit({ userId: true }).partial().parse(bodyWithoutUserId);
      const trip = await storage.updateTrip(id, userId, validatedData);
      
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trip data", details: error.errors });
      } else {
        console.error("Error updating trip:", error);
        res.status(500).json({ error: "Failed to update trip" });
      }
    }
  });

  app.delete("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const success = await storage.deleteTrip(id, userId);
      
      if (!success) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  app.get("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const expenses = await storage.getAllExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertExpenseSchema.parse({ ...req.body, userId });
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid expense data", details: error.errors });
      } else {
        console.error("Error creating expense:", error);
        res.status(500).json({ error: "Failed to create expense" });
      }
    }
  });

  app.patch("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { userId: _, ...bodyWithoutUserId } = req.body;
      const validatedData = insertExpenseSchema.omit({ userId: true }).partial().parse(bodyWithoutUserId);
      const expense = await storage.updateExpense(id, userId, validatedData);
      
      if (!expense) {
        res.status(404).json({ error: "Expense not found" });
        return;
      }
      
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid expense data", details: error.errors });
      } else {
        console.error("Error updating expense:", error);
        res.status(500).json({ error: "Failed to update expense" });
      }
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const success = await storage.deleteExpense(id, userId);
      
      if (!success) {
        res.status(404).json({ error: "Expense not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  app.get("/api/closed-days", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const closedDays = await storage.getAllClosedDays(userId);
      res.json(closedDays);
    } catch (error) {
      console.error("Error fetching closed days:", error);
      res.status(500).json({ error: "Failed to fetch closed days" });
    }
  });

  app.post("/api/closed-days", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.body;
      
      if (!date || typeof date !== 'string') {
        res.status(400).json({ error: "Date is required" });
        return;
      }
      
      const closedDay = await storage.closeDay(userId, date);
      res.status(201).json(closedDay);
    } catch (error) {
      console.error("Error closing day:", error);
      res.status(500).json({ error: "Failed to close day" });
    }
  });

  app.delete("/api/closed-days/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.params;
      const success = await storage.openDay(userId, date);
      
      if (!success) {
        res.status(404).json({ error: "Closed day not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error opening day:", error);
      res.status(500).json({ error: "Failed to open day" });
    }
  });

  app.get("/api/geocode/reverse", isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        res.status(400).json({ error: "lat and lng are required" });
        return;
      }

      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      
      if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        res.status(400).json({ error: "Invalid coordinates" });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GestionRemis/1.0',
            'Accept-Language': 'es',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeout);

      if (!response.ok) {
        console.error("Nominatim error:", response.status, response.statusText);
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error("Nominatim API error:", data.error);
        throw new Error(data.error);
      }
      
      let address = data.display_name || `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`;
      if (data.address) {
        const parts = [];
        if (data.address.road) {
          let roadStr = data.address.road;
          if (data.address.house_number) roadStr += ` ${data.address.house_number}`;
          parts.push(roadStr);
        }
        if (data.address.suburb || data.address.neighbourhood) {
          parts.push(data.address.suburb || data.address.neighbourhood);
        }
        if (data.address.city || data.address.town || data.address.village) {
          parts.push(data.address.city || data.address.town || data.address.village);
        }
        if (parts.length > 0) {
          address = parts.join(', ');
        }
      }

      res.json({ address, lat: latNum, lng: lngNum });
    } catch (error: any) {
      console.error("Error in reverse geocoding:", error.message || error);
      if (error.name === 'AbortError') {
        res.status(504).json({ error: "Tiempo de espera agotado" });
      } else {
        res.status(500).json({ error: "No se pudo obtener la dirección" });
      }
    }
  });

  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = updateUserSettingsSchema.parse(req.body);
      
      if (validatedData.ownerCcPercent !== undefined && (validatedData.ownerCcPercent < 0 || validatedData.ownerCcPercent > 1)) {
        res.status(400).json({ error: "ownerCcPercent must be between 0 and 1" });
        return;
      }
      if (validatedData.driverPartPercent !== undefined && (validatedData.driverPartPercent < 0 || validatedData.driverPartPercent > 1)) {
        res.status(400).json({ error: "driverPartPercent must be between 0 and 1" });
        return;
      }
      if (validatedData.expenseReimbPercent !== undefined && (validatedData.expenseReimbPercent < 0 || validatedData.expenseReimbPercent > 1)) {
        res.status(400).json({ error: "expenseReimbPercent must be between 0 and 1" });
        return;
      }
      
      const settings = await storage.updateUserSettings(userId, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        console.error("Error updating settings:", error);
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  return httpServer;
}
