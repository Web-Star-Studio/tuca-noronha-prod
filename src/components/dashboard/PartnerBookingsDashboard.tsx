'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Search, 
  Download,
  RefreshCcw,
  Eye,
  MessageSquare,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PartnerBookingsDashboardProps {
  partnerId: Id<"users">;
}

export default function PartnerBookingsDashboard({ partnerId }: PartnerBookingsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Queries and mutations
  const bookings = useQuery(api.domains.stripe.queries.getPartnerBookingsWithPayments, {
    partnerId,
    limit: 100,
  });

  const confirmBooking = useMutation(api.domains.bookings.mutations.confirmBooking);
  const cancelWithRefund = useAction(api.domains.stripe.actions.cancelBookingWithRefund);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter(booking => {
      const matchesSearch = booking.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesPaymentStatus = paymentStatusFilter === "all" || booking.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  }, [bookings, searchTerm, statusFilter, paymentStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!bookings) return { total: 0, paid: 0, pending: 0, revenue: 0 };

    const paid = bookings.filter(b => b.paymentStatus === "succeeded").length;
    const pending = bookings.filter(b => b.paymentStatus === "pending").length;
    const revenue = bookings
      .filter(b => b.paymentStatus === "succeeded")
      .reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      total: bookings.length,
      paid,
      pending,
      revenue
    };
  }, [bookings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      canceled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      succeeded: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      canceled: "bg-gray-100 text-gray-800",
      refunded: "bg-orange-100 text-orange-800",
    };
    return colors[status || "pending"] || "bg-gray-100 text-gray-800";
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activity: 'Atividade',
      event: 'Evento',
      restaurant: 'Restaurante',
      accommodation: 'Hospedagem',
      vehicle: 'Veículo',
      package: 'Pacote'
    };
    return labels[type] || type;
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await confirmBooking({
        bookingId,
        partnerNotes: "Confirmado pelo parceiro via dashboard",
      });
      toast.success("Reserva confirmada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao confirmar reserva");
    }
  };

  const handleCancelWithRefund = async (bookingId: string) => {
    try {
      const result = await cancelWithRefund({
        bookingId,
        reason: "Cancelado pelo parceiro",
        cancelledBy: partnerId,
      });

      if (result.success) {
        toast.success("Reserva cancelada e reembolso processado!");
      } else {
        toast.error(result.error || "Erro ao processar cancelamento");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar reserva");
    }
  };

  const openReceiptUrl = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  if (!bookings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Reservas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagas</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, asset ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="succeeded">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Tabs defaultValue="paid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="paid">Reservas Pagas ({stats.paid})</TabsTrigger>
          <TabsTrigger value="pending">Aguardando Pagamento ({stats.pending})</TabsTrigger>
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4">
          <div className="space-y-4">
            {filteredBookings
              .filter(b => b.paymentStatus === "succeeded")
              .map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onConfirm={handleConfirmBooking}
                  onCancelWithRefund={handleCancelWithRefund}
                  onViewReceipt={openReceiptUrl}
                  formatCurrency={formatCurrency}
                  getStatusColor={getStatusColor}
                  getPaymentStatusColor={getPaymentStatusColor}
                  getAssetTypeLabel={getAssetTypeLabel}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {filteredBookings
              .filter(b => b.paymentStatus === "pending")
              .map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onConfirm={handleConfirmBooking}
                  onCancelWithRefund={handleCancelWithRefund}
                  onViewReceipt={openReceiptUrl}
                  formatCurrency={formatCurrency}
                  getStatusColor={getStatusColor}
                  getPaymentStatusColor={getPaymentStatusColor}
                  getAssetTypeLabel={getAssetTypeLabel}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onConfirm={handleConfirmBooking}
                onCancelWithRefund={handleCancelWithRefund}
                onViewReceipt={openReceiptUrl}
                formatCurrency={formatCurrency}
                getStatusColor={getStatusColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getAssetTypeLabel={getAssetTypeLabel}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhuma reserva encontrada com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// BookingCard Component
interface BookingCardProps {
  booking: any;
  onConfirm: (bookingId: string) => void;
  onCancelWithRefund: (bookingId: string) => void;
  onViewReceipt: (receiptUrl: string) => void;
  formatCurrency: (value: number) => string;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status?: string) => string;
  getAssetTypeLabel: (type: string) => string;
}

function BookingCard({
  booking,
  onConfirm,
  onCancelWithRefund,
  onViewReceipt,
  formatCurrency,
  getStatusColor,
  getPaymentStatusColor,
  getAssetTypeLabel,
}: BookingCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{getAssetTypeLabel(booking.assetType)}</Badge>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status === 'pending' ? 'Pendente' :
                   booking.status === 'confirmed' ? 'Confirmado' :
                   booking.status === 'canceled' ? 'Cancelado' :
                   booking.status === 'completed' ? 'Concluído' :
                   booking.status === 'refunded' ? 'Reembolsado' : booking.status}
                </Badge>
                {booking.paymentStatus && (
                  <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                    {booking.paymentStatus === 'succeeded' ? 'Pago' :
                     booking.paymentStatus === 'pending' ? 'Pagamento Pendente' :
                     booking.paymentStatus === 'failed' ? 'Pagamento Falhou' :
                     booking.paymentStatus === 'refunded' ? 'Reembolsado' : booking.paymentStatus}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg">{booking.assetName}</h3>
              <p className="text-sm text-gray-600">Cliente: {booking.customerName}</p>
              <p className="text-sm text-gray-500">
                Código: {booking.confirmationCode} • {formatDistanceToNow(booking.createdAt, { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-semibold">{formatCurrency(booking.totalPrice)}</p>
              {booking.refunded && booking.refundAmount && (
                <p className="text-sm text-red-600">Reembolsado: {formatCurrency(booking.refundAmount)}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>

            {booking.receiptUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReceipt(booking.receiptUrl)}
              >
                <Download className="h-4 w-4 mr-1" />
                Comprovante
              </Button>
            )}

            {booking.status === "pending" && booking.paymentStatus === "succeeded" && (
              <Button
                size="sm"
                onClick={() => onConfirm(booking._id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
            )}

            {(booking.status === "pending" || booking.status === "confirmed") && 
             booking.paymentStatus === "succeeded" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancelWithRefund(booking._id)}
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Cancelar c/ Refund
              </Button>
            )}
          </div>

          {/* Details */}
          {showDetails && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">Stripe Payment Intent:</span></p>
                  <p className="text-gray-600 font-mono text-xs break-all">
                    {booking.stripePaymentIntentId || 'N/A'}
                  </p>
                </div>
                <div>
                  <p><span className="font-medium">Data de Criação:</span></p>
                  <p className="text-gray-600">
                    {new Date(booking.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {booking.refunded && booking.refunds && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Reembolsos</h4>
                  {booking.refunds.map((refund: any, index: number) => (
                    <div key={index} className="text-sm text-orange-700">
                      <p>• {formatCurrency(refund.amount)} - {refund.reason} ({refund.status})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 