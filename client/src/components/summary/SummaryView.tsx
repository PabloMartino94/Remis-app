import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Coins, Wallet, HandCoins, Info, Lock, Unlock, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export function SummaryView() {
  const { getDaySummary, currentDate, isDayClosed, closeDay, openDay, settings } = useApp();
  const summary = getDaySummary(currentDate);
  const isClosed = isDayClosed(currentDate);

  const isPositiveBalance = summary.balance >= 0;

  const ownerCcPct = Math.round(settings.ownerCcPercent * 100);
  const driverPartPct = Math.round(settings.driverPartPercent * 100);
  const expenseReimbPct = Math.round(settings.expenseReimbPercent * 100);
  const driverCcPct = 100 - ownerCcPct;
  const driverPartPctEarning = 100 - driverPartPct;

  const handleCloseShift = () => {
    closeDay(currentDate);
    toast({
      title: "Turno Cerrado",
      description: "El turno ha sido consolidado correctamente.",
      variant: "default",
    });
  };

  const handleOpenShift = () => {
    openDay(currentDate);
    toast({
      title: "Turno Reabierto",
      description: "Ahora puedes volver a editar los movimientos.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6 pb-24">
      
      {isClosed && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-center gap-2 text-primary font-medium">
          <Lock className="h-4 w-4" />
          <span>Este turno está cerrado y consolidado</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-success/10 border-success/20 shadow-none">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-success" data-testid="text-total-income">${summary.totalIncome.toFixed(2)}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">Total Ingresos</span>
            <span className="text-[10px] text-muted-foreground/70">{summary.tripCount} viajes</span>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/20 shadow-none">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-destructive" data-testid="text-total-expenses">${summary.totalExpenses.toFixed(2)}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">Total Gastos</span>
            <span className="text-[10px] text-muted-foreground/70">{summary.expenseCount} gastos</span>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(
        "border-2 shadow-sm transition-colors",
        isPositiveBalance ? "bg-success/5 border-success" : "bg-destructive/5 border-destructive"
      )}>
        <CardContent className="p-6 text-center">
          <div className="text-lg font-semibold mb-2">
            {isPositiveBalance ? "El Dueño te debe pagar:" : "Debes pagar al Dueño:"}
          </div>
          <div className={cn(
            "text-4xl font-black mb-2",
            isPositiveBalance ? "text-success-700" : "text-destructive-700"
          )} data-testid="text-balance">
            ${Math.abs(summary.balance).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            {isPositiveBalance 
              ? "Saldo a favor del remisero" 
              : "Saldo a favor de la agencia"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" /> Desglose de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          
          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-2 border-b border-blue-100 pb-1">
              Lo que el DUEÑO debe pagar:
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{ownerCcPct}% Viajes C.C.:</span>
              <span data-testid="text-owner-cc-trips">${(summary.incomeCC * settings.ownerCcPercent).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{ownerCcPct}% Esperas C.C.:</span>
              <span data-testid="text-owner-cc-wait">${(summary.waitCC * settings.ownerCcPercent).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{expenseReimbPct}% Gastos (Reintegro):</span>
              <span data-testid="text-owner-expenses">${(summary.totalExpenses * settings.expenseReimbPercent).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-blue-700 pt-2 border-t border-blue-100 mt-2">
              <span>Total Dueño debe:</span>
              <span data-testid="text-owner-owes">${summary.ownerOwes.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-orange-700 dark:text-orange-300 text-sm mb-2 border-b border-orange-100 pb-1">
              Lo que el REMISERO debe pagar:
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{driverPartPct}% Viajes Part.:</span>
              <span data-testid="text-driver-part-trips">${(summary.incomePart * settings.driverPartPercent).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{driverPartPct}% Esperas Part.:</span>
              <span data-testid="text-driver-part-wait">${(summary.waitPart * settings.driverPartPercent).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-orange-700 pt-2 border-t border-orange-100 mt-2">
              <span>Total Remisero debe:</span>
              <span data-testid="text-driver-owes">${summary.driverOwes.toFixed(2)}</span>
            </div>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
            <Coins className="h-4 w-4" /> Ganancia del Remisero
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{driverPartPctEarning}% Total Particulares:</span>
              <span className="font-medium text-success" data-testid="text-driver-part-earning">${((summary.incomePart + summary.waitPart) * (1 - settings.driverPartPercent)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{ownerCcPct}% Total Cta. Cte.:</span>
              <span className="font-medium text-success" data-testid="text-driver-cc-earning">${((summary.incomeCC + summary.waitCC) * settings.ownerCcPercent).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary pt-2 border-t border-border mt-2 text-lg">
              <span>Ganancia Total:</span>
              <span data-testid="text-driver-total-earning">
                ${(
                  ((summary.incomePart + summary.waitPart) * (1 - settings.driverPartPercent)) +
                  ((summary.incomeCC + summary.waitCC) * settings.ownerCcPercent)
                ).toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-right text-muted-foreground mt-1">
              ({driverPartPctEarning}% de Particulares + {ownerCcPct}% de C.C.)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Flujo de Efectivo (Bolsillo)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
             <div className="flex items-center justify-between p-2 bg-success/5 rounded border border-success/10">
               <div className="flex items-center gap-2">
                 <HandCoins className="h-4 w-4 text-success" />
                 <span className="text-sm">Cobrado en mano (Part.)</span>
               </div>
               <span className="font-bold text-success" data-testid="text-cash-in-hand">${summary.cashInHand.toFixed(2)}</span>
             </div>

             <div className="flex items-center justify-between p-2 bg-destructive/5 rounded border border-destructive/10">
               <div className="flex items-center gap-2">
                 <Wallet className="h-4 w-4 text-destructive" />
                 <span className="text-sm">Pagado en gastos</span>
               </div>
               <span className="font-bold text-destructive" data-testid="text-cash-expenses">-${summary.cashExpenses.toFixed(2)}</span>
             </div>

             <div className="flex items-center justify-between p-3 bg-muted rounded border border-border mt-2">
               <span className="font-bold text-sm">Efectivo final en bolsillo:</span>
               <span className="font-bold text-lg" data-testid="text-pocket-balance">${summary.pocketBalance.toFixed(2)}</span>
             </div>
             <p className="text-[10px] text-center text-muted-foreground">
               Esto es lo que te queda físicamente en la billetera hoy antes de arreglar cuentas.
             </p>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-2 border-dashed shadow-sm", isClosed ? "border-primary/20 bg-primary/5" : "border-muted-foreground/20")}>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center space-y-4">
          {isClosed ? (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Turno Consolidado</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                  Los movimientos de este día están guardados y bloqueados.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2 border-primary/20 hover:bg-primary/5 text-primary" data-testid="button-reopen-shift">
                    <Unlock className="mr-2 h-4 w-4" /> Reabrir Turno
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Reabrir este turno?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto te permitirá agregar o editar movimientos nuevamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleOpenShift}>Reabrir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
               <h3 className="font-semibold text-foreground">¿Listo para consolidar el turno?</h3>
               <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                 Se guardarán todos los movimientos de este día como un turno <strong>consolidado</strong> y se bloqueará la edición.
               </p>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full max-w-xs bg-success hover:bg-success/90 text-success-foreground font-bold" data-testid="button-close-shift">
                    <FileCheck className="mr-2 h-4 w-4" /> Cerrar/Consolidar Turno
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cerrar el turno de hoy?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Al cerrar el turno, se bloqueará la edición de viajes y gastos para asegurar la integridad del cierre de caja. Podrás reabrirlo si es necesario.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCloseShift} className="bg-success hover:bg-success/90">Confirmar Cierre</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
