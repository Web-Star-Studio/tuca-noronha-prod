"use client";

import { useState, useMemo } from "react";

// Função para verificar se as informações do cliente devem ser exibidas
function shouldShowCustomerInfo(status: string): boolean {
  // Apenas exibe informações do cliente após confirmação
  return status === "confirmed" || status === "completed" || status === "in_progress";
}
import { useQuery, useMutation, useConvex, useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Lock,
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
  Eye,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAsset } from "@/lib/providers/asset-context";
import { AssetSelector } from "@/components/dashboard/AssetSelector";
import { motion } from "framer-motion";
import { DashboardPageHeader } from "../components";
import { BookingDetailsModal } from "@/components/dashboard/bookings/BookingManagement";
import { VoucherDownloadButton } from "@/components/vouchers";
import { BookingChatButton } from "@/components/chat";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

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
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [partnerNotes, setPartnerNotes] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Get convex client for imperative calls
  const convex = useConvex();

  // Get current user to check if master
  const { user } = useCurrentUser();
  const isMaster = user?.role === "master";

  // Asset context
  const { selectedAsset } = useAsset();

  // Fetch suppliers list for the confirm dialog
  const suppliers = useQuery(api.domains.suppliers.queries.listSupplierOptions, {
    isActive: true,
  });

  // Actions for booking approval/rejection with payment capture
  const approveBooking = useAction(api.domains.mercadoPago.actions.approveBookingAndCapturePayment);
  const rejectBooking = useAction(api.domains.mercadoPago.actions.rejectBookingAndCancelPayment);
  
  // Legacy mutations for backward compatibility
  const confirmActivityBooking = useMutation(api.domains.bookings.mutations.confirmActivityBooking);
  const confirmEventBooking = useMutation(api.domains.bookings.mutations.confirmEventBooking);
  const confirmRestaurantReservation = useMutation(api.domains.bookings.mutations.confirmRestaurantReservation);
  const confirmVehicleBooking = useMutation(api.domains.bookings.mutations.confirmVehicleBooking);
  const cancelActivityBooking = useMutation(api.domains.bookings.mutations.cancelActivityBooking);
  const cancelEventBooking = useMutation(api.domains.bookings.mutations.cancelEventBooking);
  const cancelRestaurantReservation = useMutation(api.domains.bookings.mutations.cancelRestaurantReservation);
  const cancelVehicleBooking = useMutation(api.domains.bookings.mutations.cancelVehicleBooking);

  // Para usuários master, sempre buscar todas as reservas independente do asset selecionado
  // Para outros usuários, buscar todas apenas quando não há asset selecionado
  const shouldFetchAllActivities = (typeFilter === "all" || typeFilter === "activities") && (isMaster || !selectedAsset);
  const allActivityBookings = useQuery(
    api.domains.bookings.queries.getActivityBookings,
    shouldFetchAllActivities
      ? {
          paginationOpts: { numItems: 100, cursor: null },
          ...(statusFilter !== "all" && { status: statusFilter }),
        }
      : "skip"
  );
  
  const shouldFetchAllEvents = (typeFilter === "all" || typeFilter === "events") && (isMaster || !selectedAsset);
  const allEventBookings = useQuery(
    api.domains.bookings.queries.getEventBookings,
    shouldFetchAllEvents
      ? {
          paginationOpts: { numItems: 100, cursor: null },
          ...(statusFilter !== "all" && { status: statusFilter }),
        }
      : "skip"
  );
  
  const shouldFetchAllRestaurants = (typeFilter === "all" || typeFilter === "restaurants") && (isMaster || !selectedAsset);
  const allRestaurantReservations = useQuery(
    api.domains.bookings.queries.getRestaurantReservations,
    shouldFetchAllRestaurants
      ? {
          paginationOpts: { numItems: 100, cursor: null },
          ...(statusFilter !== "all" && { status: statusFilter }),
        }
      : "skip"
  );
  
  const shouldFetchAllVehicles = (typeFilter === "all" || typeFilter === "vehicles") && (isMaster || !selectedAsset);
  const allVehicleBookings = useQuery(
    api.domains.bookings.queries.getVehicleBookings,
    shouldFetchAllVehicles
      ? {
          paginationOpts: { numItems: 100, cursor: null },
          ...(statusFilter !== "all" && { status: statusFilter }),
        }
      : "skip"
  );

  // Fetch bookings based on selected asset type
  const shouldFetchActivities = selectedAsset?.assetType === "activities";
  const activityBookings = useQuery(
    api.domains.bookings.queries.getActivityBookings,
    shouldFetchActivities ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );
  
  const shouldFetchEvents = selectedAsset?.assetType === "events";
  const eventBookings = useQuery(
    api.domains.bookings.queries.getEventBookings,
    shouldFetchEvents ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );
  
  const shouldFetchRestaurants = selectedAsset?.assetType === "restaurants";
  const restaurantReservations = useQuery(
    api.domains.bookings.queries.getRestaurantReservations,
    shouldFetchRestaurants ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedAsset && { organizationId: selectedAsset._id }),
    } : "skip"
  );
  
  const shouldFetchVehicles = selectedAsset?.assetType === "vehicles";
  const vehicleBookings = useQuery(
    api.domains.bookings.queries.getVehicleBookings,
    shouldFetchVehicles ? {
      paginationOpts: { numItems: 100, cursor: null },
      ...(statusFilter !== "all" && { status: statusFilter }),
      // Para veículos, não passamos organizationId pois queremos todos os veículos do partner
    } : "skip"
  );

  // Get current bookings based on asset type or all types
  const currentBookings = useMemo(() => {
    // Para usuários master, sempre mostrar todas as reservas independente do asset selecionado
    if (isMaster) {
      let allBookings: any[] = [];
      
      if (typeFilter === "all" || typeFilter === "activities") {
        allBookings = [...allBookings, ...(allActivityBookings?.page || []).map(b => ({...b, assetType: "activities"}))];
      }
      if (typeFilter === "all" || typeFilter === "events") {
        allBookings = [...allBookings, ...(allEventBookings?.page || []).map(b => ({...b, assetType: "events"}))];
      }
      if (typeFilter === "all" || typeFilter === "restaurants") {
        allBookings = [...allBookings, ...(allRestaurantReservations?.page || []).map(b => ({...b, assetType: "restaurants"}))];
      }
      if (typeFilter === "all" || typeFilter === "vehicles") {
        allBookings = [...allBookings, ...(allVehicleBookings?.page || []).map(b => ({...b, assetType: "vehicles"}))];
      }
      
      return allBookings;
    }
    
    // Para outros usuários, aplicar a lógica normal de filtro por asset
    if (selectedAsset) {
      // If asset is selected, show only bookings for that asset
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
    } else {
      // If no asset selected, show all bookings based on type filter
      let allBookings: any[] = [];
      
      if (typeFilter === "all" || typeFilter === "activities") {
        allBookings = [...allBookings, ...(allActivityBookings?.page || []).map(b => ({...b, assetType: "activities"}))];
      }
      if (typeFilter === "all" || typeFilter === "events") {
        allBookings = [...allBookings, ...(allEventBookings?.page || []).map(b => ({...b, assetType: "events"}))];
      }
      if (typeFilter === "all" || typeFilter === "restaurants") {
        allBookings = [...allBookings, ...(allRestaurantReservations?.page || []).map(b => ({...b, assetType: "restaurants"}))];
      }
      if (typeFilter === "all" || typeFilter === "vehicles") {
        allBookings = [...allBookings, ...(allVehicleBookings?.page || []).map(b => ({...b, assetType: "vehicles"}))];
      }
      
      return allBookings;
    }
  }, [isMaster, selectedAsset, typeFilter, activityBookings, eventBookings, restaurantReservations, vehicleBookings, allActivityBookings, allEventBookings, allRestaurantReservations, allVehicleBookings]);

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

  // Helper function to refresh bookings list  
  const refreshBookings = () => {
    // Convex queries are reactive and should update automatically
    // Just a small delay to ensure UI updates properly
    return new Promise(resolve => setTimeout(resolve, 200));
  };


  // Handle booking confirmation
  const handleConfirmBooking = async (booking: any) => {
    // Masters can confirm any booking, others need selectedAsset
    if (!isMaster && !selectedAsset) return;

    // Validate supplier selection
    if (!selectedSupplierId) {
      toast.error("Por favor, selecione um fornecedor antes de confirmar a reserva.");
      return;
    }

    try {
      // Check if booking has payment that requires capture
      const hasPaymentToCapture = booking.paymentStatus === "requires_capture" || 
                                 booking.status === "awaiting_confirmation";
      
      if (hasPaymentToCapture) {
        // Determine asset type from booking
        let assetType: "activity" | "event" | "restaurant" | "vehicle" | "package";
        if (booking.activityId) {
          assetType = "activity";
        } else if (booking.eventId) {
          assetType = "event";
        } else if (booking.restaurantId) {
          assetType = "restaurant";
        } else if (booking.vehicleId) {
          assetType = "vehicle";
        } else {
          assetType = "package";
        }
        
        // Use new approval flow
        await approveBooking({
          bookingId: booking._id,
          assetType: assetType,
          partnerNotes: partnerNotes || undefined,
        });
        
        toast.success("Reserva aprovada! Cliente pode realizar o pagamento agora.");
      } else {
        // Use legacy flow for bookings without payment capture
        // Determine asset type from booking for masters
        let assetTypeForQuery = selectedAsset?.assetType;
        if (isMaster && !selectedAsset) {
          if (booking.activityId) {
            assetTypeForQuery = "activities";
          } else if (booking.eventId) {
            assetTypeForQuery = "events";
          } else if (booking.restaurantId) {
            assetTypeForQuery = "restaurants";
          } else if (booking.vehicleId) {
            assetTypeForQuery = "vehicles";
          }
        }
        
        const assetDetails = await convex.query(api.domains.shared.queries.getAssetDetails, {
          assetId: booking.activityId || booking.eventId || booking.restaurantId || booking.vehicleId,
          assetType: assetTypeForQuery,
        });

        if (!assetDetails) {
          throw new Error("Não foi possível encontrar os detalhes do ativo da reserva.");
        }
        
        const assetInfo = {
          name: assetDetails.name,
          address: assetDetails.address,
          phone: assetDetails.phone,
          email: assetDetails.email,
          description: assetDetails.description,
        };

        switch (assetTypeForQuery) {
          case "activities":
            await confirmActivityBooking({
              bookingId: booking._id,
              supplierId: selectedSupplierId as any,
              partnerNotes: partnerNotes || undefined,
              assetInfo,
            });
            break;
          case "events":
            await confirmEventBooking({
              bookingId: booking._id,
              supplierId: selectedSupplierId as any,
              partnerNotes: partnerNotes || undefined,
              assetInfo,
            });
            break;
          case "restaurants":
            await confirmRestaurantReservation({
              bookingId: booking._id,
              supplierId: selectedSupplierId as any,
              partnerNotes: partnerNotes || undefined,
              assetInfo,
            });
            break;
          case "vehicles":
            await confirmVehicleBooking({
              bookingId: booking._id,
              supplierId: selectedSupplierId as any,
              partnerNotes: partnerNotes || undefined,
              assetInfo,
            });
            break;
        }
        
        toast.success("Reserva confirmada com sucesso!");
      }
      
      setShowConfirmDialog(false);
      setSelectedBooking(null);
      setPartnerNotes("");
      setSelectedSupplierId("");
    } catch (error) {
      toast.error("Erro ao confirmar reserva");
      console.error(error);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (booking: any) => {
    // Masters can cancel any booking, others need selectedAsset
    if (!isMaster && !selectedAsset) return;
    
    try {
      // Check if booking has payment that requires cancellation
      const hasPaymentToCancel = booking.paymentStatus === "requires_capture" || 
                                booking.status === "awaiting_confirmation";
      
      if (hasPaymentToCancel) {
        // Determine asset type from booking
        let assetType: "activity" | "event" | "restaurant" | "vehicle" | "package";
        if (booking.activityId) {
          assetType = "activity";
        } else if (booking.eventId) {
          assetType = "event";
        } else if (booking.restaurantId) {
          assetType = "restaurant";
        } else if (booking.vehicleId) {
          assetType = "vehicle";
        } else {
          assetType = "package";
        }
        
        // Use new payment cancellation flow
        await rejectBooking({
          bookingId: booking._id,
          assetType: assetType,
          reason: partnerNotes || "Cancelada pelo admin",
        });
        
        toast.success("Reserva cancelada e pagamento estornado com sucesso!");
      } else {
        // Use legacy flow for bookings without payment capture
        // Determine asset type from booking for masters
        let assetTypeForQuery = selectedAsset?.assetType;
        if (isMaster && !selectedAsset) {
          if (booking.activityId) {
            assetTypeForQuery = "activities";
          } else if (booking.eventId) {
            assetTypeForQuery = "events";
          } else if (booking.restaurantId) {
            assetTypeForQuery = "restaurants";
          } else if (booking.vehicleId) {
            assetTypeForQuery = "vehicles";
          }
        }
        
        switch (assetTypeForQuery) {
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
      }
      
      await refreshBookings();
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
      // Status antigos (compatibilidade)
      pending: { variant: "secondary" as const, label: "Pendente", icon: AlertCircle, color: "text-orange-600" },
      confirmed: { variant: "default" as const, label: "Confirmado", icon: CheckCircle, color: "text-green-600" },
      canceled: { variant: "destructive" as const, label: "Cancelado", icon: XCircle, color: "text-red-600" },
      completed: { variant: "outline" as const, label: "Concluído", icon: CheckCircle, color: "text-blue-600" },
      
      // Novos status
      draft: { variant: "secondary" as const, label: "Rascunho", icon: AlertCircle, color: "text-gray-600" },
      payment_pending: { variant: "secondary" as const, label: "Aguardando Pagamento", icon: AlertCircle, color: "text-yellow-600" },
      awaiting_confirmation: { variant: "secondary" as const, label: "Aguardando Confirmação", icon: AlertCircle, color: "text-orange-600" },
      requires_capture: { variant: "secondary" as const, label: "Aguardando Captura", icon: AlertCircle, color: "text-orange-600" },
      in_progress: { variant: "outline" as const, label: "Em Andamento", icon: CheckCircle, color: "text-blue-600" },
      no_show: { variant: "destructive" as const, label: "Não Compareceu", icon: XCircle, color: "text-red-600" },
      expired: { variant: "destructive" as const, label: "Expirada", icon: XCircle, color: "text-gray-600" },
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

  const getBookingTypeForVoucher = (assetType: string) => {
    switch (assetType) {
      case "restaurants":
        return "restaurant";
      case "events":
        return "event";
      case "activities":
        return "activity";
      case "vehicles":
        return "vehicle";
      case "accommodations":
        return "accommodation";
      default:
        return "package";
    }
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

  // Get count of bookings by type
  const getBookingCounts = () => {
    const allBookings = [
      ...(allActivityBookings?.page || []).map(b => ({...b, assetType: "activities"})),
      ...(allEventBookings?.page || []).map(b => ({...b, assetType: "events"})),
      ...(allRestaurantReservations?.page || []).map(b => ({...b, assetType: "restaurants"})),
      ...(allVehicleBookings?.page || []).map(b => ({...b, assetType: "vehicles"})),
    ];

    return {
      all: allBookings.length,
      activities: allBookings.filter(b => b.assetType === "activities").length,
      events: allBookings.filter(b => b.assetType === "events").length,
      restaurants: allBookings.filter(b => b.assetType === "restaurants").length,
      vehicles: allBookings.filter(b => b.assetType === "vehicles").length,
    };
  };

  const bookingCounts = getBookingCounts();

  // Get active filters count
  const activeFiltersCount = [statusFilter, typeFilter, searchTerm].filter(f => f && f !== "all").length;

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Design Minimalista */}
      <DashboardPageHeader
        title="Gerenciamento de Reservas"
        description={
          isMaster 
            ? "Como master, você visualiza TODAS as reservas do sistema independente do asset selecionado" 
            : selectedAsset 
              ? `Visualize e gerencie as reservas do ${selectedAsset.name}` 
              : "Visualize e gerencie todas as reservas do sistema"
        }
        icon={Calendar}
      >
        {selectedAsset && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
            {getAssetIcon(selectedAsset.assetType)}
            <span className="text-sm font-medium text-blue-700">{selectedAsset.name}</span>
          </div>
        )}
      </DashboardPageHeader>

      {/* Asset Selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {isMaster && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ⚡ Como usuário <strong>Master</strong>, você sempre vê TODAS as reservas do sistema, independente do asset selecionado abaixo.
              </p>
            </div>
          )}
          <AssetSelector compact={true} showDetails={false} />
        </CardContent>
      </Card>

      {/* Show content */}
      <>
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total de Reservas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
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
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
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
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome do cliente, email, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {!selectedAsset && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className={`w-[200px] ${typeFilter !== "all" ? "bg-blue-50 border-blue-200" : ""}`}>
                    <SelectValue placeholder="Tipo de Reserva" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Todos os Tipos</span>
                        <Badge variant="secondary" className="ml-2">
                          {bookingCounts.all}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="activities">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Atividades</span>
                        <Badge variant="secondary" className="ml-2">
                          {bookingCounts.activities}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="restaurants">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Restaurantes</span>
                        <Badge variant="secondary" className="ml-2">
                          {bookingCounts.restaurants}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="vehicles">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Veículos</span>
                        <Badge variant="secondary" className="ml-2">
                          {bookingCounts.vehicles}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="events">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Eventos</span>
                        <Badge variant="secondary" className="ml-2">
                          {bookingCounts.events}
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-[200px] ${statusFilter !== "all" ? "bg-blue-50 border-blue-200" : ""}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="awaiting_confirmation">Aguardando Confirmação</SelectItem>
                  <SelectItem value="requires_capture">Aguardando Captura</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              {isMaster ? (
                <>
                  Todas as Reservas do Sistema (Master)
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    🔥 Acesso Master
                  </Badge>
                  {typeFilter !== "all" && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      {typeFilter === "activities" ? "Atividades" : 
                       typeFilter === "restaurants" ? "Restaurantes" :
                       typeFilter === "vehicles" ? "Veículos" : "Eventos"}
                    </Badge>
                  )}
                </>
              ) : selectedAsset ? (
                <>
                  Reservas - {selectedAsset.name}
                  {getAssetIcon(selectedAsset.assetType)}
                </>
              ) : (
                <>
                  Todas as Reservas
                  {typeFilter !== "all" && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      {typeFilter === "activities" ? "Atividades" : 
                       typeFilter === "restaurants" ? "Restaurantes" :
                       typeFilter === "vehicles" ? "Veículos" : "Eventos"}
                    </Badge>
                  )}
                </>
              )}
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
                  <Calendar className="h-8 w-8 text-muted-foreground" />
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
                      <div className="flex flex-wrap gap-3 items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {!selectedAsset && booking.assetType && getAssetIcon(booking.assetType)}
                              <h3 className="font-semibold text-foreground">
                                {booking.assetType === "restaurants" || selectedAsset?.assetType === "restaurants"
                                  ? `Mesa para ${booking.partySize || booking.participants} pessoas`
                                  : booking.activityTitle || booking.eventTitle || booking.vehicleName || "Reserva"
                                }
                              </h3>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {formatBookingDate(booking, booking.assetType || selectedAsset?.assetType || "activity")}
                            </div>
                            
                            {shouldShowCustomerInfo(booking.status) ? (
                              <>
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
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm">Informações protegidas até confirmação</span>
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
                          <BookingDetailsModal
                            data={booking}
                            userRole={user?.role}
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                title="Ver detalhes completos"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            }
                          />

                          {/* Chat button */}
                          <BookingChatButton
                            bookingId={booking._id}
                            userId={booking.userId}
                            assetType={booking.assetType || selectedAsset?.assetType || "activity"}
                            assetName={
                              booking.assetType === "restaurants" || selectedAsset?.assetType === "restaurants"
                                ? `Mesa para ${booking.partySize || booking.participants} pessoas`
                                : booking.activityTitle || booking.eventTitle || booking.vehicleName || "Reserva"
                            }
                            variant="outline"
                            size="sm"
                            showLabel={false}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          />
                          
                          {/* Voucher button - component handles voucher existence check */}
                          <VoucherDownloadButton
                            bookingId={booking._id}
                            bookingType={getBookingTypeForVoucher(booking.assetType || selectedAsset?.assetType || "activity")}
                            variant="outline"
                            size="sm"
                            showIcon={true}
                            showLabel={false}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          />
                          
                          {(booking.status === "pending" || booking.status === "awaiting_confirmation" || booking.paymentStatus === "requires_capture") && (
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
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selecione o fornecedor responsável pela reserva</p>
            </div>

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
            <Button onClick={() => handleConfirmBooking(selectedBooking)} className="bg-green-600 hover:bg-green-700 text-white">
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