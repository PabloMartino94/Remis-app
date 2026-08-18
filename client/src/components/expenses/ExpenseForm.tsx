import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Fuel, Plus, X, Flame } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Expense } from "@/types";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { parseExpenseVoiceCommand } from "@/lib/voice-parser";
import { toast } from "sonner";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "El monto es requerido"),
  type: z.enum(["Nafta", "Gas", "Otro"]),
  note: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  editId?: string | null;
  onCancelEdit?: () => void;
}

export function ExpenseForm({ editId, onCancelEdit }: ExpenseFormProps) {
  const { addExpense, updateExpense, expenses, currentDate } = useApp();
  
  // Find expense if editing
  const editingExpense = editId ? expenses.find(e => e.id === editId) : null;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: "" as any,
      type: "Gas",
      note: "",
    },
  });

  useEffect(() => {
    if (editingExpense) {
      form.reset({
        amount: editingExpense.amount,
        type: editingExpense.type,
        note: editingExpense.note || "",
      });
    } else {
      form.reset({
        amount: "" as any,
        type: "Gas",
        note: "",
      });
    }
  }, [editingExpense, form]);

  const onSubmit = (data: ExpenseFormValues) => {
    if (editingExpense && editId) {
      updateExpense({
        ...editingExpense,
        ...data,
      });
      if (onCancelEdit) onCancelEdit();
    } else {
      addExpense({
        ...data,
        date: currentDate,
      });
      form.reset({
        amount: "" as any,
        type: "Gas",
        note: "",
      });
    }
  };

  const handleVoiceInput = useCallback((transcript: string) => {
    const parsed = parseExpenseVoiceCommand(transcript);
    
    const updates: Partial<ExpenseFormValues> = {};
    if (parsed.amount !== undefined) updates.amount = parsed.amount;
    if (parsed.type) updates.type = parsed.type;
    if (parsed.note) updates.note = parsed.note;

    if (Object.keys(updates).length > 0) {
      const current = form.getValues();
      form.reset({ ...current, ...updates });
      
      const fields = [];
      if (updates.amount) fields.push(`$${updates.amount}`);
      if (updates.type) fields.push(updates.type);
      
      toast.info(`Gasto: ${fields.join(', ')}`);
    } else {
      toast.warning('No pude entender el gasto. Intenta: "500 pesos de nafta" o "1000 gas"');
    }
  }, [form]);

  return (
    <Card className="card-shadow mb-4">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
          </CardTitle>
          {!editingExpense && (
            <VoiceInputButton onTranscript={handleVoiceInput} />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tipo de Gasto</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-0 space-y-0 flex-1">
                        <FormControl>
                          <RadioGroupItem value="Gas" id="type-gas" className="peer sr-only" />
                        </FormControl>
                        <label
                          htmlFor="type-gas"
                          className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-warning peer-data-[state=checked]:bg-warning/10 peer-data-[state=checked]:text-black cursor-pointer transition-all"
                        >
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Gas</span>
                        </label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-y-0 flex-1">
                        <FormControl>
                          <RadioGroupItem value="Nafta" id="type-nafta" className="peer sr-only" />
                        </FormControl>
                        <label
                          htmlFor="type-nafta"
                          className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/10 peer-data-[state=checked]:text-destructive cursor-pointer transition-all"
                        >
                          <Fuel className="h-4 w-4" />
                          <span className="font-medium">Nafta</span>
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Carga completa" className="text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="destructive" className="flex-1 font-bold">
                {editingExpense ? (
                  <>Guardar Cambios</>
                ) : (
                  <><Plus className="mr-2 h-4 w-4" /> Agregar Gasto</>
                )}
              </Button>
              
              {editingExpense && onCancelEdit && (
                <Button type="button" variant="outline" onClick={onCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
