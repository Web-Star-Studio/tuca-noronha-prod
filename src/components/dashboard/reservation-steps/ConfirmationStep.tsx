"use client";

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, User, Calendar, CreditCard, DollarSign, Info, Mail, Phone, FileText, Tag, Package, Edit, Send } from "lucide-react";
import { AdminReservationData } from "../AdminReservationCreationForm";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConfirmationStepProps {
  data: AdminReservationData;
  onSubmit: (data: AdminReservationData) => void;
  onEdit: (step: number) => void;
  isSubmitting: boolean;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  activities: "Atividade",
  events: "Evento",
  restaurants: "Restaurante",
  vehicles: "Veículo",
  accommodations: "Hospedagem",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Cartão de Crédito",
  transfer: "Transferência/PIX",
  cash: "Dinheiro",
  deferred: "Pagamento Pós-serviço",
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; variant: "success" | "secondary" | "warning" }> = {
  paid: { label: "Pago", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  deferred: { label: "Adiado", variant: "secondary" },
};

const CREATION_METHOD_LABELS: Record<string, string> = {
  admin_direct: "Criação Direta (Painel)",
  phone_booking: "Reserva por Telefone",
  walk_in: "Walk-in (Presencial)",
};



const InfoRow = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  </div>
);

export function ConfirmationStep({ data, onSubmit, onEdit, isSubmitting }: ConfirmationStepProps) {
  const { reservationData, assetType, assetTitle, totalAmount, paymentMethod, paymentStatus, createdMethod, autoConfirm, sendNotifications, notes } = data;

  const formatDate = (dateInput?: string | Date) => dateInput ? format(new Date(dateInput), "PPP", { locale: ptBR }) : 'N/A';
  const formatDateTime = (dateInput?: string, timeInput?: string) => {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':');
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, "PPP 'às' HH:mm", { locale: ptBR });
    }
    return formatDate(dateInput);
  };
  
  const renderAssetSpecificDetails = () => {
    if (!reservationData) return null;
    switch (assetType) {
      case "activities": return <InfoRow icon={Info} label="Detalhes">{reservationData.participants} participantes em {formatDateTime(reservationData.date, reservationData.time)}</InfoRow>;
      case "events": return <InfoRow icon={Info} label="Detalhes">{reservationData.tickets} ingresso(s) ({reservationData.ticketType}) para {formatDate(reservationData.date)}</InfoRow>;
      case "restaurants": return <InfoRow icon={Info} label="Detalhes">Mesa para {reservationData.guests} em {formatDateTime(reservationData.date, reservationData.time)}</InfoRow>;
      case "vehicles": return <InfoRow icon={Info} label="Período">{formatDate(reservationData.startDate)} a {formatDate(reservationData.endDate)}</InfoRow>;
      case "accommodations": return <InfoRow icon={Info} label="Período">{reservationData.guests} hóspedes de {formatDate(reservationData.checkIn)} a {formatDate(reservationData.checkOut)}</InfoRow>;
      default: return null;
    }
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Revise e Confirme</h1>
        <p className="text-muted-foreground mt-2">
          Confira todos os detalhes da reserva antes de finalizá-la.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><Package className="text-primary"/> {assetTitle}</CardTitle>
              <CardDescription>{ASSET_TYPE_LABELS[assetType]}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(0)}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Traveler Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><User /> Informações do Viajante</h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(1)}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Nome">{reservationData.customerName}</InfoRow>
              <InfoRow icon={Mail} label="Email">{reservationData.customerEmail}</InfoRow>
              <InfoRow icon={Phone} label="Telefone">{reservationData.customerPhone}</InfoRow>
              {reservationData.customerDocument && <InfoRow icon={FileText} label="Documento">{reservationData.customerDocument}</InfoRow>}
            </div>
          </section>

          <Separator />

          {/* Reservation Details Section */}
          <section>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar /> Detalhes da Reserva</h3>
                <Button variant="ghost" size="sm" onClick={() => onEdit(2)}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
            </div>
             {renderAssetSpecificDetails()}
             {notes && <InfoRow icon={Info} label="Observações Internas">{notes}</InfoRow>}
          </section>
          
          <Separator />
          
          {/* Payment Section */}
          <section>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign /> Pagamento e Configurações</h3>
                <Button variant="ghost" size="sm" onClick={() => onEdit(3)}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={DollarSign} label="Valor Total">
                    <span className="font-bold text-lg text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                    </span>
                </InfoRow>
                <InfoRow icon={CreditCard} label="Método de Pagamento">
                    <Badge variant="outline">{PAYMENT_METHOD_LABELS[paymentMethod]}</Badge>
                </InfoRow>
                <InfoRow icon={CheckCircle2} label="Status do Pagamento">
                    <Badge variant={PAYMENT_STATUS_LABELS[paymentStatus].variant}>{PAYMENT_STATUS_LABELS[paymentStatus].label}</Badge>
                </InfoRow>
                <InfoRow icon={Tag} label="Origem da Reserva">
                    <Badge variant="secondary">{CREATION_METHOD_LABELS[createdMethod]}</Badge>
                </InfoRow>
                <InfoRow icon={CheckCircle2} label="Confirmação Automática">
                    {autoConfirm ? 'Sim' : 'Não'}
                </InfoRow>
                <InfoRow icon={Send} label="Notificações por Email">
                    {sendNotifications ? 'Sim' : 'Não'}
                </InfoRow>
            </div>
          </section>
        </CardContent>
      </Card>

      <Alert>
          <Info className="h-4 w-4"/>
          <AlertDescription>
              Ao confirmar, a reserva será criada no sistema. Se as notificações estiverem ativas, o cliente receberá um email de confirmação.
          </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => onSubmit(data)} disabled={isSubmitting}>
          {isSubmitting ? "Finalizando..." : "Finalizar e Criar Reserva"}
        </Button>
      </div>
    </div>
  );
}