"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, AlertCircle, Tag, Percent, Calendar, Users } from "lucide-react";
import { useCouponValidation, useMultipleCouponsValidation } from "@/hooks/useCouponValidation";
import { toast } from "@/hooks/use-toast";

interface CouponValidatorProps {
  userId?: string;
  assetType?: string;
  assetId?: string;
  orderValue?: number;
  onCouponApplied?: (coupon: any) => void;
  onCouponRemoved?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showOrderSummary?: boolean;
}

export default function CouponValidator({
  userId,
  assetType,
  assetId,
  orderValue = 0,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
  placeholder = "Digite o código do cupom",
  showOrderSummary = true,
}: CouponValidatorProps) {
  const [isApplied, setIsApplied] = useState(false);
  
  const {
    couponCode,
    setCouponCode,
    validationResult,
    validateCoupon,
    clearValidation,
    isLoading,
    isValid,
    error,
    coupon,
    message,
  } = useCouponValidation({
    userId,
    assetType,
    assetId,
    orderValue,
    autoValidate: true,
  });

  const handleApplyCoupon = async () => {
    if (!isValid || !coupon) return;

    try {
      setIsApplied(true);
      onCouponApplied?.(coupon);
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de R$ ${coupon.discountAmount.toFixed(2)} aplicado.`,
      });
    } catch (error) {
      setIsApplied(false);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o cupom.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCoupon = () => {
    setIsApplied(false);
    clearValidation();
    onCouponRemoved?.();
    toast({
      title: "Cupom removido",
      description: "O desconto foi removido do pedido.",
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Cupom de Desconto
        </CardTitle>
        <CardDescription>
          Insira um código de cupom para aplicar desconto ao seu pedido
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input de Código do Cupom */}
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Código do Cupom</Label>
          <div className="flex gap-2">
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={placeholder}
              disabled={disabled || isApplied}
              className="uppercase"
            />
            
            {!isApplied ? (
              <Button
                onClick={validateCoupon}
                disabled={disabled || isLoading || !couponCode.trim() || !isValid}
                className="shrink-0"
              >
                {isLoading ? "Validando..." : "Aplicar"}
              </Button>
            ) : (
              <Button
                onClick={handleRemoveCoupon}
                variant="outline"
                disabled={disabled}
                className="shrink-0"
              >
                Remover
              </Button>
            )}
          </div>
        </div>

        {/* Status de Validação */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {!isLoading && message && (
          <Alert variant={isValid ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {isValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Detalhes do Cupom Válido */}
        {isValid && coupon && (
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800">{coupon.name}</h4>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {coupon.code}
              </Badge>
            </div>
            
            <p className="text-sm text-green-700">{coupon.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-green-600" />
                <span>
                  {coupon.discountType === "percentage" 
                    ? `${coupon.discountValue}% de desconto`
                    : `R$ ${coupon.discountValue.toFixed(2)} de desconto`
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>Válido até {formatDate(coupon.validUntil)}</span>
              </div>
            </div>

            {!isApplied && (
              <Button
                onClick={handleApplyCoupon}
                disabled={disabled}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Aplicar Desconto de R$ {coupon.discountAmount.toFixed(2)}
              </Button>
            )}
          </div>
        )}

        {/* Resumo do Pedido */}
        {showOrderSummary && orderValue > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Resumo do Pedido</h4>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {orderValue.toFixed(2)}</span>
                </div>
                
                {isApplied && coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({coupon.code}):</span>
                    <span>- R$ {coupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>
                    R$ {(isApplied && coupon ? coupon.finalAmount : orderValue).toFixed(2)}
                  </span>
                </div>
                
                {isApplied && coupon && coupon.discountAmount > 0 && (
                  <div className="text-center text-sm text-green-600 font-medium">
                    Você está economizando R$ {coupon.discountAmount.toFixed(2)}!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para validação múltipla de cupons
export function MultipleCouponValidator({
  userId,
  assetType,
  assetId,
  orderValue = 0,
  onCouponsChanged,
  disabled = false,
  maxCoupons = 3,
}: CouponValidatorProps & {
  onCouponsChanged?: (validCoupons: any[], totalDiscount: number, finalAmount: number) => void;
  maxCoupons?: number;
}) {
  const [inputValue, setInputValue] = useState("");

  const {
    couponCodes,
    addCoupon,
    removeCoupon,
    clearAllCoupons,
    validationResults,
    isLoading,
    totalDiscount,
    finalAmount,
    conflicts,
    validCoupons,
    invalidCoupons,
    hasValidCoupons,
    hasConflicts,
  } = useMultipleCouponsValidation({
    userId,
    assetType,
    assetId,
    orderValue,
  });

  const handleAddCoupon = () => {
    if (!inputValue.trim()) return;
    
    if (couponCodes.length >= maxCoupons) {
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar no máximo ${maxCoupons} cupons.`,
        variant: "destructive",
      });
      return;
    }

    addCoupon(inputValue);
    setInputValue("");
  };

  // Notificar mudanças
  useEffect(() => {
    onCouponsChanged?.(validCoupons, totalDiscount, finalAmount);
  }, [validCoupons, totalDiscount, finalAmount, onCouponsChanged]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Cupons de Desconto
        </CardTitle>
        <CardDescription>
          Adicione múltiplos cupons para maximizar seu desconto
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input para adicionar cupons */}
        <div className="space-y-2">
          <Label htmlFor="coupon-input">Adicionar Cupom</Label>
          <div className="flex gap-2">
            <Input
              id="coupon-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
              disabled={disabled || couponCodes.length >= maxCoupons}
              className="uppercase"
              onKeyPress={(e) => e.key === "Enter" && handleAddCoupon()}
            />
            <Button
              onClick={handleAddCoupon}
              disabled={disabled || !inputValue.trim() || couponCodes.length >= maxCoupons}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de cupons */}
        {couponCodes.length > 0 && (
          <div className="space-y-2">
            <Label>Cupons Adicionados ({couponCodes.length}/{maxCoupons})</Label>
            
            {couponCodes.map((code) => {
              const result = validationResults[code];
              const isValidating = isLoading && !result;
              
              return (
                <div
                  key={code}
                  className={`p-3 border rounded-lg ${
                    result?.isValid 
                      ? "border-green-200 bg-green-50" 
                      : result?.isValid === false 
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{code}</Badge>
                      
                      {isValidating ? (
                        <Skeleton className="h-4 w-20" />
                      ) : result?.isValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : result?.isValid === false ? (
                        <X className="h-4 w-4 text-red-600" />
                      ) : null}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCoupon(code)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {result && (
                    <div className="mt-2 text-sm">
                      {result.isValid && result.coupon ? (
                        <div className="space-y-1">
                          <p className="font-medium text-green-700">{result.coupon.name}</p>
                          <p className="text-green-600">
                            Desconto: R$ {result.coupon.discountAmount.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-red-600">{result.message}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllCoupons}
              disabled={disabled}
            >
              Remover Todos
            </Button>
          </div>
        )}

        {/* Conflitos */}
        {hasConflicts && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <p key={index}>{conflict}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Resumo */}
        {hasValidCoupons && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Resumo do Pedido</h4>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {orderValue.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-green-600">
                  <span>Desconto Total:</span>
                  <span>- R$ {totalDiscount.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>R$ {finalAmount.toFixed(2)}</span>
                </div>
                
                <div className="text-center text-sm text-green-600 font-medium">
                  Você está economizando R$ {totalDiscount.toFixed(2)}!
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}