"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Sparkles, Map, CreditCard, Loader2, Tag, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function GuideSubscriptionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Check if user already purchased guide
  const hasPurchased = useQuery(api.domains.guide.queries.hasPurchasedGuide);
  
  // Create payment preference (one-time payment)
  const createPayment = useAction(api.domains.guide.actions.createGuidePurchasePreference);
  const validateCoupon = useAction(api.domains.coupons.actions.validateCouponRealTime);

  // If user already purchased, redirect to guide panel
  if (hasPurchased) {
    router.push("/meu-painel/guia");
    return null;
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const result = await validateCoupon({
        couponCode: couponCode.trim().toUpperCase(),
        orderValue: 99.90, // Preço do guia
      });

      if (result.isValid && result.coupon) {
        setAppliedCoupon(result.coupon);
        toast.success(`Cupom aplicado! Desconto de R$ ${result.coupon.discountAmount.toFixed(2)}`);
      } else {
        toast.error(result.message || "Cupom inválido");
        setAppliedCoupon(null);
      }
    } catch (error) {
      toast.error("Erro ao validar cupom");
      setAppliedCoupon(null);
      console.error("Error validating coupon:", error);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    toast.info("Cupom removido");
  };

  const handleBuyGuide = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para comprar o guia");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log("[Guide] Creating payment for user:", {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        coupon: appliedCoupon?.code,
      });

      const result = await createPayment({
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
        userName: user.fullName || undefined,
        couponCode: appliedCoupon?.code,
      });

      console.log("[Guide] API Response:", result);

      if (result.success && result.checkoutUrl) {
        console.log("[Guide] ✅ Payment created successfully!");
        console.log("[Guide] Redirecting to:", result.checkoutUrl);
        
        toast.success("Redirecionando para o pagamento...");
        
        // Redirect to Mercado Pago checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || "Erro ao criar pagamento");
      }
    } catch (error) {
      console.error("[Guide] ❌ Exception:", error);
      toast.error("Erro ao processar pagamento", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        duration: 5000,
      });
      setIsProcessing(false);
    }
  };


  const heroHighlights = [
    "Páginas atualizadas para 2025",
    "Roteiros com dias e horários sugeridos", 
  ];

  const purchaseBenefits = [
    "Pagamento único e seguro via Mercado Pago"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 pt-24 via-white to-white py-16 px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 px-6 py-10 shadow-xl ring-1 ring-blue-100/70 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -top-24 -left-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.35fr,1fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-4 py-1 text-sm font-semibold text-blue-700">
                <Sparkles className="h-4 w-4" /> Conteúdo exclusivo
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Guia Digital Exclusivo de Fernando de Noronha
                </h1>
                <p className="text-lg text-gray-600 sm:text-xl">
                  Tudo que você precisa para planejar uma viagem inesquecível: roteiros práticos, contatos confiáveis e os segredos de quem vive a ilha todos os dias.
                </p>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {heroHighlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-blue-100/80 bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  onClick={handleBuyGuide}
                  disabled={isProcessing}
                  className="gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-6 text-lg font-semibold text-white shadow-lg hover:from-blue-600 hover:via-blue-600 hover:to-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Comprar Agora
                      <Sparkles className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium text-blue-900 sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1">
                  <Map className="h-4 w-4" /> Mapas e trajetos prontos
                </span>
              </div>
            </div>

            <Card className="relative overflow-hidden border-0 bg-white/95 shadow-2xl ring-1 ring-blue-100/70">
              <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
              <CardHeader className="relative space-y-4 pt-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Oferta especial
                </div>
                <div className="mt-2 flex items-end justify-start gap-2">
                  {appliedCoupon ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-semibold text-gray-400 line-through">R$ 99,90</span>
                      <span className="text-5xl font-bold text-green-600">R$ {appliedCoupon.finalAmount.toFixed(2)}</span>
                      <span className="text-sm text-green-600 font-medium">Desconto de R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-5xl font-bold text-blue-600">R$ 99,90</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3 text-sm text-gray-600">
                {purchaseBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl bg-blue-50/70 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="relative flex flex-col gap-4 pt-4 text-center text-sm text-gray-600">
                
                {/* Coupon input */}
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag className="h-4 w-4" />
                    <span>Tem um cupom de desconto?</span>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="flex-1 font-semibold text-green-700 uppercase">{appliedCoupon.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="h-auto p-1 text-green-700 hover:text-green-800 hover:bg-green-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite seu cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleValidateCoupon();
                          }
                        }}
                        className="rounded-lg uppercase"
                        disabled={isValidatingCoupon}
                      />
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        variant="outline"
                        className="rounded-lg"
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Aviso sobre produto digital - CRÍTICO para evitar reembolsos */}
                <div className="w-full rounded-lg border-2 border-amber-200 bg-amber-50 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left space-y-2">
                      <p className="text-sm font-semibold text-amber-900">
                        ⚠️ Produto Digital - Política de Não Reembolso
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Este é um <strong>produto digital intangível</strong> com acesso imediato. Ao finalizar a compra, você concorda que:
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1 ml-4">
                        <li>• O acesso ao guia será liberado <strong>imediatamente</strong> após aprovação do pagamento</li>
                        <li>• Produtos digitais <strong>não têm direito de arrependimento</strong> após a entrega</li>
                        <li>• <strong>Não oferecemos reembolsos</strong> para produtos digitais já acessados</li>
                        <li>• Este produto <strong>não está coberto pela Compra Garantida</strong> do Mercado Pago</li>
                      </ul>
                      <Link 
                        href="/meu-painel/guia/termos" 
                        target="_blank"
                        className="inline-block text-xs text-amber-900 underline font-semibold hover:text-amber-700 mt-2"
                      >
                        📄 Leia os Termos Completos e Política de Reembolso
                      </Link>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleBuyGuide}
                  disabled={isProcessing}
                  className="w-full rounded-full bg-blue-600 py-6 text-base font-semibold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Aceito os termos e quero comprar
                    </>
                  )}
                </Button>
                <p>Pagamento protegido pelo Mercado Pago.</p>
                <p className="text-xs text-gray-500">
                  Em caso de dúvidas basta falar com nosso time antes da compra.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>

      </div>

    </div>
  );
}
