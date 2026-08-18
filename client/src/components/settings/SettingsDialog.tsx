import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings } = useApp();
  const [ownerCcPercent, setOwnerCcPercent] = useState(settings.ownerCcPercent * 100);
  const [driverPartPercent, setDriverPartPercent] = useState(settings.driverPartPercent * 100);
  const [expenseReimbPercent, setExpenseReimbPercent] = useState(settings.expenseReimbPercent * 100);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setOwnerCcPercent(settings.ownerCcPercent * 100);
    setDriverPartPercent(settings.driverPartPercent * 100);
    setExpenseReimbPercent(settings.expenseReimbPercent * 100);
  }, [settings, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        ownerCcPercent: ownerCcPercent / 100,
        driverPartPercent: driverPartPercent / 100,
        expenseReimbPercent: expenseReimbPercent / 100,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = 
    ownerCcPercent >= 0 && ownerCcPercent <= 100 &&
    driverPartPercent >= 0 && driverPartPercent <= 100 &&
    expenseReimbPercent >= 0 && expenseReimbPercent <= 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración de Porcentajes</DialogTitle>
          <DialogDescription>
            Ajustá los porcentajes para calcular las liquidaciones entre dueño y remisero.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ownerCc">
              Comisión del Dueño sobre viajes CC (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="ownerCc"
                type="number"
                min="0"
                max="100"
                step="1"
                value={ownerCcPercent}
                onChange={(e) => setOwnerCcPercent(Number(e.target.value))}
                className="w-24"
                data-testid="input-owner-cc-percent"
              />
              <span className="text-sm text-muted-foreground">
                El dueño recibe este % de los viajes Cuenta Corriente
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverPart">
              Comisión del Dueño sobre viajes Particulares (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="driverPart"
                type="number"
                min="0"
                max="100"
                step="1"
                value={driverPartPercent}
                onChange={(e) => setDriverPartPercent(Number(e.target.value))}
                className="w-24"
                data-testid="input-driver-part-percent"
              />
              <span className="text-sm text-muted-foreground">
                El dueño recibe este % de los viajes Particulares
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseReimb">
              Reembolso de Gastos (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="expenseReimb"
                type="number"
                min="0"
                max="100"
                step="1"
                value={expenseReimbPercent}
                onChange={(e) => setExpenseReimbPercent(Number(e.target.value))}
                className="w-24"
                data-testid="input-expense-reimb-percent"
              />
              <span className="text-sm text-muted-foreground">
                El dueño reembolsa este % de los gastos
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-settings">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isValid} data-testid="button-save-settings">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
