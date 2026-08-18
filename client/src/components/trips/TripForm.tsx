import { useEffect, useCallback, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Car, FileText, User, Plus, X, MapPin, Loader2, Navigation } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trip } from "@/types";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { parseTripVoiceCommand } from "@/lib/voice-parser";
import { toast } from "sonner";
import { useCurrentPosition } from "@/hooks/use-current-position";
import { calculateHaversineDistance, formatDistance } from "@/lib/distance";

const tripSchema = z.object({
  amount: z.coerce.number().min(0.01, "El monto es requerido"),
  wait: z.coerce.number().min(0, "Monto inválido").default(0),
  type: z.enum(["CC", "Particular"]),
  origin: z.string().optional(),
  destination: z.string().optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
});

type TripFormValues = z.infer<typeof tripSchema>;

interface TripFormProps {
  editId?: string | null;
  onCancelEdit?: () => void;
}

export function TripForm({ editId, onCancelEdit }: TripFormProps) {
  const { addTrip, updateTrip, trips, currentDate } = useApp();
  const { getPosition, isLoading: isGettingPosition, error: positionError } = useCurrentPosition();
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDestination, setLoadingDestination] = useState(false);
  
  // Find trip if editing
  const editingTrip = editId ? trips.find(t => t.id === editId) : null;

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      amount: "" as any,
      wait: "" as any,
      type: "Particular",
      origin: "",
      destination: "",
      originLat: undefined,
      originLng: undefined,
      destinationLat: undefined,
      destinationLng: undefined,
    },
  });

  const watchedValues = useWatch({ control: form.control });
  
  const distance = useMemo(() => {
    const { originLat, originLng, destinationLat, destinationLng } = watchedValues;
    if (originLat && originLng && destinationLat && destinationLng) {
      return calculateHaversineDistance(originLat, originLng, destinationLat, destinationLng);
    }
    return null;
  }, [watchedValues.originLat, watchedValues.originLng, watchedValues.destinationLat, watchedValues.destinationLng]);

  const fetchLocationAddress = useCallback(async (field: 'origin' | 'destination') => {
    const isOrigin = field === 'origin';
    isOrigin ? setLoadingOrigin(true) : setLoadingDestination(true);
    
    try {
      const pos = await getPosition();
      if (!pos) {
        toast.error('No se pudo obtener la ubicación. Verificá los permisos de ubicación.');
        return;
      }

      const response = await fetch(`/api/geocode/reverse?lat=${pos.latitude}&lng=${pos.longitude}`);
      
      if (!response.ok) {
        if (isOrigin) {
          form.setValue('origin', `${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`);
          form.setValue('originLat', pos.latitude);
          form.setValue('originLng', pos.longitude);
        } else {
          form.setValue('destination', `${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`);
          form.setValue('destinationLat', pos.latitude);
          form.setValue('destinationLng', pos.longitude);
        }
        toast.info('Ubicación cargada (coordenadas)');
        return;
      }
      
      const data = await response.json();
      
      if (isOrigin) {
        form.setValue('origin', data.address);
        form.setValue('originLat', pos.latitude);
        form.setValue('originLng', pos.longitude);
      } else {
        form.setValue('destination', data.address);
        form.setValue('destinationLat', pos.latitude);
        form.setValue('destinationLng', pos.longitude);
      }
      
      const shortAddress = data.address.length > 40 ? `${data.address.substring(0, 40)}...` : data.address;
      toast.success(`Ubicación: ${shortAddress}`);
    } catch (error) {
      toast.error('Error al obtener la dirección');
    } finally {
      isOrigin ? setLoadingOrigin(false) : setLoadingDestination(false);
    }
  }, [getPosition, form]);

  useEffect(() => {
    if (editingTrip) {
      form.reset({
        amount: editingTrip.amount,
        wait: editingTrip.wait,
        type: editingTrip.type,
        origin: editingTrip.origin || "",
        destination: editingTrip.destination || "",
        originLat: undefined,
        originLng: undefined,
        destinationLat: undefined,
        destinationLng: undefined,
      });
    } else {
      form.reset({
        amount: "" as any,
        wait: "" as any,
        type: "Particular",
        origin: "",
        destination: "",
        originLat: undefined,
        originLng: undefined,
        destinationLat: undefined,
        destinationLng: undefined,
      });
    }
  }, [editingTrip, form]);

  const onSubmit = (data: TripFormValues) => {
    if (editingTrip && editId) {
      updateTrip({
        ...editingTrip,
        ...data,
      });
      if (onCancelEdit) onCancelEdit();
    } else {
      addTrip({
        ...data,
        date: currentDate,
      });
      form.reset({
        amount: "" as any,
        wait: "" as any,
        type: "Particular",
        origin: "",
        destination: "",
        originLat: undefined,
        originLng: undefined,
        destinationLat: undefined,
        destinationLng: undefined,
      });
    }
  };

  const handleVoiceInput = useCallback((transcript: string) => {
    const parsed = parseTripVoiceCommand(transcript);
    
    const updates: Partial<TripFormValues> = {};
    if (parsed.amount !== undefined) updates.amount = parsed.amount;
    if (parsed.wait !== undefined) updates.wait = parsed.wait;
    if (parsed.type) updates.type = parsed.type;
    if (parsed.origin) updates.origin = parsed.origin;
    if (parsed.destination) updates.destination = parsed.destination;

    if (Object.keys(updates).length > 0) {
      const current = form.getValues();
      form.reset({ ...current, ...updates });
      
      const fields = [];
      if (updates.amount) fields.push(`$${updates.amount}`);
      if (updates.type) fields.push(updates.type);
      if (updates.origin || updates.destination) fields.push(`${updates.origin || ''} → ${updates.destination || ''}`);
      
      toast.info(`Viaje: ${fields.join(', ')}`);
    } else {
      toast.warning('No pude entender el viaje. Intenta: "500 pesos particular desde centro hasta barrio"');
    }
  }, [form]);

  return (
    <Card className="card-shadow mb-4">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <Car className="h-5 w-5" />
            {editingTrip ? "Editar Viaje" : "Nuevo Viaje"}
          </CardTitle>
          {!editingTrip && (
            <VoiceInputButton onTranscript={handleVoiceInput} />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
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
                name="wait"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espera ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tipo de Viaje</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-0 space-y-0 flex-1">
                        <FormControl>
                          <RadioGroupItem value="Particular" id="type-part" className="peer sr-only" />
                        </FormControl>
                        <label
                          htmlFor="type-part"
                          className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-success peer-data-[state=checked]:bg-success/10 peer-data-[state=checked]:text-black cursor-pointer transition-all"
                        >
                          <User className="h-4 w-4" />
                          <span className="font-medium">Particular</span>
                        </label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-y-0 flex-1">
                        <FormControl>
                          <RadioGroupItem value="CC" id="type-cc" className="peer sr-only" />
                        </FormControl>
                        <label
                          htmlFor="type-cc"
                          className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Cta. Cte.</span>
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Origen (Opcional)" className="text-sm flex-1" {...field} />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fetchLocationAddress('origin')}
                          disabled={loadingOrigin}
                          data-testid="button-location-origin"
                          title="Usar ubicación actual"
                        >
                          {loadingOrigin ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Destino (Opcional)" className="text-sm flex-1" {...field} />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fetchLocationAddress('destination')}
                          disabled={loadingDestination}
                          data-testid="button-location-destination"
                          title="Usar ubicación actual"
                        >
                          {loadingDestination ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {distance !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2" data-testid="text-distance">
                  <Navigation className="h-4 w-4" />
                  <span>Distancia: <strong className="text-foreground">{formatDistance(distance)}</strong></span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 font-bold">
                {editingTrip ? (
                  <>Guardar Cambios</>
                ) : (
                  <><Plus className="mr-2 h-4 w-4" /> Agregar Viaje</>
                )}
              </Button>
              
              {editingTrip && onCancelEdit && (
                <Button type="button" variant="destructive" onClick={onCancelEdit}>
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
