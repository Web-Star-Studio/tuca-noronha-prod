"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AdminReservationData } from "../AdminReservationCreationForm";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { CalendarIcon } from "lucide-react";

interface ReservationDetailsStepProps {
  data: Partial<AdminReservationData>;
  onComplete: (data: Partial<AdminReservationData>) => void;
}

const baseSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  customerEmail: z.string().email("Email inválido."),
  customerPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos."),
  customerDocument: z.string().optional(),
  specialRequests: z.string().optional(),
});

const getAssetSpecificSchema = (assetType: string) => {
  switch (assetType) {
    case "activities":
      return baseSchema.extend({
        date: z.date({ required_error: "Data é obrigatória." }),
        time: z.string().min(1, "Horário é obrigatório."),
        participants: z.coerce.number().min(1, "É necessário pelo menos 1 participante."),
      });
    case "events":
      return baseSchema.extend({
        date: z.date({ required_error: "Data é obrigatória." }),
        tickets: z.coerce.number().min(1, "É necessário pelo menos 1 ingresso."),
        ticketType: z.string().min(1, "Tipo de ingresso é obrigatório."),
      });
    case "restaurants":
      return baseSchema.extend({
        date: z.date({ required_error: "Data é obrigatória." }),
        time: z.string().min(1, "Horário é obrigatório."),
        guests: z.coerce.number().min(1, "É necessário pelo menos 1 convidado."),
        tablePreference: z.string().optional(),
      });
    case "vehicles":
      return baseSchema.extend({
        startDate: z.date({ required_error: "Data de início é obrigatória." }),
        endDate: z.date({ required_error: "Data de fim é obrigatória." }),
        pickupLocation: z.string().min(1, "Local de retirada é obrigatório."),
        returnLocation: z.string().min(1, "Local de devolução é obrigatório."),
        driverAge: z.coerce.number().min(18, "Condutor deve ter no mínimo 18 anos."),
      });
    case "accommodations":
      return baseSchema.extend({
        checkIn: z.date({ required_error: "Data de check-in é obrigatória." }),
        checkOut: z.date({ required_error: "Data de check-out é obrigatória." }),
        guests: z.coerce.number().min(1, "É necessário pelo menos 1 hóspede."),
        rooms: z.coerce.number().min(1, "É necessário pelo menos 1 quarto."),
        roomType: z.string().optional(),
      });
    default:
      return baseSchema;
  }
};

export function ReservationDetailsStep({ data, onComplete }: ReservationDetailsStepProps) {
  const schema = getAssetSpecificSchema(data.assetType || "");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: data.reservationData?.customerName || data.travelerName || "",
      customerEmail: data.reservationData?.customerEmail || data.travelerEmail || "",
      customerPhone: data.reservationData?.customerPhone || "",
      customerDocument: data.reservationData?.customerDocument || "",
      specialRequests: data.reservationData?.specialRequests || "",
      // Asset specific fields
      date: data.reservationData?.date ? new Date(data.reservationData.date) : undefined,
      time: data.reservationData?.time || "",
      participants: data.reservationData?.participants || 1,
      tickets: data.reservationData?.tickets || 1,
      ticketType: data.reservationData?.ticketType || "",
      guests: data.reservationData?.guests || 1,
      tablePreference: data.reservationData?.tablePreference || "",
      startDate: data.reservationData?.startDate ? new Date(data.reservationData.startDate) : undefined,
      endDate: data.reservationData?.endDate ? new Date(data.reservationData.endDate) : undefined,
      pickupLocation: data.reservationData?.pickupLocation || "",
      returnLocation: data.reservationData?.returnLocation || "",
      driverAge: data.reservationData?.driverAge || 18,
      checkIn: data.reservationData?.checkIn ? new Date(data.reservationData.checkIn) : undefined,
      checkOut: data.reservationData?.checkOut ? new Date(data.reservationData.checkOut) : undefined,
      rooms: data.reservationData?.rooms || 1,
      roomType: data.reservationData?.roomType || "",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    onComplete({ reservationData: values as any });
  };

  const renderAssetSpecificFields = () => {
    const assetType = data.assetType;
    if (!assetType) return null;

    return (
      <div className="space-y-4 pt-6 mt-6 border-t">
        <h3 className="font-semibold text-lg">Detalhes Específicos do Serviço</h3>
        {assetType === "activities" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="date" render={({ field }) => <DateField field={field} label="Data" />} />
            <FormField control={form.control} name="time" render={({ field }) => <TimeField field={field} label="Horário" />} />
            <FormField control={form.control} name="participants" render={({ field }) => <NumberField field={field} label="Participantes" />} />
          </div>
        )}
        {assetType === "events" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => <DateField field={field} label="Data do Evento" />} />
                <FormField control={form.control} name="tickets" render={({ field }) => <NumberField field={field} label="Ingressos" />} />
                <FormField control={form.control} name="ticketType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Ingresso</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="pista">Pista</SelectItem><SelectItem value="vip">VIP</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        )}
        {assetType === "restaurants" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => <DateField field={field} label="Data" />} />
                <FormField control={form.control} name="time" render={({ field }) => <TimeField field={field} label="Horário" />} />
                <FormField control={form.control} name="guests" render={({ field }) => <NumberField field={field} label="Convidados" />} />
            </div>
        )}
        {assetType === "vehicles" && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => <DateField field={field} label="Data de Retirada" />} />
                    <FormField control={form.control} name="endDate" render={({ field }) => <DateField field={field} label="Data de Devolução" />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="pickupLocation" render={({ field }) => <TextField field={field} label="Local de Retirada" />} />
                    <FormField control={form.control} name="returnLocation" render={({ field }) => <TextField field={field} label="Local de Devolução" />} />
                </div>
                <FormField control={form.control} name="driverAge" render={({ field }) => <NumberField field={field} label="Idade do Condutor" />} />
            </div>
        )}
        {assetType === "accommodations" && (
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="checkIn" render={({ field }) => <DateField field={field} label="Check-in" />} />
                    <FormField control={form.control} name="checkOut" render={({ field }) => <DateField field={field} label="Check-out" />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="guests" render={({ field }) => <NumberField field={field} label="Hóspedes" />} />
                    <FormField control={form.control} name="rooms" render={({ field }) => <NumberField field={field} label="Quartos" />} />
                </div>
                <FormField control={form.control} name="roomType" render={({ field }) => <TextField field={field} label="Tipo de quarto" placeholder="Ex: Luxo com vista para o mar"/>} />
            </div>
        )}
      </div>
    );
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader><CardTitle>Informações do Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="customerName" render={({ field }) => <TextField field={field} label="Nome do Cliente" />} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerEmail" render={({ field }) => <TextField field={field} label="Email" type="email" />} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => <TextField field={field} label="Telefone" type="tel" />} />
                </div>
                <FormField control={form.control} name="customerDocument" render={({ field }) => <TextField field={field} label="Documento (Opcional)" />} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Detalhes da Reserva</CardTitle></CardHeader>
            <CardContent>
                {renderAssetSpecificFields()}
                <div className="pt-6 mt-6 border-t">
                    <FormField control={form.control} name="specialRequests" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pedidos Especiais (Opcional)</FormLabel>
                            <FormControl><Textarea placeholder="Ex: Alergia a frutos do mar, pedido de berço, etc." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end pt-6">
          <Button type="submit" size="lg" disabled={!form.formState.isValid}>
            Próximo
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Reusable field components
const TextField = ({ field, label, type = "text", placeholder }: any) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <FormControl><Input type={type} placeholder={placeholder || label} {...field} /></FormControl>
    <FormMessage />
  </FormItem>
);

const NumberField = ({ field, label }: any) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <FormControl>
      <Input
        type="number"
        {...field}
        value={isNaN(field.value) ? '' : field.value}
        onChange={e => {
          const val = e.target.value;
          // Coerce empty string to null or let Zod handle it, but avoid NaN
          field.onChange(val === '' ? null : parseFloat(val));
        }}
      />
    </FormControl>
    <FormMessage />
  </FormItem>
);

const DateField = ({ field, label }: any) => (
  <FormItem className="flex flex-col">
    <FormLabel>{label}</FormLabel>
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant="outline" className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
      </PopoverContent>
    </Popover>
    <FormMessage />
  </FormItem>
);

const TimeField = ({ field, label }: any) => (
    <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input type="time" {...field} /></FormControl>
        <FormMessage />
    </FormItem>
);