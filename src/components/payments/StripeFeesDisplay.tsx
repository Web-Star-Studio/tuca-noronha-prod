'use client';

import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  calculateStripeFee, 
  calculateTotalWithStripeFee,
  formatStripeFeePercentage,
  formatStripeFixedFee 
} from "@/lib/constants/stripe";

interface StripeFeesDisplayProps {
  baseAmount: number;
  discountAmount?: number;
  className?: string;
  showDetailedBreakdown?: boolean;
}

export function StripeFeesDisplay({
  baseAmount,
  discountAmount = 0,
  className,
  showDetailedBreakdown = true,
}: StripeFeesDisplayProps) {
  // Calculate amounts
  const subtotal = baseAmount - discountAmount;
  const stripeFee = calculateStripeFee(subtotal);
  const totalAmount = calculateTotalWithStripeFee(subtotal);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className={cn("bg-gray-50 border-gray-200", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Header with info */}
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Resumo do pagamento</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Inclui taxa de processamento do pagamento
            </p>
          </div>
        </div>

        <Separator className="bg-gray-200" />

        {/* Price breakdown */}
        <div className="space-y-2">
          {/* Base amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Valor do serviço</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(baseAmount)}
            </span>
          </div>

          {/* Discount if applicable */}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Desconto aplicado</span>
              <span className="text-sm font-medium text-green-700">
                - {formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          {/* Subtotal if there's a discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Subtotal</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>
          )}

          {/* Stripe fee */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="text-sm text-gray-700">Taxa de processamento</span>
              {showDetailedBreakdown && (
                <span className="text-xs text-gray-500 block">
                  {formatStripeFeePercentage()} + {formatStripeFixedFee()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(stripeFee)}
            </span>
          </div>
        </div>

        <Separator className="bg-gray-300" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900">Total a pagar</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Additional info */}
        <div className="bg-blue-50 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Pagamento seguro:</strong> Processado pelo Stripe, líder mundial em pagamentos online.
              </p>
              <p>
                A taxa de processamento cobre custos de transação segura, proteção contra fraudes e processamento do cartão.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 