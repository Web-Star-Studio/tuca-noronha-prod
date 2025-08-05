"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "@/hooks/use-toast";

interface CouponIntegrationProps {
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle" | "accommodation" | "package";
  userId: string;
  originalAmount: number;
  assetType?: string;
  assetId?: string;
  onCouponApplied?: (discountAmount: number, finalAmount: number) => void;
  onCouponRemoved?: () => void;
}

// Hook para integração com sistema de pagamento
export function useCouponIntegration({
  bookingId,
  bookingType,
  userId,
  originalAmount,
  assetType,
  assetId,
  onCouponApplied,
  onCouponRemoved,
}: CouponIntegrationProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    usageId: string;
  } | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Mutations do Convex
  const applyCouponMutation = useMutation(api.domains.coupons.mutations.applyCoupon);
  const refundCouponMutation = useMutation(api.domains.coupons.mutations.refundCouponUsage);

  // Aplicar cupom
  const applyCoupon = async (couponCode: string): Promise<{
    success: boolean;
    discountAmount?: number;
    finalAmount?: number;
    usageId?: string;
    error?: string;
  }> => {
    if (appliedCoupon) {
      return {
        success: false,
        error: "Já existe um cupom aplicado a esta reserva",
      };
    }

    setIsProcessing(true);

    try {
      const result = await applyCouponMutation({
        couponCode,
        userId: userId as any,
        bookingId,
        bookingType,
        originalAmount,
        assetType,
        assetId,
      });

      const newAppliedCoupon = {
        code: couponCode,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        usageId: result.usageId as any,
      };

      setAppliedCoupon(newAppliedCoupon);
      onCouponApplied?.(result.discountAmount, result.finalAmount);

      toast({
        title: "Cupom aplicado!",
        description: `Desconto de R$ ${result.discountAmount.toFixed(2)} aplicado com sucesso.`,
      });

      return {
        success: true,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        usageId: result.usageId as any,
      };

    } catch {
      const errorMessage = error instanceof Error ? error.message : "Erro ao aplicar cupom";
      
      toast({
        title: "Erro ao aplicar cupom",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Remover cupom (estornar uso)
  const removeCoupon = async (reason: string = "Removido pelo usuário"): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!appliedCoupon) {
      return {
        success: false,
        error: "Nenhum cupom aplicado",
      };
    }

    setIsProcessing(true);

    try {
      await refundCouponMutation({
        usageId: appliedCoupon.usageId as any,
        reason,
      });

      setAppliedCoupon(null);
      onCouponRemoved?.();

      toast({
        title: "Cupom removido",
        description: "O desconto foi removido da reserva.",
      });

      return { success: true };

    } catch {
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover cupom";
      
      toast({
        title: "Erro ao remover cupom",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Verificar se pode aplicar cupom
  const canApplyCoupon = !appliedCoupon && !isProcessing;

  // Obter resumo do desconto
  const getDiscountSummary = () => {
    if (!appliedCoupon) {
      return {
        hasDiscount: false,
        originalAmount,
        discountAmount: 0,
        finalAmount: originalAmount,
        savings: 0,
        couponCode: null,
      };
    }

    return {
      hasDiscount: true,
      originalAmount,
      discountAmount: appliedCoupon.discountAmount,
      finalAmount: appliedCoupon.finalAmount,
      savings: appliedCoupon.discountAmount,
      couponCode: appliedCoupon.code,
    };
  };

  return {
    appliedCoupon,
    isProcessing,
    canApplyCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountSummary,
  };
}

// Componente de integração para checkout
interface CheckoutCouponIntegrationProps extends CouponIntegrationProps {
  children: (props: {
    appliedCoupon: any;
    isProcessing: boolean;
    canApplyCoupon: boolean;
    applyCoupon: (code: string) => Promise<any>;
    removeCoupon: (reason?: string) => Promise<any>;
    discountSummary: any;
  }) => React.ReactNode;
}

export function CheckoutCouponIntegration({
  children,
  ...props
}: CheckoutCouponIntegrationProps) {
  const integration = useCouponIntegration(props);

  return (
    <>
      {children({
        ...integration,
        discountSummary: integration.getDiscountSummary(),
      })}
    </>
  );
}

// Hook para cupons automáticos
export function useAutomaticCoupons({
  userId,
  assetType,
  assetId,
  orderValue,
  onAutomaticCouponFound,
}: {
  userId: string;
  assetType: string;
  assetId: string;
  orderValue: number;
  onAutomaticCouponFound?: (coupon: any) => void;
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [automaticCoupon, setAutomaticCoupon] = useState<any>(null);

  // Action para verificar cupons automáticos
  const checkAutomaticCoupons = useMutation(api.domains.coupons.actions.applyAutomaticCoupons);

  const checkForAutomaticCoupons = useCallback(async () => {
    setIsChecking(true);

    try {
      const result = await checkAutomaticCoupons({
        userId: userId as any,
        assetType,
        assetId,
        orderValue,
      });

      if (result) {
        setAutomaticCoupon(result);
        onAutomaticCouponFound?.(result);

        toast({
          title: "Cupom automático encontrado!",
          description: `Cupom ${result.coupon.code} pode ser aplicado automaticamente.`,
        });
      }

    } catch {
      console.error("Erro ao verificar cupons automáticos:", error);
    } finally {
      setIsChecking(false);
    }
  }, [userId, assetType, assetId, orderValue, checkAutomaticCoupons, onAutomaticCouponFound]);

  // Verificar cupons automáticos quando os parâmetros mudarem
  useEffect(() => {
    if (userId && assetType && assetId && orderValue > 0) {
      checkForAutomaticCoupons();
    }
  }, [userId, assetType, assetId, orderValue, checkForAutomaticCoupons]);

  return {
    isChecking,
    automaticCoupon,
    checkForAutomaticCoupons,
  };
}

// Utilidade para cálculo de preços com cupons
export const CouponPriceCalculator = {
  // Calcular desconto de um cupom
  calculateDiscount: (
    discountType: "percentage" | "fixed_amount",
    discountValue: number,
    orderAmount: number,
    maxDiscountAmount?: number
  ) => {
    let discountAmount = 0;

    if (discountType === "percentage") {
      discountAmount = (orderAmount * discountValue) / 100;
      if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
        discountAmount = maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(discountValue, orderAmount);
    }

    return {
      originalAmount: orderAmount,
      discountAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount),
      discountPercentage: orderAmount > 0 ? (discountAmount / orderAmount) * 100 : 0,
    };
  },

  // Combinar múltiplos cupons
  combineDiscounts: (coupons: any[], orderAmount: number) => {
    let totalDiscount = 0;
    const calculations: Array<{
      coupon: any;
      originalAmount: number;
      discountAmount: number;
      finalAmount: number;
      discountPercentage: number;
    }> = [];

    for (const coupon of coupons) {
      const calc = CouponPriceCalculator.calculateDiscount(
        coupon.discountType,
        coupon.discountValue,
        orderAmount,
        coupon.maxDiscountAmount
      );

      calculations.push({
        coupon,
        ...calc,
      });

      totalDiscount += calc.discountAmount;
    }

    return {
      originalAmount: orderAmount,
      totalDiscount,
      finalAmount: Math.max(0, orderAmount - totalDiscount),
      calculations,
      totalSavings: totalDiscount,
    };
  },

  // Formatar valores monetários
  formatCurrency: (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },

  // Formatar percentual
  formatPercentage: (value: number) => {
    return `${value.toFixed(1)}%`;
  },
};