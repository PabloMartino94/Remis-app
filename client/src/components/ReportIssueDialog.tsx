import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BugIcon, LightbulbIcon, MessageSquareIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface ReportData {
  type: string;
  message: string;
}

export function ReportIssueDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async (data: ReportData) => {
      // Usamos el fetch con credentials "include" para enviar la cookie
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error("Failed to send report");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Gracias por tu reporte!",
        description: "Hemos recibido tu mensaje correctamente.",
      });
      setOpen(false);
      setMessage("");
      setType("bug");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el reporte. Intentá nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Mensaje vacío",
        description: "Por favor, describí el problema o mejora.",
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate({ type, message });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <BugIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Reportar Problema</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reportar problema o mejora</DialogTitle>
          <DialogDescription>
            Contanos qué falló o qué te gustaría que agreguemos a la aplicación.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de reporte</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Seleccioná un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <div className="flex items-center gap-2">
                    <BugIcon className="w-4 h-4 text-red-500" />
                    <span>Fallo / Error (Bug)</span>
                  </div>
                </SelectItem>
                <SelectItem value="feature">
                  <div className="flex items-center gap-2">
                    <LightbulbIcon className="w-4 h-4 text-yellow-500" />
                    <span>Sugerencia / Mejora</span>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <MessageSquareIcon className="w-4 h-4 text-blue-500" />
                    <span>Otro comentario</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Descripción</Label>
            <Textarea
              id="message"
              placeholder="Describí el problema con la mayor cantidad de detalles posible..."
              className="min-h-[120px] resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={reportMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={reportMutation.isPending}>
              {reportMutation.isPending ? "Enviando..." : "Enviar reporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
