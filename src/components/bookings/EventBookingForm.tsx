"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
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
import { ParticipantSelector } from "@/components/ui/participant-selector";


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
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [additionalAttendeeNames, setAdditionalAttendeeNames] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"eventTickets"> | undefined>(undefined);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  // Calculate total quantity
  const quantity = adults + children;
  
  // Get event tickets if available
  const tickets = useQuery(api.domains.events.queries.getEventTickets, {
    eventId,
  });

  useEffect(() => {
    const required = Math.max(quantity - 1, 0);
    setAdditionalAttendeeNames((prev) => {
      const next = prev.slice(0, required);
      while (next.length < required) {
        next.push("");
      }
      return next;
    });
  }, [quantity]);

  const createBooking = useMutation(api.domains.bookings.mutations.createEventBooking);

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

    if (quantity > 1) {
      const hasEmptyName = additionalAttendeeNames.some((name) => !name.trim());
      if (hasEmptyName) {
        toast.error("Informe o nome completo de todos os participantes adicionais");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Create the booking first
      const result = await createBooking({
        eventId,
        ticketId: selectedTicketId,
        quantity,
        adults,
        children,
        participantNames: additionalAttendeeNames.map((name) => name.trim()),
        customerInfo,
        specialRequests: specialRequests || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      // 2. Success - booking created and awaiting approval
      const isFree = event.isFree || getFinalPrice() === 0;
      
      toast.success("Solicitação de ingresso enviada com sucesso!", {
        description: `Código: ${result.confirmationCode}. ${isFree ? 'Aguardando aprovação do parceiro.' : 'Aguardando aprovação do parceiro. Após aprovação, você receberá o link de pagamento.'}`,
        duration: 6000,
      });

      console.log(`✅ Reserva criada: ${result.bookingId} - Status: pending_approval`);

      // Reset form
      setAdults(1);
      setChildren(0);
      setAdditionalAttendeeNames([]);
      setSelectedTicketId(undefined);
      setCustomerInfo({ name: "", email: "", phone: "" });
      setSpecialRequests("");
      setAppliedCoupon(null);

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
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

          {/* Participants */}
        <ParticipantSelector
          adults={adults}
          childrenCount={children}
            onAdultsChange={setAdults}
            onChildrenChange={setChildren}
            minAdults={1}
            maxAdults={10}
            maxChildren={9}
            maxTotal={10}
          />

          {quantity > 1 && (
            <div className="space-y-2">
              <Label>Nomes dos participantes adicionais</Label>
              <p className="text-xs text-gray-500">
                Informe o nome completo dos participantes extras além do responsável pela compra.
              </p>
              <div className="space-y-2">
                {additionalAttendeeNames.map((value, index) => (
                  <Input
                    key={`attendee-${index}`}
                    value={value}
                    onChange={(e) => {
                      const next = [...additionalAttendeeNames];
                      next[index] = e.target.value;
                      setAdditionalAttendeeNames(next);
                    }}
                    placeholder={`Participante ${index + 2}`}
                    className={formStyles.input.base}
                  />
                ))}
              </div>
            </div>
          )}

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

          {/* Price summary */}
          {!isEventPast && getPrice() > 0 && (
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
                Confirmaremos o pagamento com o organizador antes da cobrança definitiva.
              </p>
            </div>
          )}

          {/* Approval Info */}
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
            ℹ️ <strong>Processo de Reserva:</strong> Sua solicitação será enviada para aprovação do parceiro. 
            {getPrice() > 0 && " Após a aprovação, você receberá um link de pagamento."}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            variant="default"
            disabled={isSubmitting || isEventPast}
          >
            {isSubmitting ? (
              "Enviando Solicitação..."
            ) : isEventPast ? (
              "Evento já realizado"
            ) : (
              <>
                <Ticket className="mr-2 h-4 w-4" />
                Solicitar {quantity === 1 ? "ingresso" : "ingressos"}
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
