import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "@/lib/admin-api";
import { BILLING_PERIOD_LABELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Settings, FileText, Ban, CheckCircle, Plus, ArrowLeft, Trash2, DollarSign, Loader2, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format, addMonths } from "date-fns";

type BillingPeriod = keyof typeof BILLING_PERIOD_LABELS;

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.fetchAllUsers,
  });

  const { data: selectedUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["admin", "user", selectedUserId],
    queryFn: () => adminApi.fetchUserDetails(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const { data: statements = [] } = useQuery({
    queryKey: ["admin", "statements", selectedUserId],
    queryFn: () => adminApi.fetchUserStatements(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin", "payments", selectedUserId],
    queryFn: () => adminApi.fetchUserPayments(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => 
      adminApi.suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Usuario suspendido");
    },
  });

  const activateMutation = useMutation({
    mutationFn: adminApi.activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Usuario activado");
    },
  });

  const updateBillingMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      adminApi.updateBillingSettings(userId, data),
    onSuccess: () => {
      setShowBillingDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Configuración guardada");
    },
  });

  const createStatementMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      adminApi.createStatement(userId, data),
    onSuccess: () => {
      setShowStatementDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "statements", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Cobro creado");
    },
  });

  const updateStatementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      adminApi.updateStatement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "statements", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Estado actualizado");
    },
  });

  const deleteStatementMutation = useMutation({
    mutationFn: adminApi.deleteStatement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "statements", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Cobro eliminado");
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      adminApi.createPayment(userId, data),
    onSuccess: () => {
      setShowPaymentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "payments", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user", selectedUserId] });
      toast.success("Pago registrado");
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: adminApi.deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user", selectedUserId] });
      toast.success("Pago eliminado");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      handleBackToList();
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Usuario eliminado. Cuando vuelva a iniciar sesión se enviará el aviso de nuevo registro.");
    },
  });

  const handleBackToList = () => {
    setShowBillingDialog(false);
    setShowStatementDialog(false);
    setShowPaymentDialog(false);
    setSelectedUserId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header siempre visible */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Panel de Administración
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 hover:text-red-700 hover:bg-red-50" data-testid="button-admin-logout">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </div>
            {user?.email && (
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            )}
          </CardHeader>
        </Card>

        {!selectedUserId ? (
          <>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <Card 
                    key={u.user.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => setSelectedUserId(u.user.id)}
                    data-testid={`card-user-${u.user.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{u.user.firstName || 'Sin nombre'} {u.user.lastName || ''}</p>
                          <p className="text-sm text-muted-foreground">{u.user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${u.account?.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {u.account?.status === 'suspended' ? 'Suspendido' : 'Activo'}
                          </span>
                          {u.totalOwed > 0 && (
                            <p className="text-sm font-medium text-red-600">Debe: ${u.totalOwed.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : isLoadingUser || !selectedUser ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleBackToList} data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedUser.user.firstName || selectedUser.user.email}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedUser.user.email}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${selectedUser.account?.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedUser.account?.status === 'suspended' ? 'Suspendido' : 'Activo'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Deuda Total</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-user-owed">${selectedUser.totalOwed.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Período de Facturación</p>
                    <p className="text-lg font-semibold">
                      {BILLING_PERIOD_LABELS[(selectedUser.billing?.billingPeriod || 'monthly') as BillingPeriod]}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selectedUser.account?.status === 'suspended' ? (
                    <Button onClick={() => activateMutation.mutate(selectedUserId)} data-testid="button-activate">
                      <CheckCircle className="mr-2 h-4 w-4" /> Activar Cuenta
                    </Button>
                  ) : (
                    <Button onClick={() => suspendMutation.mutate({ userId: selectedUserId, reason: "Falta de pago" })} variant="destructive" data-testid="button-suspend">
                      <Ban className="mr-2 h-4 w-4" /> Suspender por Falta de Pago
                    </Button>
                  )}
                  <Button onClick={() => setShowBillingDialog(true)} variant="outline" data-testid="button-billing">
                    <Settings className="mr-2 h-4 w-4" /> Configurar Facturación
                  </Button>
                  <Button onClick={() => setShowStatementDialog(true)} variant="outline" data-testid="button-statement">
                    <Plus className="mr-2 h-4 w-4" /> Cargar Cobro
                  </Button>
                  <Button onClick={() => setShowPaymentDialog(true)} variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200" data-testid="button-payment">
                    <DollarSign className="mr-2 h-4 w-4" /> Registrar Pago
                  </Button>
                  <Button 
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar a ${selectedUser.user.firstName || selectedUser.user.email}? Sus datos (viajes, gastos) se mantendrán. Cuando vuelva a iniciar sesión, se enviará el aviso de nuevo registro.`)) {
                        deleteUserMutation.mutate(selectedUserId);
                      }
                    }} 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                    data-testid="button-delete-user"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Usuario
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Estados de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay cobros registrados</p>
                ) : (
                  <div className="space-y-2">
                    {statements.map((stmt) => (
                      <div key={stmt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`row-statement-${stmt.id}`}>
                        <div>
                          <p className="font-medium">${stmt.totalDue.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {stmt.periodStart} - {stmt.periodEnd} | {BILLING_PERIOD_LABELS[stmt.billingPeriod as BillingPeriod]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${stmt.status === 'paid' ? 'bg-green-100 text-green-700' : stmt.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {stmt.status === 'paid' ? 'Pagado' : stmt.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => deleteStatementMutation.mutate(stmt.id)} data-testid={`button-delete-${stmt.id}`}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" /> Pagos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay pagos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((pmt) => (
                      <div key={pmt.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg" data-testid={`row-payment-${pmt.id}`}>
                        <div>
                          <p className="font-medium text-green-700">${pmt.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {pmt.paymentDate} {pmt.paymentMethod && `| ${pmt.paymentMethod}`}
                          </p>
                          {pmt.notes && <p className="text-xs text-gray-500">{pmt.notes}</p>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deletePaymentMutation.mutate(pmt.id)} data-testid={`button-delete-payment-${pmt.id}`}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showBillingDialog && (
              <SimpleModal title="Configuración de Facturación" onClose={() => setShowBillingDialog(false)}>
                <BillingForm 
                  billing={selectedUser.billing}
                  onSave={(data) => updateBillingMutation.mutate({ userId: selectedUserId, data })}
                  onCancel={() => setShowBillingDialog(false)}
                  isLoading={updateBillingMutation.isPending}
                />
              </SimpleModal>
            )}

            {showStatementDialog && (
              <SimpleModal title="Cargar Cobro" onClose={() => setShowStatementDialog(false)}>
                <StatementForm
                  billing={selectedUser.billing}
                  onSave={(data) => createStatementMutation.mutate({ userId: selectedUserId, data })}
                  onCancel={() => setShowStatementDialog(false)}
                  isLoading={createStatementMutation.isPending}
                />
              </SimpleModal>
            )}

            {showPaymentDialog && (
              <SimpleModal title="Registrar Pago" onClose={() => setShowPaymentDialog(false)}>
                <PaymentForm
                  currentBalance={selectedUser.totalOwed}
                  onSave={(data) => createPaymentMutation.mutate({ userId: selectedUserId, data })}
                  onCancel={() => setShowPaymentDialog(false)}
                  isLoading={createPaymentMutation.isPending}
                />
              </SimpleModal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BillingForm({ billing, onSave, onCancel, isLoading }: { 
  billing: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [period, setPeriod] = useState(billing?.billingPeriod || 'monthly');
  const [amount, setAmount] = useState(billing?.baseAmount || 0);
  const [discount, setDiscount] = useState(billing?.discountPercent || 0);

  return (
    <div className="space-y-4">
      <div>
        <Label>Período de Facturación</Label>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
          data-testid="select-period"
        >
          {Object.entries(BILLING_PERIOD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Monto Base ($)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min="0" step="0.01" data-testid="input-amount" />
      </div>
      <div>
        <Label>Descuento (%)</Label>
        <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min="0" max="100" data-testid="input-discount" />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button onClick={() => onSave({ billingPeriod: period, baseAmount: amount, discountPercent: discount })} disabled={isLoading} data-testid="button-save-billing">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}

function StatementForm({ billing, onSave, onCancel, isLoading }: { 
  billing: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState(billing?.baseAmount || 0);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [notes, setNotes] = useState('');

  const totalDue = amount - discountAmt;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Fecha Inicio</Label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} data-testid="input-start" />
        </div>
        <div>
          <Label>Fecha Fin</Label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} data-testid="input-end" />
        </div>
      </div>
      <div>
        <Label>Monto ($)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min="0" step="0.01" data-testid="input-stmt-amount" />
      </div>
      <div>
        <Label>Descuento ($)</Label>
        <Input type="number" value={discountAmt} onChange={(e) => setDiscountAmt(Number(e.target.value))} min="0" step="0.01" data-testid="input-stmt-discount" />
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Total a Cobrar</p>
        <p className="text-xl font-bold" data-testid="text-total-due">${totalDue.toFixed(2)}</p>
      </div>
      <div>
        <Label>Notas (opcional)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-notes" />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button onClick={() => onSave({ 
          periodStart, 
          periodEnd, 
          billingPeriod: billing?.billingPeriod || 'monthly',
          amount, 
          discountAmount: discountAmt, 
          totalDue,
          notes: notes || undefined
        })} disabled={isLoading} data-testid="button-save-statement">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear Cobro'}
        </Button>
      </div>
    </div>
  );
}

function PaymentForm({ currentBalance, onSave, onCancel, isLoading }: { 
  currentBalance: number;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [amount, setAmount] = useState(currentBalance > 0 ? currentBalance : 0);
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const newBalance = currentBalance - amount;

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Saldo Actual</p>
        <p className={`text-xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${currentBalance.toFixed(2)}
        </p>
      </div>
      <div>
        <Label>Monto del Pago ($)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min="0" step="0.01" data-testid="input-payment-amount" />
      </div>
      <div>
        <Label>Fecha de Pago</Label>
        <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} data-testid="input-payment-date" />
      </div>
      <div>
        <Label>Método de Pago (opcional)</Label>
        <select 
          value={paymentMethod} 
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
          data-testid="select-payment-method"
        >
          <option value="">Sin especificar</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div>
        <Label>Notas (opcional)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Pago parcial" data-testid="input-payment-notes" />
      </div>
      <div className={`p-3 rounded-lg ${newBalance > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
        <p className="text-sm text-gray-600">Nuevo Saldo</p>
        <p className={`text-xl font-bold ${newBalance > 0 ? 'text-yellow-700' : 'text-green-700'}`} data-testid="text-new-balance">
          ${newBalance.toFixed(2)}
          {newBalance < 0 && <span className="text-sm font-normal ml-2">(Saldo a favor)</span>}
        </p>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button 
          onClick={() => onSave({ 
            amount, 
            paymentDate,
            paymentMethod: paymentMethod || undefined,
            notes: notes || undefined
          })} 
          disabled={isLoading || amount <= 0} 
          className="bg-green-600 hover:bg-green-700"
          data-testid="button-save-payment"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar Pago'}
        </Button>
      </div>
    </div>
  );
}
