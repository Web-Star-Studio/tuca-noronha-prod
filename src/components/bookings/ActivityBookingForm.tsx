"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {formatCurrency} from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
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
import { PaymentBrick } from "@/components/payments/PaymentBrick";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


interface ActivityBookingFormProps {
  activityId: Id<"activities">;
  activity: {
    title: string;
    price: number;
    minParticipants: number;
    maxParticipants: number;
    hasMultipleTickets?: boolean;
    availableTimes?: string[];
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
  const [adults, setAdults] = useState(Math.max(1, activity.minParticipants));
  const [children, setChildren] = useState(0);
  const [additionalParticipantNames, setAdditionalParticipantNames] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"activityTickets"> | undefined>(undefined);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  // Calculate total participants
  const participants = adults + children;

  // Get activity tickets if available
  const tickets = useQuery(api.domains.activities.queries.getActivityTickets, {
    activityId,
  });

  useEffect(() => {
    const required = Math.max(participants - 1, 0);
    setAdditionalParticipantNames((prev) => {
      const next = prev.slice(0, required);
      while (next.length < required) {
        next.push("");
      }
      return next;
    });
  }, [participants]);

  const createBooking = useMutation(api.domains.bookings.mutations.createActivityBooking);
  
  // WhatsApp link generator removido (não utilizado)

  // Available times configured for the activity
  const availableTimes = activity.availableTimes && activity.availableTimes.length > 0
    ? activity.availableTimes
    : [];

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

    if (availableTimes.length > 0 && !time) {
      toast.error("Selecione um horário");
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Preencha todas as informações de contato");
      return;
    }

    if (participants > 1) {
      const hasEmptyName = additionalParticipantNames.some((name) => !name.trim());
      if (hasEmptyName) {
        toast.error("Informe o nome completo de todos os participantes adicionais");
        return;
      }
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
        adults,
        children,
        additionalParticipants: additionalParticipantNames.map((name) => name.trim()),
        customerInfo,
        specialRequests: specialRequests || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      });

      // 2. Check if activity is free - skip payment if it is
      if (activity.isFree || getFinalPrice() === 0) {
        toast.success("Solicitação de reserva enviada!", {
          description: `Código de acompanhamento: ${result.confirmationCode}. Aguardando aprovação do parceiro.`,
        });
        console.log("✅ Atividade gratuita - pulando fluxo de pagamento");
        
        toast.success("Solicitação enviada com sucesso!", {
          description: "Atividade gratuita - aguardando aprovação do parceiro",
        });

        // Reset form
        setDate(undefined);
        setTime("");
        setAdults(Math.max(1, activity.minParticipants));
        setChildren(0);
        setAdditionalParticipantNames([]);
        setSelectedTicketId(undefined);
        setCustomerInfo({ name: "", email: "", phone: "" });
        setSpecialRequests("");

        if (onBookingSuccess) {
          onBookingSuccess({
            confirmationCode: result.confirmationCode,
            totalPrice: result.totalPrice,
          });
        }

        setIsSubmitting(false);
        return;
      }

      // 3. For paid activities, show Card Payment Brick modal
      console.log("💳 Atividade paga - abrindo Card Payment Brick", {
        bookingId: result.bookingId,
        totalPrice: result.totalPrice,
      });

      // Store booking data and show payment modal
      setBookingData({
        bookingId: result.bookingId,
        confirmationCode: result.confirmationCode,
        totalPrice: result.totalPrice,
      });

      toast.info("Prossiga com o pagamento", {
        description: "Escolha seu método de pagamento: cartão, PIX ou boleto.",
      });

      setShowPaymentDialog(true);
      setIsSubmitting(false);

    } catch (error) {
      toast.error("Erro ao criar reserva", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentId: string) => {
    console.log("✅ Pagamento autorizado com sucesso:", paymentId);
    
    setShowPaymentDialog(false);
    
    // Reset form
    setDate(undefined);
    setTime("");
    setAdults(Math.max(1, activity.minParticipants));
    setChildren(0);
    setAdditionalParticipantNames([]);
    setSelectedTicketId(undefined);
    setCustomerInfo({ name: "", email: "", phone: "" });
    setSpecialRequests("");
    setAppliedCoupon(null);
    setBookingData(null);

    if (onBookingSuccess && bookingData) {
      onBookingSuccess({
        confirmationCode: bookingData.confirmationCode,
        totalPrice: bookingData.totalPrice,
      });
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    console.error("❌ Erro no pagamento:", error);
    toast.error("Erro no pagamento", {
      description: "Você pode tentar novamente ou entrar em contato conosco.",
    });
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
          {availableTimes.length > 0 && (
            <div className="space-y-2">
              <Label>Horário</Label>
              <Select
                value={time}
                onValueChange={setTime}
              >
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
          )}

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
        <ParticipantSelector
          adults={adults}
          childrenCount={children}
            onAdultsChange={setAdults}
            onChildrenChange={setChildren}
            minAdults={1}
            maxAdults={activity.maxParticipants}
            maxChildren={Math.max(0, activity.maxParticipants - 1)}
            minTotal={activity.minParticipants}
            maxTotal={activity.maxParticipants}
          />

          {participants > 1 && (
            <div className="space-y-2">
              <Label>Nomes dos participantes adicionais</Label>
              <p className="text-xs text-gray-500">
                Informe o nome completo de cada pessoa além do responsável pela reserva.
              </p>
              <div className="space-y-2">
                {additionalParticipantNames.map((value, index) => (
                  <Input
                    key={`participant-${index}`}
                    value={value}
                    onChange={(e) => {
                      const next = [...additionalParticipantNames];
                      next[index] = e.target.value;
                      setAdditionalParticipantNames(next);
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

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (opcional)</Label>
              <Input
                id="cpf"
                type="text"
                value={customerInfo.cpf || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                  setCustomerInfo({ ...customerInfo, cpf: formatted });
                }}
                className={formStyles.input.base}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <p className="text-xs text-gray-500">
                Recomendado para melhor taxa de aprovação do pagamento
              </p>
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

          {/* Price summary */}
          {getPrice() > 0 && (
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
                Confirmaremos o pagamento com o parceiro antes da cobrança definitiva.
              </p>
            </div>
          )}

          {/* Payment Info */}
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
            ℹ️ <strong>Captura Manual:</strong> O valor será apenas <strong>autorizado</strong> (bloqueado) no seu cartão. A cobrança efetiva só ocorrerá após o parceiro aprovar a reserva.
          </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || !date}
            >
              {isSubmitting ? "Processando..." : "Solicitar Reserva"}
            </Button>
          </form>
        </div>
      </div>

      {/* Payment Dialog with Card Payment Brick */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Autorizar Pagamento</DialogTitle>
            <DialogDescription>
              Escolha seu método de pagamento (cartão, PIX ou boleto) para o valor de{" "}
              <strong>{formatCurrency(bookingData?.totalPrice || 0)}</strong>.
              Para pagamentos com cartão, o valor será bloqueado e só será cobrado após aprovação.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {bookingData && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Atenção:</strong> Este pagamento usa <strong>captura manual</strong>.
                  O valor de <strong>{formatCurrency(bookingData.totalPrice)}</strong> será{" "}
                  <strong>autorizado</strong> (bloqueado) no seu cartão, mas <strong>NÃO será cobrado</strong>{" "}
                  até que o parceiro aprove sua reserva.
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  Código da reserva: <strong>{bookingData.confirmationCode}</strong>
                </p>
              </div>
            )}

            {bookingData && (
              <PaymentBrick
                bookingId={bookingData.bookingId}
                assetType="activity"
                amount={bookingData.totalPrice}
                description={`Reserva de atividade: ${activity.title}`}
                payer={{
                  email: customerInfo.email,
                  firstName: customerInfo.name.split(" ")[0] || "",
                  lastName: customerInfo.name.split(" ").slice(1).join(" ") || "",
                  identification: customerInfo.cpf
                    ? {
                        type: "CPF",
                        number: customerInfo.cpf.replace(/\D/g, ""),
                      }
                    : undefined,
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
