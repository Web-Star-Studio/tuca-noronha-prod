'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ExternalLink, CreditCard, Check, Info } from "lucide-react";
import { 
  calculateStripeFee, 
  calculateTotalWithStripeFee 
} from "@/lib/constants/stripe";

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

  // Calculate Stripe fee
  const stripeFee = calculateStripeFee(totalAmount);
  const totalWithFees = calculateTotalWithStripeFee(totalAmount);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Amount breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor da reserva:</span>
            <span className="text-base font-medium text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxa de processamento:</span>
            <span className="text-base font-medium text-gray-900">
              {formatCurrency(stripeFee)}
            </span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">Total a pagar:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(totalWithFees)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Fee explanation */}
        <div className="bg-blue-50 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              A taxa de processamento de 3,99% + R$ 0,39 cobre os custos de transação segura e proteção contra fraudes.
            </p>
          </div>
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