'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ExternalLink, CreditCard, Check } from "lucide-react";

export interface PaymentLinkCheckoutProps {
  bookingId: Id<"activityBookings" | "eventBookings" | "restaurantReservations" | "accommodationBookings" | "vehicleBookings">;
  assetType: "activity" | "event" | "restaurant" | "accommodation" | "vehicle";
  assetId: string;
  totalAmount: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function PaymentLinkCheckout({
  bookingId,
  assetType,
  assetId,
  totalAmount,
  currency = "brl",
  onSuccess,
  onCancel,
  disabled = false,
  className = "",
}: PaymentLinkCheckoutProps) {
  const [loading, setLoading] = useState(false);
  
  const createPaymentLink = useAction(api.domains.stripe.actions.createPaymentLinkForBooking);

  const handlePaymentClick = async () => {
    try {
      setLoading(true);
      
      const paymentLink = await createPaymentLink({
        bookingId,
        assetType,
        assetId,
        totalAmount,
        currency,
        successUrl: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/booking/cancel`,
      });

      if (paymentLink.success && paymentLink.paymentLinkUrl) {
        // Redirecionar para o Payment Link do Stripe
        window.location.href = paymentLink.paymentLinkUrl;
      } else {
        throw new Error(paymentLink.error || "Erro ao criar link de pagamento");
      }
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total a pagar:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      <Button
        onClick={handlePaymentClick}
        disabled={disabled || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pagar com Stripe
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>Pagamento seguro processado pelo Stripe</p>
        <p>Você será redirecionado para completar o pagamento</p>
      </div>
    </div>
  );
} 