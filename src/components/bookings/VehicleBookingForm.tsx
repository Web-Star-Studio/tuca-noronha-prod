"use client";

import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { useMutation, useQuery, useAction } from "convex/react";
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
import { StripeFeesDisplay } from "@/components/payments/StripeFeesDisplay";


interface VehicleBookingFormProps {
  vehicleId: Id<"vehicles">;
  pricePerDay: number;
  vehicle?: {
    acceptsOnlinePayment?: boolean;
    requiresUpfrontPayment?: boolean;
  };
}

export function VehicleBookingForm({ vehicleId, pricePerDay, vehicle, className }: VehicleBookingFormProps & { className?: string }) {
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

  // Calculate total days and price
  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const totalPrice = totalDays * pricePerDay;

  // Calculate final price with coupon
  const getFinalPrice = () => {
    return appliedCoupon ? appliedCoupon.finalAmount : totalPrice;
  };

  // Get discount amount
  const getDiscountAmount = () => {
    return appliedCoupon ? appliedCoupon.discountAmount : 0;
  };

  // Handle coupon application
  const handleCouponApplied = (coupon: any) => {
    setAppliedCoupon(coupon);
  };

  // Handle coupon removal
  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  // Create booking mutation - using the correct one from bookings domain
  const createBooking = useMutation(api.domains.bookings.mutations.createVehicleBooking);
  const createCheckoutSession = useAction(api.domains.stripe.actions.createCheckoutSession);

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
      
      // 1. Create the booking first
      const result = await createBooking({
        vehicleId,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        customerInfo,
        pickupLocation: pickupLocation.trim() || undefined,
        notes: notes.trim() || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      toast.success("Reserva criada com sucesso!", {
        description: `Código de confirmação: ${result.confirmationCode}`,
      });

      // 2. If vehicle requires payment, create checkout session
      if (vehicle?.acceptsOnlinePayment && vehicle?.requiresUpfrontPayment && totalPrice > 0) {
        try {
          console.log("🔄 Criando checkout session para veículo:", {
            bookingId: result.bookingId,
            vehicleId,
            totalPrice,
          });

          const checkoutSession = await createCheckoutSession({
            bookingId: result.bookingId,
            assetType: "vehicle",
            successUrl: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/booking/cancel`,
            couponCode: appliedCoupon?.code,
            discountAmount: getDiscountAmount(),
            originalAmount: totalPrice,
            finalAmount: getFinalPrice(),
          });

          if (checkoutSession.success && checkoutSession.sessionUrl) {
            toast.success("Redirecionando para pagamento...", {
              description: "Você será levado para o checkout seguro. O pagamento será autorizado e cobrado após aprovação.",
            });

            // Small delay to show the toast, then redirect
            setTimeout(() => {
              window.location.href = checkoutSession.sessionUrl;
            }, 1500);

            return; // Don't proceed further if redirecting
          } else {
            throw new Error(checkoutSession.error || "Erro ao criar sessão de pagamento");
          }
        } catch (paymentError) {
          console.error("💥 Erro ao criar payment link:", paymentError);
          toast.error("Reserva criada, mas erro no pagamento", {
            description: paymentError instanceof Error ? paymentError.message : "Entre em contato conosco para finalizar o pagamento",
          });
        }
      } else {
        toast.success("Reserva solicitada com sucesso!", {
          description: "Em breve entraremos em contato para confirmar sua reserva.",
        });
      }

      // Redirect to confirmation page or user bookings
      // router.push("/reservas");
    } catch {
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
            <h3 className="text-xl font-bold text-gray-900">Reserve este veículo</h3>
            <p className="text-sm text-gray-500 mt-1">
              R$ {pricePerDay.toFixed(2)} por diária
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
      {startDate && endDate && totalPrice > 0 && (
        <CouponValidator
          assetType="vehicle"
          assetId={vehicleId}
          baseAmount={totalPrice}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      )}

      {/* Price summary with Stripe fees */}
      {startDate && endDate && (
        <StripeFeesDisplay 
          baseAmount={totalPrice}
          discountAmount={getDiscountAmount()}
          className="mt-4"
        />
      )}

      {/* Payment Info - show if requires payment */}
      {vehicle?.acceptsOnlinePayment && vehicle?.requiresUpfrontPayment && totalPrice > 0 && (
        <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
          Seu pagamento será autorizado e cobrado apenas após aprovação da reserva pelo parceiro.
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
              {isLoading ? "Processando..." : "Reservar agora"}
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 