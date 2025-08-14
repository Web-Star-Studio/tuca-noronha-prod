"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Clock, Plus, Minus, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCustomerInfo } from "@/lib/hooks/useCustomerInfo";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formStyles } from "@/lib/ui-config";
import CouponValidator from "@/components/coupons/CouponValidator";
import { StripeFeesDisplay } from "@/components/payments/StripeFeesDisplay";


interface RestaurantReservationFormProps {
  restaurantId: Id<"restaurants">;
  restaurant: {
    name: string;
    address: {
      street: string;
      neighborhood: string;
      city: string;
    };
    maximumPartySize: number;
    acceptsReservations: boolean;
    price?: number;
    acceptsOnlinePayment?: boolean;
    requiresUpfrontPayment?: boolean;
  };
  onReservationSuccess?: (reservation: { confirmationCode: string }) => void;
  className?: string;
}

export function RestaurantReservationForm({
  restaurantId,
  restaurant,
  onReservationSuccess,
  className,
}: RestaurantReservationFormProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  const createReservation = useMutation(api.domains.bookings.mutations.createRestaurantReservation);
  const createCheckoutSession = useAction(api.domains.stripe.actions.createCheckoutSession);
  const createMpCheckoutPreference = useAction(
    api.domains.mercadoPago.actions.createCheckoutPreferenceForBooking
  );
  
  // Gerar horários disponíveis entre 18h e 22h com intervalo de 30min
  const availableTimes = [
    "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ]
  
  // Calculate price
  const getPrice = () => {
    return restaurant.price || 0;
  };

  // Calculate final price with coupon
  const getFinalPrice = () => {
    const basePrice = getPrice();
    return appliedCoupon ? appliedCoupon.finalAmount : basePrice;
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) {
      toast.error("Selecione data e horário");
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Preencha todas as informações de contato");
      return;
    }

    if (!restaurant.acceptsReservations) {
      toast.error("Este restaurante não aceita reservas");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the reservation first
      const result = await createReservation({
        restaurantId,
        date: format(date, "yyyy-MM-dd"),
        time,
        partySize,
        customerInfo,
        specialRequests: specialRequests || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      toast.success("Reserva criada com sucesso!", {
        description: `Código de confirmação: ${result.confirmationCode}`,
      });

      // 2. If restaurant requires payment, try Mercado Pago first; fallback to Stripe
      if (restaurant.acceptsOnlinePayment && restaurant.requiresUpfrontPayment && restaurant.price && restaurant.price > 0) {
        try {
          console.log("🔄 Criando checkout session para restaurante:", {
            reservationId: result.reservationId,
            restaurantId,
            price: restaurant.price,
          });

          // Try Mercado Pago first
          const mpPref = await createMpCheckoutPreference({
            bookingId: result.reservationId,
            assetType: "restaurant",
            successUrl: `${window.location.origin}/booking/success?booking_id=${result.confirmationCode}`,
            cancelUrl: `${window.location.origin}/booking/cancel`,
            customerEmail: customerInfo.email,
            couponCode: appliedCoupon?.code,
            discountAmount: getDiscountAmount(),
            originalAmount: getPrice(),
            finalAmount: getFinalPrice(),
            currency: "BRL",
          });

          if (mpPref.success && mpPref.preferenceUrl) {
            toast.success("Redirecionando para pagamento...", {
              description: "Você será levado para o checkout seguro. O pagamento será confirmado após processamento.",
            });

            // Reset form before redirecting
            setDate(undefined);
            setTime("");
            setPartySize(2);
            setCustomerInfo({ name: "", email: "", phone: "" });
            setSpecialRequests("");

            setTimeout(() => {
              window.location.href = mpPref.preferenceUrl;
            }, 1200);
            return; // Don't call onReservationSuccess here, only redirect
          }

          // Fallback to Stripe
          const checkoutSession = await createCheckoutSession({
            bookingId: result.reservationId,
            assetType: "restaurant",
            successUrl: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/booking/cancel`,
            couponCode: appliedCoupon?.code,
            discountAmount: getDiscountAmount(),
            originalAmount: getPrice(),
            finalAmount: getFinalPrice(),
          });

          if (checkoutSession.success && checkoutSession.sessionUrl) {
            toast.success("Redirecionando para pagamento...", {
              description: "Você será levado para o checkout seguro. O pagamento será autorizado e cobrado após aprovação.",
            });

            // Reset form before redirecting
            setDate(undefined);
            setTime("");
            setPartySize(2);
            setCustomerInfo({ name: "", email: "", phone: "" });
            setSpecialRequests("");

            setTimeout(() => {
              window.location.href = checkoutSession.sessionUrl;
            }, 1200);

            return; // Don't call onReservationSuccess here, only redirect
          } else {
            throw new Error(checkoutSession.error || "Erro ao criar sessão de pagamento");
          }
        } catch (paymentError) {
          console.error("💥 Erro ao criar payment link:", paymentError);
          toast.error("Reserva criada, mas erro no pagamento", {
            description: paymentError instanceof Error ? paymentError.message : "Entre em contato conosco para finalizar o pagamento",
          });
        }
      }

      if (onReservationSuccess) {
        onReservationSuccess(result);
      }

      // Reset form
      setDate(undefined);
      setTime("");
      setPartySize(2);
      setCustomerInfo({ name: "", email: "", phone: "" });
      setSpecialRequests("");
    } catch (error) {
      toast.error("Erro ao fazer reserva", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementGuests = () => {
    if (partySize < restaurant.maximumPartySize) {
      setPartySize(partySize + 1);
    }
  };

  const decrementGuests = () => {
    if (partySize > 1) {
      setPartySize(partySize - 1);
    }
  };

  // Helper para formatação de moeda
  // formatCurrency removido (não utilizado);

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Faça sua reserva</h3>
            <p className="text-sm text-gray-500 mt-1">{restaurant.name}</p>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPin className="mr-1 h-3 w-3" />
              {restaurant.address.neighborhood}, {restaurant.address.city}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Data da reserva</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    formStyles.input.base,
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className={formStyles.input.base}>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Selecione um horário" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((timeSlot) => (
                  <SelectItem key={timeSlot} value={timeSlot}>
                    {timeSlot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Party Size */}
          <div className="space-y-2">
            <Label>Número de pessoas</Label>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm">Pessoas</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={decrementGuests}
                  disabled={partySize <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{partySize}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={incrementGuests}
                  disabled={partySize >= restaurant.maximumPartySize}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Máximo: {restaurant.maximumPartySize} pessoas
            </p>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-900">Informações de contato</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                className={formStyles.input.base}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                className={formStyles.input.base}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                className={formStyles.input.base}
                placeholder="(81) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="requests">Solicitações especiais (opcional)</Label>
            <Textarea
              id="requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className={formStyles.textarea.base}
              placeholder="Aniversário, alergia alimentar, preferência de mesa..."
            />
          </div>

          {/* Coupon Validation */}
          {restaurant.price && restaurant.price > 0 && (
            <CouponValidator
              assetType="restaurant"
              assetId={restaurantId}
              orderValue={getPrice()}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
            />
          )}

          {/* Price summary with Stripe fees */}
          {restaurant.price && restaurant.price > 0 && (
            <StripeFeesDisplay 
              baseAmount={getPrice()}
              discountAmount={getDiscountAmount()}
              className="mt-4"
            />
          )}

          {/* Payment Info - show if requires payment */}
          {restaurant.acceptsOnlinePayment && restaurant.requiresUpfrontPayment && restaurant.price && restaurant.price > 0 && (
            <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
              Seu pagamento será autorizado e cobrado apenas após aprovação da reserva pelo restaurante.
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!date || !time || isSubmitting || !restaurant.acceptsReservations}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processando...
              </span>
            ) : (
              "Confirmar reserva"
            )}
          </Button>

            {!restaurant.acceptsReservations && (
              <p className="text-sm text-amber-600 text-center">
                Este restaurante não está aceitando reservas online no momento.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}