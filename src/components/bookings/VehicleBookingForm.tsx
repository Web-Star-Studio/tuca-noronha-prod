"use client";

import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCustomerInfo } from "@/lib/hooks/useCustomerInfo";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CouponValidator from "@/components/coupons/CouponValidator";


interface VehicleBookingFormProps {
  vehicleId: Id<"vehicles">;
  estimatedPricePerDay: number; // ALTERADO: valor estimado
  vehicle?: {
    acceptsOnlinePayment?: boolean;
    requiresUpfrontPayment?: boolean;
  };
}

export function VehicleBookingForm({ vehicleId, estimatedPricePerDay, className }: VehicleBookingFormProps & { className?: string }) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 3));
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");
  
  // useCurrentUser removido (não utilizado)

  // Get current user
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  // Calculate total days and estimated price
  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const estimatedTotalPrice = totalDays * estimatedPricePerDay;

  // Calculate final price with coupon (baseado no estimado)
  const getFinalPrice = () => {
    return appliedCoupon ? appliedCoupon.finalAmount : estimatedTotalPrice;
  };

  // Get discount amount
  const getDiscountAmount = () => {
    return appliedCoupon ? appliedCoupon.discountAmount : 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Handle coupon application
  const handleCouponApplied = (coupon: any) => {
    setAppliedCoupon(coupon);
  };

  // Handle coupon removal
  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  // NOVO: Usar mutation de solicitação de reserva
  const requestBooking = useMutation(api.domains.vehicles.bookingMutations.requestVehicleBooking);

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast.error("Data inválida", {
        description: "Por favor, selecione as datas de retirada e devolução.",
      });
      return;
    }

    // Validate customer info
    if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
      toast.error("Informações obrigatórias", {
        description: "Por favor, preencha nome, email e telefone.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Email inválido", {
        description: "Por favor, insira um email válido.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!currentUser) {
        toast.error("Usuário não autenticado", {
          description: "Por favor, faça login para realizar uma reserva.",
        });
        return;
      }
      
      // NOVO FLUXO: Apenas solicita a reserva, SEM pagamento
      const result = await requestBooking({
        vehicleId,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        pickupLocation: pickupLocation.trim() || undefined,
        notes: notes.trim() || undefined,
        customerInfo,
      });

      toast.success("✅ Solicitação enviada com sucesso!", {
        description: `Código: ${result.confirmationCode}. O valor estimado é ${formatCurrency(result.estimatedPrice)}. Aguarde a confirmação do admin com o valor final.`,
        duration: 8000,
      });

      // Limpar formulário
      setCustomerInfo({ name: "", email: "", phone: "" });
      setPickupLocation("");
      setNotes("");
      setAppliedCoupon(null);
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      toast.error("Erro ao fazer reserva", {
        description: "Ocorreu um erro ao processar sua reserva. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Solicitar Reserva</h3>
            <p className="text-sm text-yellow-600 font-medium mt-1">
              💡 A partir de {formatCurrency(estimatedPricePerDay)}/diária
            </p>
            <p className="text-xs text-gray-500 mt-1">
              O valor final será confirmado pelo administrador após análise da sua solicitação.
            </p>
          </div>

          <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pickup-date">Data de retirada</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="pickup-date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="return-date">Data de devolução</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="return-date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              disabled={(date) => date < (startDate || new Date())}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Customer Information */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-lg">Informações do Solicitante</h3>
        
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nome completo *</Label>
          <Input
            id="customer-name"
            type="text"
            placeholder="Seu nome completo"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email *</Label>
          <Input
            id="customer-email"
            type="email"
            placeholder="seu@email.com"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Telefone *</Label>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup-location">Local de retirada (opcional)</Label>
          <Input
            id="pickup-location"
            type="text"
            placeholder="Endereço ou ponto de referência"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-notes">Observações (opcional)</Label>
          <Textarea
            id="booking-notes"
            placeholder="Alguma informação adicional sobre sua reserva..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Coupon validator */}
      {startDate && endDate && estimatedTotalPrice > 0 && (
        <CouponValidator
          assetType="vehicle"
          assetId={vehicleId}
          orderValue={estimatedTotalPrice}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      )}

      {/* Estimated Price summary */}
      {startDate && endDate && estimatedTotalPrice > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-200 p-4 space-y-3 bg-yellow-50">
          <h4 className="text-sm font-semibold text-yellow-800">📊 Estimativa de Valor</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Valor base estimado ({totalDays} diárias)</span>
            <span className="font-medium">{formatCurrency(estimatedTotalPrice)}</span>
          </div>
          {getDiscountAmount() > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Desconto aplicado</span>
              <span>-{formatCurrency(getDiscountAmount())}</span>
            </div>
          )}
          <div className="border-t border-yellow-300 pt-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-yellow-900">Total Estimado</span>
            <span className="text-base font-bold text-yellow-900">{formatCurrency(getFinalPrice())}</span>
          </div>
          <p className="text-xs text-yellow-700 bg-white border border-yellow-200 rounded p-2">
            <strong>⚠️ Importante:</strong> Este é um valor estimado. O valor final será confirmado pelo administrador após análise da sua solicitação. Não haverá cobrança agora.
          </p>
        </div>
      )}

            <Button 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleBooking}
              disabled={
                isLoading || 
                !startDate || 
                !endDate || 
                !customerInfo.name.trim() || 
                !customerInfo.email.trim() || 
                !customerInfo.phone.trim()
              }
            >
              {isLoading ? "Enviando solicitação..." : "🚗 Solicitar Reserva"}
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 
