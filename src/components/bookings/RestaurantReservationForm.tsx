"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useMutation } from "convex/react";
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
import { ParticipantSelector } from "@/components/ui/participant-selector";


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
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [additionalGuestNames, setAdditionalGuestNames] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  const createReservation = useMutation(api.domains.bookings.mutations.createRestaurantReservation);
  
  // Gerar horários disponíveis entre 18h e 22h com intervalo de 30min
  const availableTimes = [
    "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ]
  
  useEffect(() => {
    const required = Math.max(adults + children - 1, 0);
    setAdditionalGuestNames((prev) => {
      const next = prev.slice(0, required);
      while (next.length < required) {
        next.push("");
      }
      return next;
    });
  }, [adults, children]);

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
  
  const totalGuests = adults + children;

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

    if (totalGuests > 1) {
      const hasEmptyName = additionalGuestNames.some((name) => !name.trim());
      if (hasEmptyName) {
        toast.error("Informe o nome completo de todos os acompanhantes");
        return;
      }
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
        partySize: totalGuests,
        adults,
        children,
        guestNames: additionalGuestNames.map((name) => name.trim()),
        customerInfo,
        specialRequests: specialRequests || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      // Success - reservation created and awaiting approval
      const isFree = !restaurant.price || getFinalPrice() === 0;
      
      toast.success("Solicitação de reserva enviada com sucesso!", {
        description: `Código: ${result.confirmationCode}. ${isFree ? 'Aguardando confirmação do parceiro.' : 'Após confirmação, você receberá o link de pagamento.'}`,
        duration: 6000,
      });

      console.log(`✅ Reserva criada: ${result.reservationId} - Status: pending_approval`);

      if (onReservationSuccess) {
        onReservationSuccess(result);
      }

      // Reset form
      setDate(undefined);
      setTime("");
      setAdults(2);
      setChildren(0);
      setAdditionalGuestNames([]);
      setCustomerInfo({ name: "", email: "", phone: "" });
      setSpecialRequests("");
      setAppliedCoupon(null);
    } catch (error) {
      toast.error("Erro ao fazer reserva", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Label className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-500" />
              Número de participantes
            </Label>
            <ParticipantSelector
              adults={adults}
              childrenCount={children}
              onAdultsChange={setAdults}
              onChildrenChange={setChildren}
              minAdults={1}
              maxAdults={restaurant.maximumPartySize}
              maxChildren={Math.max(restaurant.maximumPartySize - adults, 0)}
              minTotal={1}
              maxTotal={restaurant.maximumPartySize}
            />
            <p className="text-xs text-gray-500">
              Máximo: {restaurant.maximumPartySize} participantes. Crianças até 5 anos entram na categoria Crianças.
            </p>
          </div>

        {totalGuests > 1 && (
          <div className="space-y-2">
            <Label>Nomes dos acompanhantes</Label>
            <p className="text-xs text-gray-500">Informe o nome completo de cada pessoa além do responsável pela reserva.</p>
            <div className="space-y-2">
              {additionalGuestNames.map((value, index) => (
                <Input
                  key={`guest-${index}`}
                  value={value}
                  onChange={(e) => {
                    const next = [...additionalGuestNames];
                    next[index] = e.target.value;
                    setAdditionalGuestNames(next);
                  }}
                  placeholder={`Acompanhante ${index + 2}`}
                  className={formStyles.input.base}
                />
              ))}
            </div>
          </div>
        )}

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

          {/* Price summary */}
          {restaurant.price && restaurant.price > 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700">Resumo do pagamento</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor base</span>
                <span className="font-medium">{formatCurrency(getPrice())}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>Desconto aplicado</span>
                  <span>-{formatCurrency(getDiscountAmount())}</span>
                </div>
              )}
              <div className="border-t pt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(getFinalPrice())}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O pagamento será processado com nosso provedor e confirmado junto ao parceiro antes da cobrança definitiva.
              </p>
            </div>
          )}

          {/* Approval Info */}
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
            ℹ️ <strong>Processo de Reserva:</strong> Sua solicitação será enviada para confirmação do parceiro. 
            {getPrice() > 0 && " Após a confirmação, você receberá um link de pagamento."}
          </div>

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
                Enviando Solicitação...
              </span>
            ) : (
              "Solicitar Reserva"
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
