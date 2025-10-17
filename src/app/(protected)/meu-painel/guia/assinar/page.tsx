"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Sparkles, ShieldCheck, Map, Camera, CreditCard, Loader2, Info, Mail } from "lucide-react";
import { toast } from "sonner";

export default function GuideSubscriptionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if user already purchased guide
  const hasPurchased = useQuery(api.domains.guide.queries.hasPurchasedGuide);
  
  // Create payment preference (one-time payment)
  const createPayment = useAction(api.domains.guide.actions.createGuidePurchasePreference);

  // If user already purchased, redirect to guide panel
  if (hasPurchased) {
    router.push("/meu-painel/guia");
    return null;
  }

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
      });

      const result = await createPayment({
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
        userName: user.fullName || undefined,
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
    "Pagamento único e seguro via Mercado Pago",
    "Acesso vitalício ao guia completo"
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
                <Sparkles className="h-4 w-4" /> Conteúdo exclusivo Tuca Noronha
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Guia Exclusivo de Fernando de Noronha
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
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <ShieldCheck className="h-5 w-5" /> Acesso vitalício ao guia
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium text-blue-900 sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1">
                  <Sparkles className="h-4 w-4" /> Versão 2025 atualizada
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1">
                  <Map className="h-4 w-4" /> Mapas e trajetos prontos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1">
                  <Camera className="h-4 w-4" /> Spots secretos para fotos
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
                  <span className="text-5xl font-bold text-blue-600">R$ 99,90</span>
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
                {/* Aviso sobre o email */}
                <Alert className="bg-amber-50 border-amber-200 text-left">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <AlertTitle className="text-amber-900 font-semibold mb-2">
                        ⚠️ Importante antes de pagar
                      </AlertTitle>
                      <AlertDescription className="text-amber-800 space-y-2">
                        <p>
                          No checkout do Mercado Pago, <strong>use o mesmo email</strong> cadastrado aqui:
                        </p>
                        <div className="flex items-center gap-2 bg-amber-100 rounded-lg px-3 py-2 mt-2">
                          <Mail className="h-4 w-4 text-amber-600" />
                          <span className="font-mono font-semibold text-amber-900">
                            {user?.primaryEmailAddress?.emailAddress || "seu-email@example.com"}
                          </span>
                        </div>
                        <p className="text-sm mt-2">
                          💡 Assim seu acesso será <strong>liberado automaticamente</strong> após o pagamento!
                        </p>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                
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
                      Comprar agora
                    </>
                  )}
                </Button>
                <p>Pagamento protegido pelo Mercado Pago.</p>
                <p className="text-xs text-gray-500">
                  Em caso de dúvidas basta falar com nosso time.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 px-8 py-10 text-white shadow-xl">
          <div className="pointer-events-none absolute -top-10 right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-bold">Pronto para explorar Noronha com confiança?</h2>
              <p className="text-base text-white/80">
                Garanta agora o Guia Exclusivo e siga um passo a passo completo para cada dia da viagem, sem perder tempo pesquisando.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleBuyGuide}
                disabled={isProcessing}
                className="rounded-full bg-white px-6 py-6 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Comprar Agora
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-white/80">
                Pagamento único de R$ 99,90 via Mercado Pago • Acesso vitalício
              </p>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
