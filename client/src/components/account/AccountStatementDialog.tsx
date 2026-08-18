import { useQuery } from "@tanstack/react-query";
import * as adminApi from "@/lib/admin-api";
import { BILLING_PERIOD_LABELS } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BillingPeriod = keyof typeof BILLING_PERIOD_LABELS;

interface AccountStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountStatementDialog({ open, onOpenChange }: AccountStatementDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["accountStatus"],
    queryFn: adminApi.fetchAccountStatus,
    enabled: open,
  });

  const billing = data?.billing;
  const statements = data?.statements || [];
  const totalOwed = data?.totalOwed || 0;
  const pendingStatements = statements.filter(s => s.status === 'pending' || s.status === 'overdue');
  const hasDebt = totalOwed > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estado de Cuenta
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`${hasDebt ? 'bg-amber-100 border-amber-200' : 'bg-green-100 border-green-200'} border rounded-lg p-4 text-center`}>
              <p className={`text-sm ${hasDebt ? 'text-amber-700' : 'text-green-700'} mb-1`}>
                {hasDebt ? 'Saldo Pendiente' : 'Saldo'}
              </p>
              <p className={`text-3xl font-bold ${hasDebt ? 'text-amber-800' : 'text-green-800'}`} data-testid="text-total-owed">
                ${totalOwed.toFixed(2)}
              </p>
              {billing && (
                <p className={`text-xs ${hasDebt ? 'text-amber-600' : 'text-green-600'} mt-1`}>
                  Plan: {BILLING_PERIOD_LABELS[(billing.billingPeriod || 'monthly') as BillingPeriod]}
                </p>
              )}
              {!hasDebt && (
                <p className="text-xs text-green-600 mt-2">Tu cuenta está al día</p>
              )}
            </div>

            {pendingStatements.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-700">Cobros Pendientes:</p>
                {pendingStatements.map((stmt) => (
                  <div key={stmt.id} className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-100">
                    <div>
                      <p className="text-sm font-medium">${stmt.totalDue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {stmt.periodStart} - {stmt.periodEnd}
                      </p>
                    </div>
                    <Badge variant={stmt.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {stmt.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
