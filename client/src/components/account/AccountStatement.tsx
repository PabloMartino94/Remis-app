import { useQuery } from "@tanstack/react-query";
import * as adminApi from "@/lib/admin-api";
import { BILLING_PERIOD_LABELS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle } from "lucide-react";

type BillingPeriod = keyof typeof BILLING_PERIOD_LABELS;

export function AccountStatement() {
  const { data, isLoading } = useQuery({
    queryKey: ["accountStatus"],
    queryFn: adminApi.fetchAccountStatus,
  });

  if (isLoading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  if (!data) return null;

  const { billing, statements, totalOwed } = data;
  const pendingStatements = statements.filter(s => s.status === 'pending' || s.status === 'overdue');

  const hasDebt = totalOwed > 0;

  return (
    <Card className={hasDebt ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base font-semibold flex items-center gap-2 ${hasDebt ? 'text-amber-700' : 'text-green-700'}`}>
          <FileText className="h-4 w-4" /> Estado de Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <div key={stmt.id} className="flex items-center justify-between p-2 bg-white rounded border border-amber-100">
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
      </CardContent>
    </Card>
  );
}
