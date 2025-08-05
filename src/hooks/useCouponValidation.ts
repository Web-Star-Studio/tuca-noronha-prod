"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDebounce } from "./use-debounce";

interface CouponValidationResult {
  isValid: boolean;
  isLoading: boolean;
  message: string;
  coupon: {
    id: string;
    code: string;
    name: string;
    description: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
    validUntil: number;
  } | null;
  error: string | null;
}

interface UseCouponValidationProps {
  userId?: string;
  assetType?: string;
  assetId?: string;
  orderValue?: number;
  autoValidate?: boolean;
}

export function useCouponValidation({
  userId,
  assetType,
  assetId,
  orderValue,
  autoValidate = false,
}: UseCouponValidationProps = {}) {
  const [couponCode, setCouponCode] = useState("");
  const [validationResult, setValidationResult] = useState<CouponValidationResult>({
    isValid: false,
    isLoading: false,
    message: "",
    coupon: null,
    error: null,
  });

  // Debounce do código do cupom para evitar muitas requests
  const debouncedCouponCode = useDebounce(couponCode.trim(), 500);

  // Action do Convex para validação
  const validateCoupon = useAction(api.domains.coupons.actions.validateCouponRealTime);

  // Função para validar cupom
  const validateCouponCode = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setValidationResult({
        isValid: false,
        isLoading: false,
        message: code.length > 0 ? "Código deve ter pelo menos 3 caracteres" : "",
        coupon: null,
        error: null,
      });
      return;
    }

    setValidationResult(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await validateCoupon({
        couponCode: code.toUpperCase(),
        userId: userId as any,
        assetType,
        assetId,
        orderValue,
      });

      setValidationResult({
        isValid: result.isValid,
        isLoading: false,
        message: result.message,
        coupon: result.coupon,
        error: null,
      });

      return result;
    } catch {
      setValidationResult({
        isValid: false,
        isLoading: false,
        message: "Erro ao validar cupom",
        coupon: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    }
  }, [validateCoupon, userId, assetType, assetId, orderValue]);

  // Validação automática quando o código muda (se habilitado)
  useEffect(() => {
    if (autoValidate && debouncedCouponCode) {
      validateCouponCode(debouncedCouponCode);
    }
  }, [debouncedCouponCode, autoValidate, validateCouponCode]);

  // Função para limpar validação
  const clearValidation = useCallback(() => {
    setCouponCode("");
    setValidationResult({
      isValid: false,
      isLoading: false,
      message: "",
      coupon: null,
      error: null,
    });
  }, []);

  // Função para validar manualmente
  const validateManually = useCallback(() => {
    if (couponCode.trim()) {
      return validateCouponCode(couponCode.trim());
    }
    return Promise.resolve(null);
  }, [couponCode, validateCouponCode]);

  return {
    couponCode,
    setCouponCode,
    validationResult,
    validateCoupon: validateManually,
    clearValidation,
    isLoading: validationResult.isLoading,
    isValid: validationResult.isValid,
    error: validationResult.error,
    coupon: validationResult.coupon,
    message: validationResult.message,
  };
}

// Hook para calcular desconto de múltiplos cupons
export function useMultipleCouponsValidation({
  userId,
  assetType,
  assetId,
  orderValue,
}: UseCouponValidationProps = {}) {
  const [couponCodes, setCouponCodes] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, CouponValidationResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(orderValue || 0);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const validateCoupon = useAction(api.domains.coupons.actions.validateCouponRealTime);

  const validateAllCoupons = useCallback(async () => {
    if (couponCodes.length === 0) {
      setValidationResults({});
      setTotalDiscount(0);
      setFinalAmount(orderValue || 0);
      setConflicts([]);
      return;
    }

    setIsLoading(true);
    const results: Record<string, CouponValidationResult> = {};
    const validCoupons: any[] = [];
    let calculatedDiscount = 0;

    try {
      // Validar cada cupom individualmente
      for (const code of couponCodes) {
        if (!code.trim()) continue;

        try {
          const result = await validateCoupon({
            couponCode: code.toUpperCase(),
            userId: userId as any,
            assetType,
            assetId,
            orderValue,
          });

          results[code] = {
            isValid: result.isValid,
            isLoading: false,
            message: result.message,
            coupon: result.coupon,
            error: null,
          };

          if (result.isValid && result.coupon) {
            validCoupons.push(result.coupon);
            calculatedDiscount += result.coupon.discountAmount;
          }
        } catch {
          results[code] = {
            isValid: false,
            isLoading: false,
            message: "Erro ao validar cupom",
            coupon: null,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          };
        }
      }

      // Verificar conflitos entre cupons
      const newConflicts: string[] = [];
      
      // Verificar cupons não empilháveis
      const nonStackableCoupons = validCoupons.filter(coupon => !coupon.stackable);
      if (nonStackableCoupons.length > 1) {
        newConflicts.push("Múltiplos cupons não empilháveis selecionados");
      }
      if (nonStackableCoupons.length > 0 && validCoupons.length > 1) {
        newConflicts.push("Cupom selecionado não pode ser usado com outros cupons");
      }

      // Se há conflitos, usar apenas o cupom com maior desconto
      if (newConflicts.length > 0) {
        const bestCoupon = validCoupons.reduce((best, current) => 
          current.discountAmount > best.discountAmount ? current : best
        );
        calculatedDiscount = bestCoupon.discountAmount;
      }

      setValidationResults(results);
      setTotalDiscount(calculatedDiscount);
      setFinalAmount(Math.max(0, (orderValue || 0) - calculatedDiscount));
      setConflicts(newConflicts);

    } catch {
      console.error("Erro ao validar cupons:", error);
    } finally {
      setIsLoading(false);
    }
  }, [couponCodes, validateCoupon, userId, assetType, assetId, orderValue]);

  // Adicionar cupom
  const addCoupon = useCallback((code: string) => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode && !couponCodes.includes(trimmedCode)) {
      setCouponCodes(prev => [...prev, trimmedCode]);
    }
  }, [couponCodes]);

  // Remover cupom
  const removeCoupon = useCallback((code: string) => {
    setCouponCodes(prev => prev.filter(c => c !== code));
    setValidationResults(prev => {
      const newResults = { ...prev };
      delete newResults[code];
      return newResults;
    });
  }, []);

  // Limpar todos os cupons
  const clearAllCoupons = useCallback(() => {
    setCouponCodes([]);
    setValidationResults({});
    setTotalDiscount(0);
    setFinalAmount(orderValue || 0);
    setConflicts([]);
  }, [orderValue]);

  // Validar quando a lista de cupons muda
  useEffect(() => {
    validateAllCoupons();
  }, [validateAllCoupons]);

  const validCoupons = Object.entries(validationResults)
    .filter(([, result]) => result.isValid)
    .map(([code, result]) => ({ code, ...result }));

  const invalidCoupons = Object.entries(validationResults)
    .filter(([, result]) => !result.isValid)
    .map(([code, result]) => ({ code, ...result }));

  return {
    couponCodes,
    addCoupon,
    removeCoupon,
    clearAllCoupons,
    validationResults,
    validateAllCoupons,
    isLoading,
    totalDiscount,
    finalAmount,
    conflicts,
    validCoupons,
    invalidCoupons,
    hasValidCoupons: validCoupons.length > 0,
    hasConflicts: conflicts.length > 0,
  };
}