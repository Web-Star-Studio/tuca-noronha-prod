"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, DollarSign, User } from "lucide-react";

interface AdminReservationEditModalProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AdminReservationEditModal({ 
  reservation, 
  open, 
  onOpenChange,
  onUpdate 
}: AdminReservationEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  
  // Form state
  const [reservationData, setReservationData] = useState({
    startDate: reservation.reservationData?.startDate,
    endDate: reservation.reservationData?.endDate,
    guests: reservation.reservationData?.guests,
    specialRequests: reservation.reservationData?.specialRequests || "",
    ...reservation.reservationData
  });
  
  const [paymentData, setPaymentData] = useState({
    paymentStatus: reservation.paymentStatus,
    totalAmount: reservation.totalAmount,
    paidAmount: reservation.paidAmount || 0,
    paymentMethod: reservation.paymentMethod || "",
    paymentNotes: reservation.paymentNotes || ""
  });
  
  const [status, setStatus] = useState(reservation.status);
  const [adminNotes, setAdminNotes] = useState(reservation.adminNotes || "");
  
  const updateReservation = useMutation(api.domains.adminReservations.mutations.updateAdminReservation);
  
  const handleSubmit = async () => {
    if (!changeReason.trim()) {
      toast.error("Por favor, forneça um motivo para a alteração");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateReservation({
        id: reservation._id,
        reservationData: {
          ...reservationData,
          startDate: reservationData.startDate ? new Date(reservationData.startDate).getTime() : undefined,
          endDate: reservationData.endDate ? new Date(reservationData.endDate).getTime() : undefined
        },
        paymentStatus: paymentData.paymentStatus as any,
        totalAmount: paymentData.totalAmount,
        paidAmount: paymentData.paidAmount,
        paymentMethod: paymentData.paymentMethod,
        paymentNotes: paymentData.paymentNotes,
        status: status as any,
        adminNotes,
        changeReason
      });
      
      toast.success("Reserva atualizada com sucesso!");
      onUpdate();
      onOpenChange(false);
    } catch {
      console.error("Error updating reservation:", error);
      toast.error("Erro ao atualizar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderDateFields = () => {
    switch (reservation.assetType) {
      case "activities":
      case "events":
      case "restaurants":
        return (
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reservationData.startDate ? 
                      format(new Date(reservationData.startDate), "PPP", { locale: ptBR }) : 
                      "Selecione a data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reservationData.startDate ? new Date(reservationData.startDate) : undefined}
                    onSelect={(date) => setReservationData({
                      ...reservationData,
                      startDate: date?.toISOString()
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {(reservation.assetType === "activities" || reservation.assetType === "restaurants") && (
              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={reservationData.time || ""}
                  onChange={(e) => setReservationData({
                    ...reservationData,
                    time: e.target.value
                  })}
                />
              </div>
            )}
          </div>
        );
        
      case "vehicles":
      case "accommodations":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{reservation.assetType === "vehicles" ? "Data Início" : "Check-in"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reservationData.startDate ? 
                      format(new Date(reservationData.startDate), "PPP", { locale: ptBR }) : 
                      "Selecione"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reservationData.startDate ? new Date(reservationData.startDate) : undefined}
                    onSelect={(date) => setReservationData({
                      ...reservationData,
                      startDate: date?.toISOString()
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>{reservation.assetType === "vehicles" ? "Data Fim" : "Check-out"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reservationData.endDate ? 
                      format(new Date(reservationData.endDate), "PPP", { locale: ptBR }) : 
                      "Selecione"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reservationData.endDate ? new Date(reservationData.endDate) : undefined}
                    onSelect={(date) => setReservationData({
                      ...reservationData,
                      endDate: date?.toISOString()
                    })}
                    disabled={(date) => date < new Date(reservationData.startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
    }
    return null;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Reserva {reservation.confirmationCode}</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da reserva. Todas as alterações são registradas.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div>
              <Label>Viajante</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <User className="w-4 h-4" />
                <span>{reservation.traveler?.name} ({reservation.traveler?.email})</span>
              </div>
            </div>
            
            {renderDateFields()}
            
            <div>
              <Label>Número de Pessoas/Participantes</Label>
              <Input
                type="number"
                value={reservationData.guests || reservationData.participants || ""}
                onChange={(e) => setReservationData({
                  ...reservationData,
                  guests: parseInt(e.target.value) || 0,
                  participants: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div>
              <Label>Solicitações Especiais</Label>
              <Textarea
                value={reservationData.specialRequests}
                onChange={(e) => setReservationData({
                  ...reservationData,
                  specialRequests: e.target.value
                })}
                placeholder="Adicione solicitações especiais..."
              />
            </div>
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-4">
            <div>
              <Label>Status do Pagamento</Label>
              <Select
                value={paymentData.paymentStatus}
                onValueChange={(value) => setPaymentData({
                  ...paymentData,
                  paymentStatus: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Pago</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="deferred">A Pagar</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Total</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-10"
                    value={paymentData.totalAmount}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      totalAmount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Valor Pago</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-10"
                    value={paymentData.paidAmount}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      paidAmount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label>Método de Pagamento</Label>
              <Input
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  paymentMethod: e.target.value
                })}
                placeholder="Ex: Cartão de crédito, PIX, etc."
              />
            </div>
            
            <div>
              <Label>Observações sobre Pagamento</Label>
              <Textarea
                value={paymentData.paymentNotes}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  paymentNotes: e.target.value
                })}
                placeholder="Adicione observações sobre o pagamento..."
              />
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <div>
              <Label>Status da Reserva</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Notas Administrativas</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione notas administrativas..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Label>Motivo da Alteração (obrigatório)</Label>
          <Textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Descreva o motivo desta alteração..."
            className="mt-2"
            required
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !changeReason.trim()}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 