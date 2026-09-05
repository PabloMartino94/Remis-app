import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { Dashboard } from "@/pages/Dashboard";
import { LandingPage } from "@/pages/LandingPage";
import { AdminDashboard } from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { SuspendedOverlay } from "@/components/account/SuspendedOverlay";
import { Loader2 } from "lucide-react";
import * as adminApi from "@/lib/admin-api";

function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const { data: roleData, isLoading: isLoadingRole } = useQuery({
    queryKey: ["role"],
    queryFn: adminApi.fetchRole,
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: accountStatus } = useQuery({
    queryKey: ["accountStatus"],
    queryFn: adminApi.fetchAccountStatus,
    enabled: isAuthenticated && roleData !== undefined && !roleData?.isAdmin,
    retry: false,
  });

  // Solo mostrar spinner mientras carga el estado de autenticación inicial
  // o mientras carga el rol (necesario para saber qué pantalla mostrar)
  if (isLoading || (isAuthenticated && isLoadingRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (roleData?.isAdmin) {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  const isSuspended = accountStatus?.account?.status === 'suspended';

  return (
    <AppProvider>
      {isSuspended && <SuspendedOverlay />}
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin">
          <Redirect to="/" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
