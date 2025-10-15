"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, Car, CalendarDays, Eye, Lock } from "lucide-react";
import { ChatButton } from "@/components/chat/ChatButton";
import { toast } from "sonner";

type BookingStatus = "pending" | "confirmed" | "canceled" | "completed" | 
  "draft" | "payment_pending" | "awaiting_confirmation" | "in_progress" | 
  "no_show" | "expired";

const statusConfig = {
  // Status antigos (compatibilidade)
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  canceled: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  
  // Novos status
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
  payment_pending: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  awaiting_confirmation: { label: "Aguardando Confirmação", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  requires_capture: { label: "Aguardando Captura", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  no_show: { label: "Não Compareceu", color: "bg-red-100 text-red-800", icon: XCircle },
  expired: { label: "Expirada", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

// Função para verificar se as informações do cliente devem ser exibidas
function shouldShowCustomerInfo(status: BookingStatus, userRole?: string): boolean {
  // Usuários master podem ver sempre
  if (userRole === "master") {
    return true;
  }
  // Outros usuários: apenas após confirmação
  return status === "confirmed" || status === "completed" || status === "in_progress";
}

// Componente para seção de informações do cliente protegida
function CustomerInfoSection({ 
  customerInfo, 
  status, 
  specialRequests, 
  partnerNotes,
  pickupLocation,
  notes,
  userRole
}: {
  customerInfo: { name: string; email: string; phone: string } | { name: string; email: string; phone: string };
  status: BookingStatus;
  specialRequests?: string;
  partnerNotes?: string;
  pickupLocation?: string;
  notes?: string;
  userRole?: string;
}) {
  const showInfo = shouldShowCustomerInfo(status, userRole);
  
  if (!showInfo) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-700 mb-1">Informações do Cliente Protegidas</h4>
            <p className="text-sm text-gray-500">
              As informações do cliente serão liberadas após a confirmação da reserva
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-medium mb-2">Informações do Cliente</h4>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex items-center">
          <span className="font-medium mr-2">Nome:</span>
          <span>{customerInfo.name}</span>
        </div>
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          <span>{customerInfo.email}</span>
        </div>
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-gray-500" />
          <span>{customerInfo.phone}</span>
        </div>
      </div>
      {pickupLocation && (
        <div className="mt-3">
          <span className="font-medium">Local de retirada:</span>
          <p className="text-gray-600 mt-1">{pickupLocation}</p>
        </div>
      )}
      {(specialRequests || notes) && (
        <div className="mt-3">
          <span className="font-medium">Solicitações especiais:</span>
          <p className="text-gray-600 mt-1">{specialRequests || notes}</p>
        </div>
      )}
      {partnerNotes && (
        <div className="mt-3">
          <span className="font-medium">Observações do parceiro:</span>
          <p className="text-gray-600 mt-1">{partnerNotes}</p>
        </div>
      )}
    </div>
  );
}

interface ConfirmBookingDialogProps {
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle";
  currentStatus: BookingStatus;
  onSuccess: () => void;
}

function ConfirmBookingDialog({ bookingId, bookingType, currentStatus, onSuccess }: ConfirmBookingDialogProps) {
  const [notes, setNotes] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const confirmActivityBooking = useMutation(api.domains.bookings.mutations.confirmActivityBooking);
  const confirmEventBooking = useMutation(api.domains.bookings.mutations.confirmEventBooking);
  const confirmRestaurantReservation = useMutation(api.domains.bookings.mutations.confirmRestaurantReservation);
  const confirmVehicleBooking = useMutation(api.domains.bookings.mutations.confirmVehicleBooking);
  
  // Buscar fornecedores ativos
  const suppliers = useQuery(api.domains.suppliers.queries.listSupplierOptions, { isActive: true });

  const handleConfirm = async () => {
    if (!supplierId) {
      toast.error("Por favor, selecione um fornecedor");
      return;
    }
    
    try {
      const args = {
        bookingId: bookingId as Id<any>,
        supplierId: supplierId as Id<"suppliers">,
        partnerNotes: notes.trim() || undefined,
      };

      switch (bookingType) {
        case "activity":
          await confirmActivityBooking(args);
          break;
        case "event":
          await confirmEventBooking(args);
          break;
        case "restaurant":
          await confirmRestaurantReservation({ 
            bookingId: bookingId as Id<"restaurantReservations">,
            supplierId: supplierId as Id<"suppliers">,
            partnerNotes: notes.trim() || undefined,
          });
          break;
        case "vehicle":
          await confirmVehicleBooking(args);
          break;
      }

      toast.success("Reserva confirmada com sucesso!");
      setIsOpen(false);
      setNotes("");
      setSupplierId("");
      onSuccess();
    } catch (error) {
      console.error("Erro ao confirmar reserva:", error);
      toast.error("Erro ao confirmar reserva. Tente novamente.");
    }
  };

  if (currentStatus !== "pending" && currentStatus !== "awaiting_confirmation") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle className="h-4 w-4 mr-1" />
          Confirmar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Reserva</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="supplier" className="text-sm font-medium">
              Fornecedor * <span className="text-red-500">obrigatório</span>
            </Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o fornecedor responsável..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              As informações do fornecedor aparecerão no voucher da reserva
            </p>
          </div>
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a confirmação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!supplierId}
            >
              Confirmar Reserva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CancelBookingDialogProps {
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle";
  currentStatus: BookingStatus;
  onSuccess: () => void;
}

function CancelBookingDialog({ bookingId, bookingType, currentStatus, onSuccess }: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const cancelActivityBooking = useMutation(api.domains.bookings.mutations.cancelActivityBooking);
  const cancelEventBooking = useMutation(api.domains.bookings.mutations.cancelEventBooking);
  const cancelRestaurantReservation = useMutation(api.domains.bookings.mutations.cancelRestaurantReservation);
  const cancelVehicleBooking = useMutation(api.domains.bookings.mutations.cancelVehicleBooking);

  const handleCancel = async () => {
    try {
      const args = {
        bookingId: bookingId as Id<any>,
        reason: reason.trim() || "Cancelada pelo partner",
      };

      switch (bookingType) {
        case "activity":
          await cancelActivityBooking(args);
          break;
        case "event":
          await cancelEventBooking(args);
          break;
        case "restaurant":
          await cancelRestaurantReservation({ 
            reservationId: bookingId as Id<"restaurantReservations">,
            reason: reason.trim() || "Cancelada pelo partner",
          });
          break;
        case "vehicle":
          await cancelVehicleBooking(args);
          break;
      }

      toast.success("Reserva cancelada com sucesso!");
      setIsOpen(false);
      setReason("");
      onSuccess();
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      toast.error("Erro ao cancelar reserva. Tente novamente.");
    }
  };

  if (currentStatus === "canceled" || currentStatus === "completed") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
          <XCircle className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Reserva</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Motivo do cancelamento</Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo do cancelamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Voltar
            </Button>
            <Button 
              onClick={handleCancel} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!reason.trim()}
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ActivityBookingCardProps {
  booking: any;
  onRefresh: () => void;
  userRole?: string;
}

function ActivityBookingCard({ booking, onRefresh, userRole }: ActivityBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  const paymentStatusConfig = {
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
    refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.activityTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">#{booking.confirmationCode}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center space-x-2">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {booking.paymentStatus && (
                <Badge className={paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig]?.color || "bg-gray-100 text-gray-800"}>
                  {paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig]?.label || booking.paymentStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <BookingDetailsModal
                data={booking}
                userRole={userRole}
                trigger={
                  <Button size="sm" variant="outline" title="Ver detalhes">
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
              <ChatButton
                assetId={booking.activityId}
                assetType="activities"
                assetName={booking.activityTitle}
                partnerId={booking.partnerId}
                bookingId={booking._id}
                bookingContext={`Reserva #${booking.confirmationCode}`}
                variant="outline"
                size="sm"
                showLabel={false}
              />
              <ConfirmBookingDialog
                bookingId={booking._id}
                bookingType="activity"
                currentStatus={booking.status}
                onSuccess={onRefresh}
              />
              <CancelBookingDialog
                bookingId={booking._id}
                bookingType="activity"
                currentStatus={booking.status}
                onSuccess={onRefresh}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.date}</span>
          </div>
          {booking.time && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span>{booking.time}</span>
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.participants} participantes</span>
          </div>
          <div className="font-semibold">
            R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        <CustomerInfoSection 
          customerInfo={booking.customerInfo}
          status={booking.status}
          specialRequests={booking.specialRequests}
          partnerNotes={booking.partnerNotes}
          userRole={userRole}
        />
      </CardContent>
    </Card>
  );
}

interface RestaurantReservationCardProps {
  reservation: any;
  onRefresh: () => void;
  userRole?: string;
}

function RestaurantReservationCard({ reservation, onRefresh, userRole }: RestaurantReservationCardProps) {
  const statusInfo = statusConfig[reservation.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  const paymentStatusConfig = {
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
    refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{reservation.restaurantName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">#{reservation.confirmationCode}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center space-x-2">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {reservation.paymentStatus && (
                <Badge className={paymentStatusConfig[reservation.paymentStatus as keyof typeof paymentStatusConfig]?.color || "bg-gray-100 text-gray-800"}>
                  {paymentStatusConfig[reservation.paymentStatus as keyof typeof paymentStatusConfig]?.label || reservation.paymentStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <BookingDetailsModal
                data={reservation}
                userRole={userRole}
                trigger={
                  <Button size="sm" variant="outline" title="Ver detalhes">
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
              <ChatButton
                assetId={reservation.restaurantId}
                assetType="restaurants"
                assetName={reservation.restaurantName}
                partnerId={reservation.partnerId}
                bookingId={reservation._id}
                bookingContext={`Reserva #${reservation.confirmationCode}`}
                variant="outline"
                size="sm"
                showLabel={false}
              />
              <ConfirmBookingDialog
                bookingId={reservation._id}
                bookingType="restaurant"
                currentStatus={reservation.status}
                onSuccess={onRefresh}
              />
              <CancelBookingDialog
                bookingId={reservation._id}
                bookingType="restaurant"
                currentStatus={reservation.status}
                onSuccess={onRefresh}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.time}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.partySize} pessoas</span>
          </div>
        </div>
        <CustomerInfoSection 
          customerInfo={{ name: reservation.name, email: reservation.email, phone: reservation.phone }}
          status={reservation.status}
          specialRequests={reservation.specialRequests}
          partnerNotes={reservation.partnerNotes}
          userRole={userRole}
        />
      </CardContent>
    </Card>
  );
}

interface VehicleBookingCardProps {
  booking: any;
  onRefresh: () => void;
  userRole?: string;
}

function VehicleBookingCard({ booking, onRefresh, userRole }: VehicleBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  const paymentStatusConfig = {
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
    refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Car className="h-5 w-5 mr-2 text-blue-600" />
              {booking.vehicleName}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {booking.vehicleBrand} {booking.vehicleModel}
              {booking.confirmationCode && ` - #${booking.confirmationCode}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center space-x-2">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {booking.paymentStatus && (
                <Badge className={paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig]?.color || "bg-gray-100 text-gray-800"}>
                  {paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig]?.label || booking.paymentStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <BookingDetailsModal
                data={booking}
                userRole={userRole}
                trigger={
                  <Button size="sm" variant="outline" title="Ver detalhes">
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
              <ChatButton
                assetId={booking.vehicleId}
                assetType="vehicles"
                assetName={booking.vehicleName}
                partnerId={booking.partnerId}
                bookingId={booking._id}
                bookingContext={booking.confirmationCode ? `Reserva #${booking.confirmationCode}` : `Reserva de ${booking.vehicleName}`}
                variant="outline"
                size="sm"
                showLabel={false}
              />
              <ConfirmBookingDialog
                bookingId={booking._id}
                bookingType="vehicle"
                currentStatus={booking.status}
                onSuccess={onRefresh}
              />
              <CancelBookingDialog
                bookingId={booking._id}
                bookingType="vehicle"
                currentStatus={booking.status}
                onSuccess={onRefresh}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {new Date(booking.startDate).toLocaleDateString('pt-BR')} - {new Date(booking.endDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="font-semibold">
            Total: R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        <CustomerInfoSection 
          customerInfo={booking.customerInfo}
          status={booking.status}
          specialRequests={booking.notes}
          partnerNotes={booking.partnerNotes}
          pickupLocation={booking.pickupLocation}
          userRole={userRole}
        />
      </CardContent>
    </Card>
  );
}

interface BookingDetailsModalProps {
  data: any;
  trigger?: React.ReactNode;
  userRole?: string;
}

export function BookingDetailsModal({ data, trigger, userRole }: BookingDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Função para formatar datas
  const formatDate = (date: string | number) => {
    if (typeof date === 'number') {
      return new Date(date).toLocaleString('pt-BR');
    }
    return date;
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Definir o tipo de reserva baseado nos campos
  const getBookingType = () => {
    if (data.activityTitle) return 'activity';
    if (data.eventTitle) return 'event';
    if (data.restaurantName) return 'restaurant';
    if (data.vehicleName) return 'vehicle';
    return 'unknown';
  };

  const bookingType = getBookingType();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" title="Ver detalhes completos">
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Detalhes da Reserva</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          {/* Informações Principais */}
          <div className="space-y-6">
            {/* Cabeçalho com Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {data.activityTitle || data.eventTitle || data.restaurantName || data.vehicleName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Código de Confirmação: <span className="font-mono font-semibold">{data.confirmationCode}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={statusConfig[data.status as BookingStatus]?.color}>
                    {statusConfig[data.status as BookingStatus]?.label || data.status}
                  </Badge>
                  {data.paymentStatus && (
                    <Badge className={
                      data.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      data.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      data.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {data.paymentStatus === 'paid' ? 'Pago' :
                       data.paymentStatus === 'pending' ? 'Pagamento Pendente' :
                       data.paymentStatus === 'failed' ? 'Pagamento Falhou' :
                       data.paymentStatus === 'refunded' ? 'Reembolsado' :
                       data.paymentStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Informações da Reserva */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                Informações da Reserva
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(data.date || data.eventDate) && (
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <p className="font-medium">{data.date || data.eventDate}</p>
                  </div>
                )}
                {(data.time || data.eventTime) && (
                  <div>
                    <span className="text-gray-600">Horário:</span>
                    <p className="font-medium">{data.time || data.eventTime}</p>
                  </div>
                )}
                {data.startDate && (
                  <div>
                    <span className="text-gray-600">Período:</span>
                    <p className="font-medium">
                      {formatDate(data.startDate)} até {formatDate(data.endDate)}
                    </p>
                  </div>
                )}
                {(data.participants || data.quantity || data.partySize) && (
                  <div>
                    <span className="text-gray-600">
                      {bookingType === 'activity' ? 'Participantes' :
                       bookingType === 'event' ? 'Ingressos' :
                       bookingType === 'restaurant' ? 'Pessoas' : 'Quantidade'}:
                    </span>
                    <p className="font-medium">{data.participants || data.quantity || data.partySize}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Valor Total:</span>
                  <p className="font-medium text-lg">{formatCurrency(data.totalPrice)}</p>
                </div>
              </div>
            </div>

            {/* Informações do Cliente */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                Informações do Cliente
              </h4>
              {shouldShowCustomerInfo(data.status, userRole) ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-20">Nome:</span>
                    <span className="font-medium">{data.customerInfo?.name || data.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{data.customerInfo?.email || data.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{data.customerInfo?.phone || data.phone}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Informações liberadas após confirmação
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Localização (para veículos) */}
            {(data.pickupLocation || data.returnLocation) && (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  Localização
                </h4>
                <div className="space-y-2 text-sm">
                  {data.pickupLocation && (
                    <div>
                      <span className="text-gray-600">Local de Retirada:</span>
                      <p className="font-medium">{data.pickupLocation}</p>
                    </div>
                  )}
                  {data.returnLocation && (
                    <div>
                      <span className="text-gray-600">Local de Devolução:</span>
                      <p className="font-medium">{data.returnLocation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observações e Solicitações */}
            {(data.specialRequests || data.notes || data.partnerNotes) && (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
                  Observações
                </h4>
                <div className="space-y-3 text-sm">
                  {(data.specialRequests || data.notes) && (
                    <div className="bg-blue-50 p-3 rounded">
                      <span className="text-gray-700 font-medium">Solicitações do Cliente:</span>
                      <p className="mt-1">{data.specialRequests || data.notes}</p>
                    </div>
                  )}
                  {data.partnerNotes && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <span className="text-gray-700 font-medium">Observações do Parceiro:</span>
                      <p className="mt-1">{data.partnerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações de Pagamento */}
            {data.paymentDetails && (
              <div className="space-y-4">
                <h4 className="font-semibold">Informações de Pagamento</h4>
                <div className="space-y-2 text-sm">
                  {data.paymentDetails?.receiptUrl && (
                    <div>
                      <a 
                        href={data.paymentDetails.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                      >
                        Ver Recibo do Pagamento
                        <span className="ml-1">↗</span>
                      </a>
                    </div>
                  )}
                  {!data.paymentDetails?.receiptUrl && (
                    <p className="text-muted-foreground text-xs">
                      O comprovante será disponibilizado assim que o pagamento for confirmado pelo provedor.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-gray-600">Informações do Sistema</h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span>ID da Reserva:</span>
                  <p className="font-mono">{data._id}</p>
                </div>
                <div>
                  <span>Criado em:</span>
                  <p>{formatDate(data._creationTime)}</p>
                </div>
                {data.updatedAt && (
                  <div>
                    <span>Atualizado em:</span>
                    <p>{formatDate(data.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EventBookingCardProps {
  booking: any;
  onRefresh: () => void;
  userRole?: string;
}

function EventBookingCard({ booking, onRefresh, userRole }: EventBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  const paymentStatusConfig = {
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
    refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.eventTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">#{booking.confirmationCode}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center space-x-2">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {booking.paymentStatus && (
                <Badge className={paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig]?.color || "bg-gray-100 text-gray-800"}>
                  {paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig]?.label || booking.paymentStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <BookingDetailsModal
                data={booking}
                userRole={userRole}
                trigger={
                  <Button size="sm" variant="outline" title="Ver detalhes">
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
              <ChatButton
                assetId={booking.eventId}
                assetType="events"
                assetName={booking.eventTitle}
                partnerId={booking.partnerId}
                bookingId={booking._id}
                bookingContext={`Reserva #${booking.confirmationCode}`}
                variant="outline"
                size="sm"
                showLabel={false}
              />
              <ConfirmBookingDialog
                bookingId={booking._id}
                bookingType="event"
                currentStatus={booking.status}
                onSuccess={onRefresh}
              />
              <CancelBookingDialog
                bookingId={booking._id}
                bookingType="event"
                currentStatus={booking.status}
                onSuccess={onRefresh}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.eventDate}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.eventTime}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.quantity} ingressos</span>
          </div>
          <div className="font-semibold">
            R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        <CustomerInfoSection 
          customerInfo={booking.customerInfo}
          status={booking.status}
          specialRequests={booking.specialRequests}
          partnerNotes={booking.partnerNotes}
          userRole={userRole}
        />
      </CardContent>
    </Card>
  );
}

export default function BookingManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  // refreshKey removido (não utilizado)

  // Buscar informações do usuário atual para verificar role
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  const partnerBookings = useQuery(api.domains.bookings.queries.getPartnerBookings, {
    paginationOpts: { numItems: 50, cursor: null },
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!partnerBookings) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Reservas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as reservas recebidas para seus serviços
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          onClick={() => setSelectedStatus("all")}
          size="sm"
        >
          Todas
        </Button>
        <Button
          variant={selectedStatus === "awaiting_confirmation" ? "default" : "outline"}
          onClick={() => setSelectedStatus("awaiting_confirmation")}
          size="sm"
          className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
        >
          Aguardando Confirmação
        </Button>
        <Button
          variant={selectedStatus === "pending" ? "default" : "outline"}
          onClick={() => setSelectedStatus("pending")}
          size="sm"
        >
          Pendentes
        </Button>
        <Button
          variant={selectedStatus === "confirmed" ? "default" : "outline"}
          onClick={() => setSelectedStatus("confirmed")}
          size="sm"
        >
          Confirmadas
        </Button>
        <Button
          variant={selectedStatus === "payment_pending" ? "default" : "outline"}
          onClick={() => setSelectedStatus("payment_pending")}
          size="sm"
        >
          Aguardando Pagamento
        </Button>
        <Button
          variant={selectedStatus === "canceled" ? "default" : "outline"}
          onClick={() => setSelectedStatus("canceled")}
          size="sm"
        >
          Canceladas
        </Button>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities">
            Atividades ({partnerBookings.activities.length})
          </TabsTrigger>
          <TabsTrigger value="restaurants">
            Restaurantes ({partnerBookings.restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            Veículos ({partnerBookings.vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Eventos ({partnerBookings.events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-6">
          {partnerBookings.activities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não recebeu reservas para suas atividades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {partnerBookings.activities.map((booking) => (
                <ActivityBookingCard
                  key={booking._id}
                  booking={booking}
                  onRefresh={handleRefresh}
                  userRole={currentUser?.role}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="restaurants" className="mt-6">
          {partnerBookings.restaurants.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não recebeu reservas para seus restaurantes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {partnerBookings.restaurants.map((reservation) => (
                <RestaurantReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onRefresh={handleRefresh}
                  userRole={currentUser?.role}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          {partnerBookings.vehicles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não recebeu reservas para seus veículos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {partnerBookings.vehicles.map((booking) => (
                <VehicleBookingCard
                  key={booking._id}
                  booking={booking}
                  onRefresh={handleRefresh}
                  userRole={currentUser?.role}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          {partnerBookings.events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não recebeu reservas para seus eventos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {partnerBookings.events.map((booking) => (
                <EventBookingCard
                  key={booking._id}
                  booking={booking}
                  onRefresh={handleRefresh}
                  userRole={currentUser?.role}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
