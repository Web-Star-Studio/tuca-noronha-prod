"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "convex/react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { AdminReservationData } from "../AdminReservationCreationForm";
import { api } from "../../../../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { CreditCard, Banknote, Building, Clock, Info, DollarSign, Calendar, User, FileText, CheckCircle, Bell, Settings, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentConfigurationStepProps {
  data: Partial<AdminReservationData>;
  onComplete: (data: Partial<AdminReservationData>) => void;
}

const schema = z.object({
  paymentMethod: z.enum(["cash", "transfer", "card", "deferred"], { required_error: "Método de pagamento é obrigatório." }),
  paymentStatus: z.enum(["pending", "paid", "deferred"], { required_error: "Status do pagamento é obrigatório." }),
  totalAmount: z.coerce.number().min(0, "Valor total deve ser um número positivo."),
  createdMethod: z.enum(["admin_direct", "phone_booking", "walk_in"], { required_error: "Método de criação é obrigatório." }),
  autoConfirm: z.boolean().default(false),
  sendNotifications: z.boolean().default(true),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_METHODS = [
  { value: "card", label: "Cartão de Crédito", icon: CreditCard, description: "Pagamento online ou na maquininha." },
  { value: "transfer", label: "Transferência/PIX", icon: Building, description: "Pagamento por transferência bancária." },
  { value: "cash", label: "Dinheiro", icon: Banknote, description: "Pagamento em espécie no local." },
  { value: "deferred", label: "Pagamento Pós-serviço", icon: Clock, description: "Acerto no final do serviço." },
];

const CREATION_METHODS = [
  { value: "admin_direct", label: "Criação Direta", description: "Reserva criada diretamente pelo painel." },
  { value: "phone_booking", label: "Reserva por Telefone", description: "Negociação e reserva por telefone." },
  { value: "walk_in", label: "Walk-in", description: "Cliente chegou ao local sem reserva prévia." },
];

export function PaymentConfigurationStep({ data, onComplete }: PaymentConfigurationStepProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: data.paymentMethod || "card",
      paymentStatus: data.paymentStatus || "pending",
      totalAmount: data.totalAmount || 0,
      createdMethod: data.createdMethod || "admin_direct",
      autoConfirm: data.autoConfirm || false,
      sendNotifications: data.sendNotifications !== false,
      notes: data.notes || "",
    },
  });

  const watchedValues = form.watch();

  const handlePaymentMethodChange = (value: "cash" | "transfer" | "card" | "deferred") => {
    form.setValue("paymentMethod", value);
    if (value === "cash" || value === "transfer") {
      form.setValue("paymentStatus", "paid");
    } else if (value === "deferred") {
      form.setValue("paymentStatus", "deferred");
    } else {
      form.setValue("paymentStatus", "pending");
    }
  };
  
  const autoConfirmSettings = useQuery(api.domains.systemSettings.queries.getSetting, { key: "autoConfirmReservations" });
  const isAutoConfirmEnabled = autoConfirmSettings?.value === "true";


  const onSubmit = (values: FormData) => {
    onComplete(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Configuration Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard /> Pagamento</CardTitle></CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={(value) => handlePaymentMethodChange(value as any)}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <FormItem key={method.value}>
                        <FormControl>
                          <RadioGroupItem value={method.value} id={method.value} className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor={method.value}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <method.icon className="mb-3 h-6 w-6" />
                          {method.label}
                        </Label>
                      </FormItem>
                    ))}
                  </RadioGroup>
                )}
              />
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            value={isNaN(field.value) ? '' : field.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === '' ? null : parseFloat(val));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Status do Pagamento</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      <SelectItem value="pending">Pendente</SelectItem>
                                      <SelectItem value="paid">Pago</SelectItem>
                                      <SelectItem value="deferred">Adiado</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Tag /> Detalhes da Reserva</CardTitle></CardHeader>
            <CardContent>
               <FormField
                control={form.control}
                name="createdMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Como esta reserva foi criada?</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CREATION_METHODS.map(method => (
                            <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormDescription>{CREATION_METHODS.find(m => m.value === field.value)?.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Observações Internas</FormLabel>
                    <FormControl><Textarea placeholder="Adicione qualquer nota relevante para a equipe..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings /> Opções Avançadas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="autoConfirm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Confirmação Automática</FormLabel>
                      <FormDescription>Confirmar a reserva imediatamente se não houver conflitos de disponibilidade.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!isAutoConfirmEnabled} /></FormControl>
                  </FormItem>
                )}
              />
              {!isAutoConfirmEnabled && <Alert variant="warning"><Info className="h-4 w-4"/>A confirmação automática está desabilitada nas configurações gerais.</Alert>}
               <FormField
                control={form.control}
                name="sendNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enviar Notificações</FormLabel>
                      <FormDescription>Enviar email de confirmação e atualizações para o cliente.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Column */}
        <div className="lg:col-span-1 space-y-6">
            <SummaryCard data={data} formValues={watchedValues} />
            <Button type="submit" size="lg" className="w-full" disabled={!form.formState.isValid}>Finalizar e Criar Reserva</Button>
        </div>
      </form>
    </Form>
  );
}


function SummaryCard({ data, formValues }: { data: Partial<AdminReservationData>, formValues: Partial<FormData> }) {
    const { assetTitle, travelerName, reservationData } = data;
    
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        return format(new Date(date), 'PP', { locale: ptBR });
    }

    const formatDateTime = (date: any, time: any) => {
        if (!date || !time) return 'N/A';
        const d = new Date(date);
        const [h, m] = time.split(':');
        d.setHours(h,m);
        return format(d, 'PPp', { locale: ptBR });
    }

    const renderReservationDetails = () => {
        if(!reservationData) return null;
        switch(data.assetType) {
            case 'activities': return `Data: ${formatDateTime(reservationData.date, reservationData.time)}, ${reservationData.participants} pessoas`;
            case 'events': return `Data: ${formatDate(reservationData.date)}, ${reservationData.tickets} ingressos`;
            case 'restaurants': return `Data: ${formatDateTime(reservationData.date, reservationData.time)}, ${reservationData.guests} pessoas`;
            case 'vehicles': return `De ${formatDate(reservationData.startDate)} a ${formatDate(reservationData.endDate)}`;
            case 'accommodations': return `Check-in: ${formatDate(reservationData.checkIn)}, Check-out: ${formatDate(reservationData.checkOut)}, ${reservationData.guests} hóspedes`;
            default: return 'Detalhes não disponíveis';
        }
    }

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>Resumo da Reserva</CardTitle>
                <CardDescription>Revise os detalhes antes de finalizar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span className="font-semibold">{assetTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Viajante:</span>
                    <span className="font-semibold">{travelerName}</span>
                </div>
                 <div className="text-sm">
                    <p className="text-muted-foreground">Detalhes:</p>
                    <p className="font-semibold">{renderReservationDetails()}</p>
                </div>

                <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold">Pagamento</h4>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-bold text-lg">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formValues.totalAmount || 0)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Método:</span>
                        <Badge variant="outline">{PAYMENT_METHODS.find(p => p.value === formValues.paymentMethod)?.label}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={formValues.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                            {formValues.paymentStatus === 'paid' ? 'Pago' : formValues.paymentStatus === 'pending' ? 'Pendente' : 'Adiado'}
                        </Badge>
                    </div>
                </div>
                
                 <div className="border-t pt-4 space-y-2">
                     <h4 className="font-semibold">Opções</h4>
                      <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Confirmação Automática:</span>
                         <span className="font-semibold">{formValues.autoConfirm ? 'Ativada' : 'Desativada'}</span>
                     </div>
                      <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Notificações por Email:</span>
                         <span className="font-semibold">{formValues.sendNotifications ? 'Ativadas' : 'Desativadas'}</span>
                     </div>
                 </div>
            </CardContent>
        </Card>
    );
}