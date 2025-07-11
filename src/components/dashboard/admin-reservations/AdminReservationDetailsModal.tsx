"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  User, 
  MapPin, 
  DollarSign, 
  CreditCard,
  Clock,
  FileText,
  History,
  CheckCircle,
  XCircle
} from "lucide-react";

interface AdminReservationDetailsModalProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: Clock },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-800", icon: Clock },
  completed: { label: "Concluída", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
  no_show: { label: "Não Compareceu", color: "bg-orange-100 text-orange-800", icon: XCircle }
};

const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Pago", color: "bg-green-100 text-green-800" },
  cash: { label: "Dinheiro", color: "bg-blue-100 text-blue-800" },
  transfer: { label: "Transferência", color: "bg-purple-100 text-purple-800" },
  deferred: { label: "A Pagar", color: "bg-orange-100 text-orange-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" }
};

export function AdminReservationDetailsModal({ 
  reservation, 
  open, 
  onOpenChange 
}: AdminReservationDetailsModalProps) {
  const statusConfig = STATUS_CONFIG[reservation.status as keyof typeof STATUS_CONFIG];
  const paymentConfig = PAYMENT_STATUS_CONFIG[reservation.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;
  
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  const formatDateTime = (date: any) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Reserva {reservation.confirmationCode}
              </DialogTitle>
              <DialogDescription>
                Criada em {formatDateTime(reservation.createdAt)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={paymentConfig.color}>
                {paymentConfig.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Informações do Viajante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Viajante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{reservation.traveler?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{reservation.traveler?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{reservation.traveler?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID do Viajante</p>
                  <p className="font-mono text-sm">{reservation.travelerId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detalhes da Reserva */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Detalhes da Reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Asset</p>
                    <p className="font-medium capitalize">{reservation.assetType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID do Asset</p>
                    <p className="font-mono text-sm">{reservation.assetId}</p>
                  </div>
                </div>
                
                {reservation.reservationData && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reservation.reservationData.startDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {reservation.assetType === "accommodations" ? "Check-in" : "Data de Início"}
                          </p>
                          <p className="font-medium">{formatDate(reservation.reservationData.startDate)}</p>
                        </div>
                      )}
                      {reservation.reservationData.endDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {reservation.assetType === "accommodations" ? "Check-out" : "Data de Fim"}
                          </p>
                          <p className="font-medium">{formatDate(reservation.reservationData.endDate)}</p>
                        </div>
                      )}
                      {reservation.reservationData.guests && (
                        <div>
                          <p className="text-sm text-muted-foreground">Número de Pessoas</p>
                          <p className="font-medium">{reservation.reservationData.guests}</p>
                        </div>
                      )}
                      {reservation.reservationData.time && (
                        <div>
                          <p className="text-sm text-muted-foreground">Horário</p>
                          <p className="font-medium">{reservation.reservationData.time}</p>
                        </div>
                      )}
                    </div>
                    {reservation.reservationData.specialRequests && (
                      <div>
                        <p className="text-sm text-muted-foreground">Solicitações Especiais</p>
                        <p className="font-medium bg-muted p-3 rounded-md">
                          {reservation.reservationData.specialRequests}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Informações de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-medium text-lg">R$ {reservation.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="font-medium text-lg">
                    R$ {(reservation.paidAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                  <p className="font-medium">{reservation.paymentMethod || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                  <Badge className={paymentConfig.color}>
                    {paymentConfig.label}
                  </Badge>
                </div>
              </div>
              {reservation.paymentNotes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Observações sobre Pagamento</p>
                  <p className="font-medium bg-muted p-3 rounded-md">
                    {reservation.paymentNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Informações Administrativas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações Administrativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Criada por</p>
                    <p className="font-medium">{reservation.admin?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Criação</p>
                    <p className="font-medium">{reservation.createdMethod}</p>
                  </div>
                  {reservation.partner && (
                    <div>
                      <p className="text-sm text-muted-foreground">Parceiro</p>
                      <p className="font-medium">{reservation.partner.name}</p>
                    </div>
                  )}
                  {reservation.organization && (
                    <div>
                      <p className="text-sm text-muted-foreground">Organização</p>
                      <p className="font-medium">{reservation.organization.name}</p>
                    </div>
                  )}
                </div>
                
                {reservation.adminNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas Administrativas</p>
                    <p className="font-medium bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {reservation.adminNotes}
                    </p>
                  </div>
                )}
                
                {reservation.customerNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas do Cliente</p>
                    <p className="font-medium bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {reservation.customerNotes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Histórico de Alterações */}
          {reservation.changeHistory && reservation.changeHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reservation.changeHistory.map((change: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{change.changeDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(change.timestamp)} - Por {change.changedByRole}
                        </p>
                        {change.changeReason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Motivo: {change.changeReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 