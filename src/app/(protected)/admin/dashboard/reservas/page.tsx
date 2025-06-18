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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Car,
  TrendingUp,
  Check,
  X,
  Building2,
  Store,
  Activity,
  Mail,
  Phone,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ui } from "@/lib/ui-config";
import { useAsset } from "@/lib/providers/asset-context";
import { AssetSelector } from "@/components/dashboard/AssetSelector";
import { motion } from "framer-motion";

// Helper function to safely format dates
const formatDateSafely = (dateValue: any, formatString: string = "PPP"): string => {
  if (!dateValue) {
    return "Data não informada";
  }

  try {
    let date: Date;
    
    if (typeof dateValue === 'string') {
      // Try parsing ISO string first
      if (dateValue.includes('T') || dateValue.includes('-')) {
        date = parseISO(dateValue);
      } else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return "Data inválida";
    }

    if (!isValid(date)) {
      return "Data inválida";
    }

    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error, "Date value:", dateValue);
    return "Data inválida";
  }
};

// Helper function for date ranges
const formatDateRange = (startDate: any, endDate: any): string => {
  const start = formatDateSafely(startDate);
  const end = formatDateSafely(endDate);
  
  if (start === "Data inválida" && end === "Data inválida") {
    return "Período não informado";
  }
  
  if (start === "Data inválida") {
    return `Até ${end}`;
  }
  
  if (end === "Data inválida") {
    return `A partir de ${start}`;
  }
  
  return `${start} - ${end}`;
};

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
      pending: { variant: "secondary" as const, label: "Pendente", icon: AlertCircle, color: "text-orange-600" },
      confirmed: { variant: "default" as const, label: "Confirmado", icon: CheckCircle, color: "text-green-600" },
      canceled: { variant: "destructive" as const, label: "Cancelado", icon: XCircle, color: "text-red-600" },
      completed: { variant: "outline" as const, label: "Concluído", icon: CheckCircle, color: "text-blue-600" },
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

  // Helper function to format booking date display
  const formatBookingDate = (booking: any, assetType: string) => {
    if (assetType === "restaurants") {
      return `${booking.date || "Data não informada"} às ${booking.time || "Horário não informado"}`;
    }
    
    if (assetType === "vehicles") {
      return formatDateRange(booking.startDate, booking.endDate);
    }
    
    // For activities and events
    return formatDateSafely(booking.startDate || booking.date);
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Design Minimalista */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className={`${ui.typography.h1.className} ${ui.colors.text.primary}`}>
              Gerenciamento de Reservas
            </h1>
            <p className={`${ui.colors.text.secondary} text-sm leading-relaxed`}>
              {selectedAsset 
                ? `Visualize e gerencie as reservas do ${selectedAsset.name}` 
                : "Selecione um asset para visualizar suas reservas"
              }
            </p>
          </div>
          {selectedAsset && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
              {getAssetIcon(selectedAsset.assetType)}
              <span className="text-sm font-medium text-blue-700">{selectedAsset.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Asset Selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <AssetSelector compact={true} showDetails={false} />
        </CardContent>
      </Card>

      {/* Show content only if asset is selected */}
      {selectedAsset ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de Reservas</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    {getAssetIcon(selectedAsset.assetType)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">R$ {stats.revenue.toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome do cliente, email, código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-0 bg-muted/30"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] border-0 bg-muted/30">
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
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                {getAssetIcon(selectedAsset.assetType)}
                Reservas - {selectedAsset.name}
                {filteredBookings.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {filteredBookings.length} {filteredBookings.length === 1 ? "reserva" : "reservas"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {getAssetIcon(selectedAsset.assetType)}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchTerm ? "Nenhuma reserva encontrada" : "Nenhuma reserva ainda"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? `Não encontramos reservas para "${searchTerm}"`
                      : "As reservas aparecerão aqui quando forem feitas"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking: any) => (
                    <Card key={booking._id} className="border border-border/50 hover:shadow-md transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-foreground">
                                {selectedAsset.assetType === "restaurants" 
                                  ? `Mesa para ${booking.partySize || booking.participants} pessoas`
                                  : booking.activityTitle || booking.eventTitle || booking.vehicleName || "Reserva"
                                }
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatBookingDate(booking, selectedAsset.assetType)}
                              </div>
                              
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                {booking.customerInfo?.name || booking.name || "Cliente"}
                              </div>
                              
                              {booking.customerInfo?.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                  {booking.customerInfo.email}
                                </div>
                              )}
                              
                              {booking.totalPrice && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="text-lg font-semibold text-green-600">
                                    R$ {booking.totalPrice.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowConfirmDialog(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                >
                                  <Check className="w-4 h-4" />
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowCancelDialog(true);
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                >
                                  <X className="w-4 h-4" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                            
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCancelDialog(true);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                              >
                                <X className="w-4 h-4" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Selecione um Asset
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Escolha um asset acima para visualizar e gerenciar suas reservas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Confirmar Reserva
            </DialogTitle>
            <DialogDescription>
              Confirme esta reserva e envie uma notificação ao cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre a confirmação..."
                value={partnerNotes}
                onChange={(e) => setPartnerNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleConfirmBooking(selectedBooking)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancelar Reserva
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O cliente será notificado sobre o cancelamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo do cancelamento</Label>
              <Textarea
                id="reason"
                placeholder="Explique o motivo do cancelamento..."
                value={partnerNotes}
                onChange={(e) => setPartnerNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleCancelBooking(selectedBooking)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancelar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}