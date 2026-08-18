import { useQuery } from "@tanstack/react-query";
import * as adminApi from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";

export function SuspendedOverlay() {
  const { data } = useQuery({
    queryKey: ["accountStatus"],
    queryFn: adminApi.fetchAccountStatus,
  });

  if (!data || data.account.status !== 'suspended') {
    return null;
  }

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" data-testid="status-suspended">
      <div className="bg-white rounded-xl max-w-md w-full p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900">
          Cuenta Suspendida
        </h2>
        
        <p className="text-gray-600">
          Tu cuenta ha sido suspendida por falta de pago. Para reactivarla, por favor regulariza tu situación contactando al administrador.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 mb-1">Saldo de Cuenta</p>
          <p className="text-3xl font-bold text-red-800" data-testid="text-suspended-balance">
            ${data.totalOwed.toFixed(2)}
          </p>
        </div>

        <div className="pt-4">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
