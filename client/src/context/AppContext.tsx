import React, { createContext, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trip, Expense, DaySummary, ClosedDay, UserSettings } from "../types";
import { calculateDaySummary, DEFAULT_SETTINGS } from "../lib/calculations";
import { format } from "date-fns";
import * as api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface AppContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  trips: Trip[];
  expenses: Expense[];
  settings: Omit<UserSettings, 'userId'>;
  addTrip: (trip: Omit<Trip, "id">) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getDaySummary: (date: string) => DaySummary;
  allSummaries: DaySummary[];
  closeDay: (date: string) => Promise<void>;
  openDay: (date: string) => Promise<void>;
  isDayClosed: (date: string) => boolean;
  updateSettings: (settings: Partial<Omit<UserSettings, 'userId'>>) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: api.fetchTrips,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: api.fetchExpenses,
  });

  const { data: closedDaysData = [], isLoading: closedDaysLoading } = useQuery({
    queryKey: ["closedDays"],
    queryFn: api.fetchClosedDays,
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: api.fetchSettings,
  });

  const settings: Omit<UserSettings, 'userId'> = settingsData || DEFAULT_SETTINGS;
  const isLoading = tripsLoading || expensesLoading || closedDaysLoading || settingsLoading;

  const createTripMutation = useMutation({
    mutationFn: api.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el viaje", variant: "destructive" });
    },
  });

  const updateTripMutation = useMutation({
    mutationFn: api.updateTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el viaje", variant: "destructive" });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: api.deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar el viaje", variant: "destructive" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el gasto", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: api.updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el gasto", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar el gasto", variant: "destructive" });
    },
  });

  const closeDayMutation = useMutation({
    mutationFn: api.closeDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closedDays"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo cerrar el turno", variant: "destructive" });
    },
  });

  const openDayMutation = useMutation({
    mutationFn: api.openDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closedDays"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo reabrir el turno", variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Guardado", description: "Configuración actualizada correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
    },
  });

  const addTrip = async (tripData: Omit<Trip, "id">) => {
    await createTripMutation.mutateAsync(tripData);
  };

  const updateTrip = async (updatedTrip: Trip) => {
    await updateTripMutation.mutateAsync(updatedTrip);
  };

  const deleteTrip = async (id: string) => {
    await deleteTripMutation.mutateAsync(id);
  };

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    await createExpenseMutation.mutateAsync(expenseData);
  };

  const updateExpense = async (updatedExpense: Expense) => {
    await updateExpenseMutation.mutateAsync(updatedExpense);
  };

  const deleteExpense = async (id: string) => {
    await deleteExpenseMutation.mutateAsync(id);
  };

  const closeDay = async (date: string) => {
    await closeDayMutation.mutateAsync(date);
  };

  const openDay = async (date: string) => {
    await openDayMutation.mutateAsync(date);
  };

  const isDayClosed = (date: string) => {
    return closedDaysData.some((cd) => cd.date === date);
  };

  const updateSettings = async (newSettings: Partial<Omit<UserSettings, 'userId'>>) => {
    await updateSettingsMutation.mutateAsync(newSettings);
  };

  const getDaySummary = (date: string) => {
    return calculateDaySummary(date, trips, expenses, settings);
  };

  const allSummaries = Array.from(new Set([...trips.map(t => t.date), ...expenses.map(e => e.date)]))
    .sort()
    .map(date => calculateDaySummary(date, trips, expenses, settings));

  return (
    <AppContext.Provider value={{
      currentDate,
      setCurrentDate,
      trips,
      expenses,
      settings,
      addTrip,
      updateTrip,
      deleteTrip,
      addExpense,
      updateExpense,
      deleteExpense,
      getDaySummary,
      allSummaries,
      closeDay,
      openDay,
      isDayClosed,
      updateSettings,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
