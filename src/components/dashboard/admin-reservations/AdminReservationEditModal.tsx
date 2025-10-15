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
    } catch (error) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto space-y-6">
        <DialogHeader>
          <DialogTitle>Editar Reserva {reservation.confirmationCode}</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da reserva. Todas as alterações são registradas.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <TabsTrigger value="details" className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="payment" className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Pagamento
            </TabsTrigger>
            <TabsTrigger value="status" className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="space-y-2">
                <Label>Viajante</Label>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <User className="h-4 w-4 text-slate-500" />
                  <span>{reservation.traveler?.name} ({reservation.traveler?.email})</span>
                </div>
              </div>

              {renderDateFields()}

              <div className="grid gap-2">
                <Label>Número de pessoas / participantes</Label>
                <Input
                  type="number"
                  value={reservationData.guests || reservationData.participants || ""}
                  onChange={(e) => setReservationData({
                    ...reservationData,
                    guests: parseInt(e.target.value) || 0,
                    participants: parseInt(e.target.value) || 0
                  })}
                  min={1}
                />
              </div>

              <div className="grid gap-2">
                <Label>Solicitações especiais</Label>
                <Textarea
                  value={reservationData.specialRequests}
                  onChange={(e) => setReservationData({
                    ...reservationData,
                    specialRequests: e.target.value
                  })}
                  placeholder="Registre orientações passadas pelo cliente"
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-4">
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-2">
                <Label>Status do pagamento</Label>
                <Select
                  value={paymentData.paymentStatus}
                  onValueChange={(value) => setPaymentData({
                    ...paymentData,
                    paymentStatus: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Pago</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="deferred">A pagar</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Valor total</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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

                <div className="grid gap-2">
                  <Label>Valor pago</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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

              <div className="grid gap-2">
                <Label>Método de pagamento</Label>
                <Input
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    paymentMethod: e.target.value
                  })}
                  placeholder="Ex.: cartão de crédito, PIX, transferência"
                />
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={paymentData.paymentNotes}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    paymentNotes: e.target.value
                  })}
                  placeholder="Registre combinações com o cliente ou exceções"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-2">
                <Label>Status da reserva</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="no_show">Não compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Notas administrativas</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Compartilhe detalhes relevantes com a equipe interna"
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-2">
          <Label>Motivo da alteração</Label>
          <Textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Informe o contexto que levou à atualização desta reserva"
            required
          />
          <p className="text-xs text-slate-500">
            Essa informação aparece no histórico para auditoria.
          </p>
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
