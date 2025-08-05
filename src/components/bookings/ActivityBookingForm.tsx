"use client";

import { useState } from "react";
import { format } from "date-fns";
import {formatCurrency} from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useMutation, useQuery, useAction } from "convex/react";
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


interface ActivityBookingFormProps {
  activityId: Id<"activities">;
  activity: {
    title: string;
    price: number;
    minParticipants: number;
    maxParticipants: number;
    hasMultipleTickets?: boolean;
  };
  onBookingSuccess?: (booking: { confirmationCode: string; totalPrice: number }) => void;
  className?: string;
}

export function ActivityBookingForm({
  activityId,
  activity,
  onBookingSuccess,
  className,
}: ActivityBookingFormProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [participants, setParticipants] = useState(activity.minParticipants);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"activityTickets"> | undefined>(undefined);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  // Get activity tickets if available
  const tickets = useQuery(api.domains.activities.queries.getActivityTickets, {
    activityId,
  });

  const createBooking = useMutation(api.domains.bookings.mutations.createActivityBooking);
  const createCheckoutSession = useAction(api.domains.stripe.actions.createCheckoutSession);
  
  // WhatsApp link generator removido (não utilizado)

  // Available times (customize based on activity)
  const availableTimes = [
    "08:00", "09:00", "10:00", "11:00",
    "14:00", "15:00", "16:00", "17:00",
  ];

  // Calculate price
  const getPrice = () => {
    if (selectedTicketId && tickets) {
      const ticket = tickets.find(t => t._id === selectedTicketId);
      return ticket ? ticket.price * participants : activity.price * participants;
    }
    return activity.price * participants;
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

    if (!date) {
      toast.error("Selecione uma data");
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Preencha todas as informações de contato");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the booking first
      const result = await createBooking({
        activityId,
        ticketId: selectedTicketId,
        date: format(date, "yyyy-MM-dd"),
        time: time || undefined,
        participants,
        customerInfo,
        specialRequests: specialRequests || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      toast.success("Reserva criada com sucesso!", {
        description: `Código de confirmação: ${result.confirmationCode}`,
      });

      // 2. Create Stripe checkout session and redirect
      try {
        console.log("🔄 Criando checkout session para:", {
          bookingId: result.bookingId,
          activityId,
          totalAmount: result.totalPrice,
        });

        const checkoutSession = await createCheckoutSession({
          bookingId: result.bookingId,
          assetType: "activity",
          successUrl: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/booking/cancel`,
          couponCode: appliedCoupon?.code,
          discountAmount: getDiscountAmount(),
          originalAmount: getPrice(),
          finalAmount: getFinalPrice(),
        });

        console.log("💳 Resultado do checkout session:", checkoutSession);

        if (checkoutSession.success && checkoutSession.sessionUrl) {
          // Show success message with payment info
          toast.success("Redirecionando para pagamento...", {
            description: "Você será levado para o checkout seguro. O pagamento será autorizado e cobrado após aprovação.",
          });

          console.log("✅ Checkout session criado com sucesso, redirecionando para:", checkoutSession.sessionUrl);

          // Reset form before redirecting
          setDate(undefined);
          setTime("");
          setParticipants(activity.minParticipants);
          setSelectedTicketId(undefined);
          setCustomerInfo({ name: "", email: "", phone: "" });
          setSpecialRequests("");

          // Small delay to show the toast, then redirect
          setTimeout(() => {
            window.location.href = checkoutSession.sessionUrl;
          }, 1500);

          return; // Don't call onBookingSuccess here, only redirect

        } else {
          console.error("❌ Checkout session falhou:", checkoutSession.error);
          throw new Error(checkoutSession.error || "Erro ao criar sessão de pagamento");
        }
      } catch (paymentError) {
        console.error("💥 Erro ao criar payment link:", paymentError);
        toast.error("Reserva criada, mas erro no pagamento", {
          description: paymentError instanceof Error ? paymentError.message : "Entre em contato conosco para finalizar o pagamento",
        });
        
        // Still call onBookingSuccess since booking was created
        if (onBookingSuccess) {
          onBookingSuccess({
            confirmationCode: result.confirmationCode,
            totalPrice: result.totalPrice,
          });
        }
      }

    } catch (error) {
      toast.error("Erro ao criar reserva", {
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
            <h2 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(activity.price)} por pessoa
              </h2>
            <p className="text-sm text-gray-500 mt-1">{activity.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Data da atividade</Label>
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
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Horário (opcional)</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className={formStyles.select.base}>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((timeOption) => (
                  <SelectItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ticket Selection (if multiple tickets) */}
          {activity.hasMultipleTickets && tickets && tickets.length > 0 && (
            <div className="space-y-2">
              <Label>Tipo de ingresso</Label>
              <Select
                value={selectedTicketId || ""}
                onValueChange={(value) => setSelectedTicketId(value as Id<"activityTickets">)}
              >
                <SelectTrigger className={formStyles.select.base}>
                  <SelectValue placeholder="Selecione o tipo de ingresso" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((ticket) => (
                    <SelectItem key={ticket._id} value={ticket._id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{ticket.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          R$ {ticket.price.toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants">Número de participantes</Label>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setParticipants(Math.max(activity.minParticipants, participants - 1))}
                disabled={participants <= activity.minParticipants}
              >
                -
              </Button>
              <div className="flex items-center justify-center w-12 h-10 border rounded-md">
                <span className="text-sm font-medium">{participants}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setParticipants(Math.min(activity.maxParticipants, participants + 1))}
                disabled={participants >= activity.maxParticipants}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Mín: {activity.minParticipants} | Máx: {activity.maxParticipants}
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
              placeholder="Alguma necessidade especial ou preferência..."
            />
          </div>

          {/* Coupon Validation */}
          {getPrice() > 0 && (
            <CouponValidator
              assetType="activity"
              assetId={activityId}
              orderValue={getPrice()}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
            />
          )}

          {/* Price summary with Stripe fees */}
          {getPrice() > 0 && (
            <StripeFeesDisplay 
              baseAmount={getPrice()}
              discountAmount={getDiscountAmount()}
              className="mt-4"
            />
          )}

          {/* Payment Info */}
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
            Seu pagamento será autorizado e cobrado apenas após aprovação da reserva pelo parceiro.
          </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || !date}
            >
              {isSubmitting ? "Processando..." : "Reservar atividade"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}