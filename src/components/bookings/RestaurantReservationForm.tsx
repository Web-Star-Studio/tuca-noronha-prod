"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Users, Clock, Plus, Minus, MapPin } from "lucide-react";
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
import { cardStyles, buttonStyles, formStyles } from "@/lib/ui-config";

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
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  const createReservation = useMutation(api.domains.bookings.mutations.createRestaurantReservation);
  const createCheckoutSession = useAction(api.domains.stripe.actions.createCheckoutSession);
  
  // Gerar horários disponíveis entre 18h e 22h com intervalo de 30min
  const availableTimes = [
    "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ]
  
  // // Formatar preço para moeda brasileira
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('pt-BR', {
  //     style: 'currency',
  //     currency: 'BRL'
  //   }).format(value)
  // }
  
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
      });

      toast.success("Reserva criada com sucesso!", {
        description: `Código de confirmação: ${result.confirmationCode}`,
      });

      // 2. If restaurant requires payment, create checkout session
      if (restaurant.acceptsOnlinePayment && restaurant.requiresUpfrontPayment && restaurant.price && restaurant.price > 0) {
        try {
          console.log("🔄 Criando checkout session para restaurante:", {
            reservationId: result.reservationId,
            restaurantId,
            price: restaurant.price,
          });

          const checkoutSession = await createCheckoutSession({
            bookingId: result.reservationId,
            assetType: "restaurant",
            successUrl: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/booking/cancel`,
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

            // Small delay to show the toast, then redirect
            setTimeout(() => {
              window.location.href = checkoutSession.sessionUrl;
            }, 1500);

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

      // 3. If no payment required or payment flow completed, handle success
      if (onReservationSuccess) {
        onReservationSuccess(result);
      }

      // Reset form if not redirecting
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

  return (
    <div className={cn("rounded-xl overflow-hidden bg-blue-50 shadow-sm border border-gray-100", className)}>
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Faça sua reserva</h3>
          <p className="text-sm text-gray-500 mt-1">Garanta seu lugar em {restaurant.name}</p>
        </div>
        
        {/* Data picker */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between bg-white border-gray-200 hover:bg-gray-50 h-14 px-4"
              >
                <div className="flex items-center">
                  <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                  <span className={cn(!date && "text-gray-400")}>
                    {date ? format(date, "PPP", { locale: ptBR }) : "Data"}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {!date && "Selecionar"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0 border-none" side="bottom">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
                locale={ptBR}
                className="bg-white rounded-md border-none"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Horário selector */}
        <div>
          <Select value={time} onValueChange={setTime} >
            <SelectTrigger 
              className="w-full justify-between bg-white border-gray-200 hover:bg-gray-50 h-14 px-4"
            >
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-blue-600" />
                <span className={cn(!time && "text-gray-400")}>
                  {time || "Horário"}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {!time && "Selecionar"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-white border-none">
              {availableTimes.map((timeOption) => (
                <SelectItem 
                  key={timeOption} 
                  value={timeOption}
                  className="text-gray-900 hover:bg-blue-100 font-semibold hover:text-gray-900"
                >
                  {timeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Pessoas selector */}
        <div>
          <div className="flex items-center justify-between border border-gray-200 rounded-md h-14 px-4 bg-white hover:bg-gray-50">
            <div className="flex items-center">
              <Users className="mr-3 h-5 w-5 text-blue-600" />
              <span className="text-gray-900">Pessoas</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full border-gray-200"
                onClick={decrementGuests}
                disabled={partySize <= 1}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Diminuir</span>
              </Button>
              <span className="w-5 text-center font-medium">{partySize}</span>
              <Button
                type="button"
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full border-gray-200"
                onClick={incrementGuests}
                disabled={partySize >= restaurant.maximumPartySize}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Aumentar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Price Summary - show if restaurant has pricing */}
        {restaurant.price && restaurant.price > 0 && (
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Mesa para {partySize} {partySize === 1 ? "pessoa" : "pessoas"}
              </span>
              <span>R$ {restaurant.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>R$ {restaurant.price.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment Info - show if requires payment */}
        {restaurant.acceptsOnlinePayment && restaurant.requiresUpfrontPayment && restaurant.price && restaurant.price > 0 && (
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
            💳 Seu pagamento será autorizado e cobrado apenas após aprovação da reserva pelo restaurante.
          </div>
        )}

        <Button 
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-medium"
          disabled={!date || !time || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <title>Ícone de carregamento</title>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processando...
            </span>
          ) : (
            "Verificar disponibilidade"
          )}
        </Button>
      </div>
    </div>
  )
}