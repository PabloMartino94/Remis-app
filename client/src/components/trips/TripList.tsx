import { useState } from "react";
import { Edit2, Trash2, MapPin, Clock, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TripForm } from "./TripForm";

export function TripList() {
  const { trips, currentDate, deleteTrip, isDayClosed } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const isClosed = isDayClosed(currentDate);
  const dayTrips = trips.filter(t => t.date === currentDate).reverse(); // Newest first

  if (isClosed && dayTrips.length === 0) {
     return (
        <Card className="card-shadow bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Lock className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Turno cerrado. No hay viajes.</p>
          </CardContent>
        </Card>
     )
  }

  if (dayTrips.length === 0 && !editingId) {
    return (
      <>
        {!editingId && !isClosed && <TripForm />}
        <Card className="card-shadow bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <CarIcon className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No hay viajes registrados hoy</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {!isClosed && (
        <TripForm 
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
              Viajes de Hoy ({dayTrips.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-3">
            {dayTrips.map((trip) => (
              <div 
                key={trip.id} 
                className={`relative overflow-hidden rounded-xl border bg-card p-4 transition-all shadow-sm ${
                  trip.type === 'CC' ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-success'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <Badge variant={trip.type === 'CC' ? 'default' : 'secondary'} className={trip.type === 'CC' ? 'bg-primary' : 'bg-success text-success-foreground'}>
                      {trip.type === 'CC' ? 'Cuenta Corriente' : 'Particular'}
                    </Badge>
                    {trip.wait > 0 && (
                      <Badge variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ${trip.wait} esp.
                      </Badge>
                    )}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    ${(trip.amount + trip.wait).toFixed(2)}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {(trip.origin || trip.destination) ? (
                    <div className="text-sm text-muted-foreground flex flex-col gap-1">
                      {trip.origin && (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          <span>{trip.origin}</span>
                        </div>
                      )}
                      {trip.destination && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary/70" />
                          <span>{trip.destination}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                     <span className="text-xs text-muted-foreground italic">Sin detalles de ruta</span>
                  )}
                </div>

                {!isClosed && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(trip.id);
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
                          <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTrip(trip.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

function CarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  )
}
