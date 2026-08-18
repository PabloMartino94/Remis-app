import { useState } from "react";
import { Edit2, Trash2, Fuel, Flame, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ExpenseForm } from "./ExpenseForm";

export function ExpenseList() {
  const { expenses, currentDate, deleteExpense, isDayClosed } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);

  const isClosed = isDayClosed(currentDate);
  const dayExpenses = expenses.filter(e => e.date === currentDate).reverse();

  if (isClosed && dayExpenses.length === 0) {
    return (
       <Card className="card-shadow bg-muted/30 border-dashed">
         <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
           <Lock className="h-12 w-12 mb-3 opacity-20" />
           <p className="text-sm font-medium">Turno cerrado. No hay gastos.</p>
         </CardContent>
       </Card>
    )
 }

  if (dayExpenses.length === 0 && !editingId) {
    return (
      <>
        {!editingId && !isClosed && <ExpenseForm />}
        <Card className="card-shadow bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Fuel className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No hay gastos registrados hoy</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {!isClosed && (
        <ExpenseForm 
          editId={editingId} 
          onCancelEdit={() => setEditingId(null)} 
        />
      )}
      
      {isClosed && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-center gap-2 text-primary font-medium mb-4">
          <Lock className="h-4 w-4" />
          <span>Turno cerrado. Solo lectura.</span>
        </div>
      )}

      {!editingId && (
        <Card className="card-shadow border-none bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground/80">
              Gastos de Hoy ({dayExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-3">
            {dayExpenses.map((expense) => (
              <div 
                key={expense.id} 
                className="relative overflow-hidden rounded-xl border border-l-4 border-l-destructive bg-card p-4 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={`
                    ${expense.type === 'Gas' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-destructive text-destructive bg-destructive/10'}
                  `}>
                    {expense.type === 'Gas' ? <Flame className="h-3 w-3 mr-1" /> : <Fuel className="h-3 w-3 mr-1" />}
                    {expense.type}
                  </Badge>
                  <div className="text-xl font-bold text-destructive">
                    -${expense.amount.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {expense.note ? (
                    <div className="text-sm text-muted-foreground">
                      {expense.note}
                    </div>
                  ) : (
                     <span className="text-xs text-muted-foreground italic">Sin notas</span>
                  )}
                </div>

                {!isClosed && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(expense.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Borrar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteExpense(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
