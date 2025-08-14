"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCustomerInfo } from "@/lib/hooks/useCustomerInfo";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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


interface EventBookingFormProps {
  eventId: Id<"events">;
  event: {
    title: string;
    date: string;
    location: string;
    price: number;
    time?: string;
    hasMultipleTickets?: boolean;
    acceptsOnlinePayment?: boolean;
    requiresUpfrontPayment?: boolean;
  };
  onBookingSuccess?: (booking: { bookingId: string; confirmationCode: string; totalPrice: number }) => void;
  className?: string;
}

export function EventBookingForm({
  eventId,
  event,
  onBookingSuccess,
  className,
}: EventBookingFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"eventTickets"> | undefined>(undefined);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();
  
  // Get event tickets if available
  const tickets = useQuery(api.domains.events.queries.getEventTickets, {
    eventId,
  });

  const createBooking = useMutation(api.domains.bookings.mutations.createEventBooking);
  const createCheckoutSession = useAction(api.domains.stripe.actions.createCheckoutSession);
  const createMpCheckoutPreference = useAction(
    api.domains.mercadoPago.actions.createCheckoutPreferenceForBooking
  );

  // Calculate price
  const getPrice = () => {
    if (selectedTicketId && tickets) {
      const ticket = tickets.find(t => t._id === selectedTicketId);
      return ticket ? ticket.price * quantity : event.price * quantity;
    }
    return event.price * quantity;
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

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Preencha todas as informações de contato");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the booking first
      const result = await createBooking({
        eventId,
        ticketId: selectedTicketId,
        quantity,
        customerInfo,
        specialRequests: specialRequests || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      toast.success("Ingresso(s) reservado(s) com sucesso!", {
        description: `Código de confirmação: ${result.confirmationCode}`,
      });

      // 2. If event requires payment, try Mercado Pago first; fallback to Stripe
      if (event.acceptsOnlinePayment && event.requiresUpfrontPayment && result.totalPrice > 0) {
        try {
          console.log("🔄 Criando checkout session para evento:", {
            bookingId: result.bookingId,
            eventId,
            totalPrice: result.totalPrice,
          });

          // Try Mercado Pago first
          const mpPref = await createMpCheckoutPreference({
            bookingId: result.bookingId,
            assetType: "event",
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
            setQuantity(1);
            setSelectedTicketId(undefined);
            setCustomerInfo({ name: "", email: "", phone: "" });
            setSpecialRequests("");

            setTimeout(() => {
              window.location.href = mpPref.preferenceUrl;
            }, 1200);
            return; // Don't call onBookingSuccess here, only redirect
          }

          // Fallback to Stripe
          const checkoutSession = await createCheckoutSession({
            bookingId: result.bookingId,
            assetType: "event",
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
            setQuantity(1);
            setSelectedTicketId(undefined);
            setCustomerInfo({ name: "", email: "", phone: "" });
            setSpecialRequests("");

            setTimeout(() => {
              window.location.href = checkoutSession.sessionUrl;
            }, 1200);

            return; // Don't call onBookingSuccess here, only redirect
          } else {
            throw new Error(checkoutSession.error || "Erro ao criar sessão de pagamento");
          }
        } catch (paymentError) {
          console.error("💥 Erro ao criar payment link:", paymentError);
          toast.error("Reserva criada, mas erro no pagamento", {
            description: paymentError instanceof Error ? paymentError.message : "Entre em contato conosco para finalizar o pagamento",
          });
          
          // For payment errors, still redirect to booking details with booking ID
          if (onBookingSuccess) {
            onBookingSuccess(result);
          }
          return;
        }
      }

      // 3. If no payment required, handle success
      if (onBookingSuccess) {
        onBookingSuccess(result);
      }

      // Reset form if not redirecting
      setQuantity(1);
      setSelectedTicketId(undefined);
      setCustomerInfo({ name: "", email: "", phone: "" });
      setSpecialRequests("");
    } catch (error) {
      toast.error("Erro ao reservar ingresso", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse event date for display
  const eventDate = new Date(event.date);
  const isEventPast = eventDate < new Date();

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Reserve seu ingresso</h3>
            <p className="text-sm text-gray-500 mt-1">{event.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticket Selection (if multiple tickets) */}
          {event.hasMultipleTickets && tickets && tickets.length > 0 && (
            <div className="space-y-2">
              <Label>Tipo de ingresso</Label>
              <Select
                value={selectedTicketId || ""}
                onValueChange={(value) => setSelectedTicketId(value as Id<"eventTickets">)}
              >
                <SelectTrigger className={formStyles.select.base}>
                  <SelectValue placeholder="Selecione o tipo de ingresso" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((ticket) => (
                    <SelectItem key={ticket._id} value={ticket._id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{ticket.name}</span>
                          <p className="text-xs text-gray-500">{ticket.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 ml-4">
                          R$ {ticket.price.toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de ingressos</Label>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <div className="flex items-center justify-center w-12 h-10 border rounded-md">
                <span className="text-sm font-medium">{quantity}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= 10} // Max 10 tickets per order
              >
                +
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Máximo 10 ingressos por pedido
            </p>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-900">Informações do comprador</h4>
            
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
            <Label htmlFor="requests">Observações (opcional)</Label>
            <Textarea
              id="requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className={formStyles.textarea.base}
              placeholder="Alguma necessidade especial, acessibilidade, etc..."
            />
          </div>

          {/* Coupon Validation */}
          {!isEventPast && getPrice() > 0 && (
            <CouponValidator
              assetType="event"
              assetId={eventId}
              orderValue={getPrice()}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
            />
          )}

          {/* Price summary with Stripe fees */}
          {!isEventPast && getPrice() > 0 && (
            <StripeFeesDisplay 
              baseAmount={getPrice()}
              discountAmount={getDiscountAmount()}
              className="mt-4"
            />
          )}

          {/* Payment Info - show if requires payment */}
          {event.acceptsOnlinePayment && event.requiresUpfrontPayment && getPrice() > 0 && (
            <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
              Seu pagamento será autorizado e cobrado apenas após aprovação da reserva pelo organizador.
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            variant="default"
            disabled={isSubmitting || isEventPast}
          >
            {isSubmitting ? (
              "Processando..."
            ) : isEventPast ? (
              "Evento já realizado"
            ) : (
              <>
                <Ticket className="mr-2 h-4 w-4" />
                Comprar {quantity === 1 ? "ingresso" : "ingressos"}
              </>
            )}
          </Button>

            {isEventPast && (
              <p className="text-xs text-center text-gray-500">
                Este evento já aconteceu e não aceita mais reservas
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}