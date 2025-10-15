"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Calendar, MapPin, User, Mail, Phone, DollarSign, CheckCircle, XCircle, Car } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

export default function VehicleBookingRequestsPage() {
  const requests = useQuery(api.domains.vehicles.getPendingBookingRequests);
  const confirmBooking = useMutation(api.domains.vehicles.confirmBookingWithPrice);
  const rejectBooking = useMutation(api.domains.vehicles.rejectBookingRequest);

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [finalPrice, setFinalPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleOpenConfirm = (booking: any) => {
    setSelectedBooking(booking);
    setFinalPrice(booking.estimatedPrice.toString());
    setAdminNotes("");
    setShowConfirmDialog(true);
  };

  const handleOpenReject = (booking: any) => {
    setSelectedBooking(booking);
    setAdminNotes("");
    setShowRejectDialog(true);
  };

  const handleConfirm = async () => {
    if (!selectedBooking || !finalPrice || parseFloat(finalPrice) <= 0) {
      toast.error("Insira um valor final válido");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmBooking({
        bookingId: selectedBooking._id,
        finalPrice: parseFloat(finalPrice),
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success("Reserva confirmada com sucesso!", {
        description: "O cliente foi notificado e tem 24h para realizar o pagamento.",
      });
      setShowConfirmDialog(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Erro ao confirmar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !adminNotes.trim()) {
      toast.error("Insira um motivo para a rejeição");
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectBooking({
        bookingId: selectedBooking._id,
        adminNotes: adminNotes.trim(),
      });
      toast.success("Reserva rejeitada", {
        description: "O cliente foi notificado.",
      });
      setShowRejectDialog(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Erro ao rejeitar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requests === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Solicitações de Reserva de Veículos</h1>
        <p className="text-gray-600">Gerencie as solicitações pendentes de aprovação</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Nenhuma solicitação pendente</h2>
            <p className="text-gray-500">Todas as solicitações foram processadas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((booking) => (
            <Card key={booking._id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">
                      {booking.vehicle?.name || "Veículo"}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Código: {booking.confirmationCode} • Solicitado em {formatDate(booking.requestedAt)}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Detalhes da Reserva */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700">Detalhes da Reserva</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Retirada:</span>
                        <span className="font-medium">{formatDate(booking.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Devolução:</span>
                        <span className="font-medium">{formatDate(booking.endDate)}</span>
                      </div>
                      {booking.pickupLocation && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <span className="text-gray-600">Local:</span>
                          <span className="font-medium">{booking.pickupLocation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm pt-2 border-t">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">Valor Estimado:</span>
                        <span className="font-bold text-green-600">{formatCurrency(booking.estimatedPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Cliente */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700">Dados do Cliente</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Nome:</span>
                        <span className="font-medium">{booking.user?.name || booking.customerInfo?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{booking.user?.email || booking.customerInfo?.email}</span>
                      </div>
                      {booking.customerInfo?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Telefone:</span>
                          <span className="font-medium">{booking.customerInfo.phone}</span>
                        </div>
                      )}
                    </div>

                    {booking.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">Observações:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button
                    onClick={() => handleOpenConfirm(booking)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar com Valor
                  </Button>
                  <Button
                    onClick={() => handleOpenReject(booking)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Defina o valor final e confirme a reserva. O cliente terá 24 horas para realizar o pagamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="finalPrice">Valor Final (R$) *</Label>
              <Input
                id="finalPrice"
                type="number"
                step="0.01"
                min="0"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor estimado: {selectedBooking && formatCurrency(selectedBooking.estimatedPrice)}
              </p>
            </div>

            <div>
              <Label htmlFor="adminNotes">Mensagem para o cliente (opcional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ex: Valor confirmado. Inclui seguro completo..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Reserva</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O cliente será notificado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="rejectReason">Motivo da Rejeição *</Label>
            <Textarea
              id="rejectReason"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ex: Veículo não disponível nas datas solicitadas..."
              rows={4}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleReject} disabled={isSubmitting} variant="destructive">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rejeitar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
