"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
 
  Edit, 
  Eye, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Plus,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { AdminReservationDetailsModal } from "@/components/dashboard/admin-reservations/AdminReservationDetailsModal";
import { AdminReservationEditModal } from "@/components/dashboard/admin-reservations/AdminReservationEditModal";

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

export default function AdminReservasPage() {
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Query reservations
  const reservationsQuery = useQuery(
    api.domains.adminReservations.queries.listAdminReservations,
    {
      status: statusFilter !== "all" ? statusFilter as any : undefined,
      paymentStatus: paymentFilter !== "all" ? paymentFilter as any : undefined,
      limit: 50
    }
  );
  
  // Query stats
  const statsQuery = useQuery(
    api.domains.adminReservations.queries.getAdminReservationStats,
    {}
  );
  
  // Mutations
  const confirmReservation = useMutation(api.domains.adminReservations.mutations.confirmAdminReservation);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The query will automatically refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const handleConfirmReservation = async (id: string) => {
    try {
      await confirmReservation({ id: id as any });
      toast.success("Reserva confirmada com sucesso!");
    } catch {
      toast.error("Erro ao confirmar reserva");
    }
  };
  
  
  const filteredReservations = reservationsQuery?.reservations?.filter(reservation => {
    const matchesSearch = !searchTerm || 
      reservation.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.traveler?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.traveler?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Reservas Administrativas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as reservas criadas administrativamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link href="/admin/dashboard/nova-reserva">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Reserva
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      {statsQuery && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsQuery.totalReservations}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsQuery.byStatus?.confirmed || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statsQuery.byStatus?.draft || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {statsQuery.totalRevenue?.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar por código, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="no_show">Não Compareceu</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Pagamentos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Pago</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="deferred">A Pagar</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
          <CardDescription>
            {filteredReservations?.length || 0} reservas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!filteredReservations?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma reserva encontrada
              </div>
            ) : (
              filteredReservations.map((reservation) => {
                const statusConfig = STATUS_CONFIG[reservation.status as keyof typeof STATUS_CONFIG];
                const paymentConfig = PAYMENT_STATUS_CONFIG[reservation.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div
                    key={reservation._id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-wrap gap-3 items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {reservation.confirmationCode}
                          </h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <Badge className={paymentConfig.color}>
                            {paymentConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {reservation.traveler?.name || "Nome não disponível"}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {reservation.assetType}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(reservation.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">
                            Valor: R$ {reservation.totalAmount.toFixed(2)}
                          </span>
                          {user && (
                            <span className="text-muted-foreground">
                              Criada por: {reservation.admin?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {reservation.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleConfirmReservation(reservation._id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Details Modal */}
      {selectedReservation && (
        <AdminReservationDetailsModal
          reservation={selectedReservation}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />
      )}
      
      {/* Edit Modal */}
      {selectedReservation && (
        <AdminReservationEditModal
          reservation={selectedReservation}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onUpdate={() => {
            setShowEditModal(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
} 