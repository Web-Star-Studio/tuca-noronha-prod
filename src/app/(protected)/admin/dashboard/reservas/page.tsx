"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Car,
  Utensils,
  Ticket,
  TrendingUp,
  Check,
  X,
  MessageCircle,
  Building2,
  Store,
  Activity,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ui } from "@/lib/ui-config";
import { useAsset } from "@/lib/providers/asset-context";
import { AssetSelector } from "@/components/dashboard/AssetSelector";

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [partnerNotes, setPartnerNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Asset context
  const { selectedAsset } = useAsset();

  // Mutations for booking actions
  const confirmActivityBooking = useMutation(api.domains.bookings.mutations.confirmActivityBooking);
  const confirmEventBooking = useMutation(api.domains.bookings.mutations.confirmEventBooking);
  const confirmRestaurantReservation = useMutation(api.domains.bookings.mutations.confirmRestaurantReservation);
  const confirmVehicleBooking = useMutation(api.domains.bookings.mutations.confirmVehicleBooking);
  const cancelActivityBooking = useMutation(api.domains.bookings.mutations.cancelActivityBooking);
  const cancelEventBooking = useMutation(api.domains.bookings.mutations.cancelEventBooking);
  const cancelRestaurantReservation = useMutation(api.domains.bookings.mutations.cancelRestaurantReservation);
  const cancelVehicleBooking = useMutation(api.domains.bookings.mutations.cancelVehicleBooking);

  // Fetch bookings based on selected asset type
  // Now we pass organizationId instead of specific asset IDs since selectedAsset is an organization
  const activityBookings = useQuery(
    selectedAsset?.assetType === "activities" 
      ? api.domains.bookings.queries.getActivityBookings
      : "skip",
    selectedAsset?.assetType === "activities" ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );
  
  const eventBookings = useQuery(
    selectedAsset?.assetType === "events"
      ? api.domains.bookings.queries.getEventBookings
      : "skip",
    selectedAsset?.assetType === "events" ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );
  
  const restaurantReservations = useQuery(
    selectedAsset?.assetType === "restaurants"
      ? api.domains.bookings.queries.getRestaurantReservations
      : "skip",
    selectedAsset?.assetType === "restaurants" ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );
  
  const vehicleBookings = useQuery(
    selectedAsset?.assetType === "vehicles"
      ? api.domains.bookings.queries.getVehicleBookings
      : "skip",
    selectedAsset?.assetType === "vehicles" ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );

  // Get current bookings based on asset type
  const currentBookings = useMemo(() => {
    if (!selectedAsset) return [];
    
    switch (selectedAsset.assetType) {
      case "activities":
        return activityBookings?.page || [];
      case "events":
        return eventBookings?.page || [];
      case "restaurants":
        return restaurantReservations?.page || [];
      case "vehicles":
        return vehicleBookings?.page || [];
      default:
        return [];
    }
  }, [selectedAsset, activityBookings, eventBookings, restaurantReservations, vehicleBookings]);

  // Filter bookings based on search term
  const filteredBookings = useMemo(() => {
    if (!searchTerm) return currentBookings;
    
    const searchLower = searchTerm.toLowerCase();
    return currentBookings.filter((booking: any) => {
      const customerName = booking.customerInfo?.name || booking.name || "";
      const customerEmail = booking.customerInfo?.email || booking.email || "";
      const confirmationCode = booking.confirmationCode || "";
      
      return (
        customerName.toLowerCase().includes(searchLower) ||
        customerEmail.toLowerCase().includes(searchLower) ||
        confirmationCode.toLowerCase().includes(searchLower)
      );
    });
  }, [currentBookings, searchTerm]);

  // Handle booking confirmation
  const handleConfirmBooking = async (booking: any) => {
    if (!selectedAsset) return;
    
    try {
      switch (selectedAsset.assetType) {
        case "activities":
          await confirmActivityBooking({
            bookingId: booking._id,
            partnerNotes: partnerNotes || undefined,
          });
          break;
        case "events":
          await confirmEventBooking({
            bookingId: booking._id,
            partnerNotes: partnerNotes || undefined,
          });
          break;
        case "restaurants":
          await confirmRestaurantReservation({
            reservationId: booking._id,
            partnerNotes: partnerNotes || undefined,
          });
          break;
        case "vehicles":
          await confirmVehicleBooking({
            bookingId: booking._id,
            partnerNotes: partnerNotes || undefined,
          });
          break;
      }
      
      toast.success("Reserva confirmada com sucesso!");
      setShowConfirmDialog(false);
      setSelectedBooking(null);
      setPartnerNotes("");
    } catch (error) {
      toast.error("Erro ao confirmar reserva");
      console.error(error);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (booking: any) => {
    if (!selectedAsset) return;
    
    try {
      switch (selectedAsset.assetType) {
        case "activities":
          await cancelActivityBooking({
            bookingId: booking._id,
            reason: partnerNotes || "Cancelada pelo admin",
          });
          break;
        case "events":
          await cancelEventBooking({
            bookingId: booking._id,
            reason: partnerNotes || "Cancelada pelo admin",
          });
          break;
        case "restaurants":
          await cancelRestaurantReservation({
            reservationId: booking._id,
            reason: partnerNotes || "Cancelada pelo admin",
          });
          break;
        case "vehicles":
          await cancelVehicleBooking({
            bookingId: booking._id,
            reason: partnerNotes || "Cancelada pelo admin",
          });
          break;
      }
      
      toast.success("Reserva cancelada com sucesso!");
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setPartnerNotes("");
    } catch (error) {
      toast.error("Erro ao cancelar reserva");
      console.error(error);
    }
  };

  // Stats calculation for current asset
  const calculateStats = () => {
    if (filteredBookings.length === 0) {
      return { total: 0, pending: 0, confirmed: 0, revenue: 0 };
    }
    
    return {
      total: filteredBookings.length,
      pending: filteredBookings.filter((b: any) => b.status === "pending").length,
      confirmed: filteredBookings.filter((b: any) => b.status === "confirmed").length,
      revenue: filteredBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pendente", icon: AlertCircle },
      confirmed: { variant: "default" as const, label: "Confirmado", icon: CheckCircle },
      canceled: { variant: "destructive" as const, label: "Cancelado", icon: XCircle },
      completed: { variant: "outline" as const, label: "Concluído", icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Action buttons for each booking
  const renderActionButtons = (booking: any) => {
    if (booking.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedBooking(booking);
              setShowConfirmDialog(true);
            }}
            className={ui.buttons.confirm.className}
          >
            <Check className="w-4 h-4 mr-1" />
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedBooking(booking);
              setShowCancelDialog(true);
            }}
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        </div>
      );
    }
    
    if (booking.status === "confirmed") {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedBooking(booking);
            setShowCancelDialog(true);
          }}
        >
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
      );
    }
    
    return null;
  };

  const getAssetIcon = (assetType: string) => {
    const icons = {
      restaurants: Store,
      events: Calendar,
      activities: Activity,
      vehicles: Car,
      accommodations: Building2,
    };
    
    const Icon = icons[assetType as keyof typeof icons] || Building2;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className={`${ui.typography.h1.className} ${ui.colors.text.primary}`}>
            Gerenciamento de Reservas
          </h1>
          {selectedAsset && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
              {getAssetIcon(selectedAsset.assetType)}
              <span className="text-sm font-medium text-blue-700">{selectedAsset.name}</span>
            </div>
          )}
        </div>
        <p className={ui.colors.text.secondary}>
          {selectedAsset 
            ? `Visualize e gerencie as reservas do ${selectedAsset.name}` 
            : "Selecione um asset para visualizar suas reservas"
          }
        </p>
      </div>

      {/* Asset Selector */}
      <AssetSelector compact={true} showDetails={false} />

      {/* Show content only if asset is selected */}
      {selectedAsset ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Total de Reservas</p>
                    <p className={`text-2xl font-bold ${ui.colors.text.primary}`}>
                      {stats.total}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getAssetIcon(selectedAsset.assetType)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Pendentes</p>
                    <p className={`text-2xl font-bold ${ui.colors.warning}`}>
                      {stats.pending}
                    </p>
                  </div>
                  <Clock className={`h-8 w-8 ${ui.colors.warning}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Confirmadas</p>
                    <p className={`text-2xl font-bold ${ui.colors.success}`}>
                      {stats.confirmed}
                    </p>
                  </div>
                  <CheckCircle className={`h-8 w-8 ${ui.colors.success}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Receita Total</p>
                    <p className={`text-2xl font-bold ${ui.colors.success}`}>
                      R$ {stats.revenue.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className={`h-8 w-8 ${ui.colors.success}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${ui.colors.text.muted} w-4 h-4`} />
              <Input
                placeholder="Buscar por nome do cliente, email, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getAssetIcon(selectedAsset.assetType)}
                  Reservas - {selectedAsset.name}
                  {filteredBookings.length > 0 && (
                    <Badge variant="secondary">
                      {filteredBookings.length} {filteredBookings.length === 1 ? "reserva" : "reservas"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className={`text-center py-8 ${ui.colors.text.muted}`}>
                    {searchTerm 
                      ? `Nenhuma reserva encontrada para "${searchTerm}"`
                      : "Nenhuma reserva encontrada para este asset"
                    }
                  </div>
                ) : (
                  filteredBookings.map((booking: any) => (
                    <Card key={booking._id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">
                                {selectedAsset.assetType === "restaurants" 
                                  ? `Mesa para ${booking.partySize || booking.participants} pessoas`
                                  : booking.activityTitle || booking.eventTitle || booking.vehicleName || "Reserva"
                                }
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className={`space-y-1 text-sm ${ui.colors.text.secondary}`}>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {selectedAsset.assetType === "restaurants" 
                                  ? `${booking.date} às ${booking.time}`
                                  : selectedAsset.assetType === "vehicles"
                                  ? `${format(new Date(booking.startDate), "PPP", { locale: ptBR })} - ${format(new Date(booking.endDate), "PPP", { locale: ptBR })}`
                                  : booking.date
                                }
                              </div>
                              {(booking.participants || booking.partySize) && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  {booking.participants || booking.partySize} {selectedAsset.assetType === "restaurants" ? "pessoas" : "participantes"}
                                </div>
                              )}
                              {booking.totalPrice && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    R$ {booking.totalPrice.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono">
                                  #{booking.confirmationCode}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-3">
                              <p className="font-medium">{booking.customerInfo?.name || booking.name}</p>
                              <p className={`text-sm ${ui.colors.text.secondary}`}>{booking.customerInfo?.email || booking.email}</p>
                              <p className={`text-sm ${ui.colors.text.secondary}`}>{booking.customerInfo?.phone || booking.phone}</p>
                            </div>
                            {renderActionButtons(booking)}
                          </div>
                        </div>
                        {booking.specialRequests && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium">Solicitações especiais:</p>
                            <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                          </div>
                        )}
                        {booking.partnerNotes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium">Observações do parceiro:</p>
                            <p className="text-sm text-gray-600">{booking.partnerNotes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um Asset</h3>
            <p className="text-gray-600">
              Escolha um asset acima para visualizar e gerenciar suas reservas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja confirmar esta reserva? O cliente receberá uma notificação da confirmação.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className={`space-y-3 p-4 ${ui.colors.background.muted} rounded-lg`}>
              <div>
                <Label className="text-sm font-medium">Detalhes da Reserva</Label>
                <p className="text-sm">Cliente: {selectedBooking.customerInfo?.name || selectedBooking.name}</p>
                <p className="text-sm">Código: #{selectedBooking.confirmationCode}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-notes">Observações do Parceiro (opcional)</Label>
                <Textarea
                  id="partner-notes"
                  placeholder="Adicione observações ou instruções especiais para o cliente..."
                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedBooking && handleConfirmBooking(selectedBooking)}
              className={ui.buttons.confirm.className}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className={`space-y-3 p-4 ${ui.colors.background.muted} rounded-lg`}>
              <div>
                <Label className="text-sm font-medium">Detalhes da Reserva</Label>
                <p className="text-sm">Cliente: {selectedBooking.customerInfo?.name || selectedBooking.name}</p>
                <p className="text-sm">Código: #{selectedBooking.confirmationCode}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Motivo do Cancelamento</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Explique o motivo do cancelamento..."
                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBooking && handleCancelBooking(selectedBooking)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}