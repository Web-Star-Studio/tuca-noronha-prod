"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Sparkles, Map, Sun, Camera, UtensilsCrossed, Download, Plane, ShieldCheck, Quote } from "lucide-react";
import { toast } from "sonner";

export default function GuideSubscriptionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const currentSubscription = useQuery(api.domains.subscriptions.queries.getCurrentSubscription);
  const createSubscriptionPreference = useAction(api.domains.subscriptions.actions.createSubscriptionPreference);

  // If user already has an active subscription, redirect to guide panel
  if (currentSubscription?.status === "authorized") {
    router.push("/meu-painel/guia");
    return null;
  }

  const handleBuyGuide = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para comprar o guia");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createSubscriptionPreference({
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
        userName: user.fullName || undefined,
        successUrl: `${window.location.origin}/meu-painel/guia`,
        cancelUrl: `${window.location.origin}/meu-painel/guia/assinar`,
      });

      if (result.success && result.preferenceUrl) {
        window.location.href = result.preferenceUrl;
      } else {
        toast.error(result.error || "Erro ao criar preferência de pagamento");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Erro ao processar compra");
    } finally {
      setIsLoading(false);
    }
  };

  const heroHighlights = [
    "70+ páginas atualizadas para 2024/2025",
    "Roteiros de 3, 5 e 7 dias com horários sugeridos",
    "Planilhas editáveis para controlar gastos e reservas",
    "Checklist inteligente com custos, contatos e links"
  ];

  const guideHighlights = [
    {
      icon: <Map className="h-6 w-6" />,
      title: "Roteiro completo dia a dia",
      description: "Sugestões de horários, deslocamentos e prioridades para aproveitar cada minuto na ilha"
    },
    {
      icon: <Sun className="h-6 w-6" />,
      title: "Segredos de quem mora lá",
      description: "Atalhos, experiências pouco exploradas e alertas sobre regras ambientais para evitar perrengues"
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Pontos imperdíveis",
      description: "Trilhas, mirantes, praias e spots para fotos com dicas de logística e reserva"
    },
    {
      icon: <UtensilsCrossed className="h-6 w-6" />,
      title: "Onde comer e celebrar",
      description: "Restaurantes, experiências gastronômicas e tours recomendados para cada perfil de viajante"
    }
  ];

  const bonuses = [
    "Checklist de viagem com o que levar e quanto custa cada atividade",
    "Planilha para organizar gastos, contatos e reservas em um só lugar",
    "Sugestões de hospedagem por estilo (casal, família, low cost e premium)",
    "Links clicáveis para mapas, telefones e parceiros de confiança"
  ];

  const purchaseBenefits = [
    "Pagamento único e seguro via Mercado Pago",
    "PDF interativo + planilhas editáveis",
    "Atualizações gratuitas durante 6 meses",
    "Suporte por e-mail para tirar dúvidas sobre a viagem"
  ];

  const usageSteps = [
    {
      icon: <Download className="h-5 w-5" />,
      title: "Receba imediatamente",
      description: "Após o pagamento, o link do Guia chega no seu e-mail com todos os materiais extras."
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Monte seu plano com confiança",
      description: "Use roteiros prontos, checklists e planilhas para adaptar o passo a passo à sua viagem."
    },
    {
      icon: <Plane className="h-5 w-5" />,
      title: "Aproveite Noronha sem imprevistos",
      description: "Chegue sabendo onde ir, quanto gastar e como reservar experiências disputadas."
    }
  ];

  const testimonials = [
    {
      initials: "LM",
      name: "Luiza M.",
      role: "Casal • Março/2024",
      quote: "Foi como viajar com uma amiga que já mora na ilha. Seguimos o roteiro de 5 dias e economizamos tempo com as filas dos passeios."
    },
    {
      initials: "RA",
      name: "Rodrigo A.",
      role: "Família • Julho/2023",
      quote: "Os lembretes sobre taxas, transporte e reservas salvaram nossa viagem. A planilha financeira nos ajudou a controlar tudo sem estresse."
    }
  ];

  const faqs = [
    {
      question: "Como recebo o Guia?",
      answer: "Assim que o pagamento for confirmado, enviamos um e-mail com o PDF e todos os materiais extras para download."
    },
    {
      question: "O conteúdo é atualizado?",
      answer: "Sim. Durante 6 meses após a compra você recebe as novas versões automaticamente, sem custo adicional."
    },
    {
      question: "Posso acessar offline?",
      answer: "Pode sim! Baixe o PDF no seu celular ou tablet e consulte tudo offline enquanto estiver na ilha."
    },
    {
      question: "Existe garantia?",
      answer: "Se o guia não ajudar sua viagem, basta responder o e-mail de entrega em até 7 dias que devolvemos 100% do valor."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white py-16 px-4">
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
                  Tudo que você precisa para planejar uma viagem inesquecível: roteiros práticos, planilhas editáveis, contatos confiáveis e os segredos de quem vive a ilha todos os dias.
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
                  disabled={isLoading}
                  className="gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-6 text-lg font-semibold text-white shadow-lg hover:from-blue-600 hover:via-blue-600 hover:to-blue-500"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Quero o Guia Exclusivo
                      <Sparkles className="h-5 w-5" />
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <ShieldCheck className="h-5 w-5" /> Atualizações gratuitas por 6 meses
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
                <CardTitle className="text-2xl font-semibold text-gray-900">Guia Exclusivo</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Pagamento único, acesso vitalício ao material atual e às atualizações por 6 meses.
                </CardDescription>
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
              <CardFooter className="relative flex flex-col gap-3 pt-4 text-center text-sm text-gray-600">
                <Button
                  onClick={handleBuyGuide}
                  disabled={isLoading}
                  className="w-full rounded-full bg-blue-600 py-6 text-base font-semibold text-white shadow-lg hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Comprar agora"
                  )}
                </Button>
                <p>Pagamento protegido pelo Mercado Pago. Envio imediato do PDF e materiais extras.</p>
                <p className="text-xs text-gray-500">
                  Em caso de dúvidas, basta responder o e-mail de confirmação ou falar com nosso time.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Highlights */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Dentro do Guia
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">O que você vai explorar</h2>
            <p className="mt-2 text-base text-gray-600">
              Transforme seus dias na ilha com roteiros inteligentes, segredos locais e recomendações confiáveis.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {guideHighlights.map((highlight, index) => (
              <div
                key={index}
                className="group relative flex h-full flex-col gap-3 rounded-2xl border border-blue-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {highlight.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{highlight.title}</h3>
                <p className="text-sm text-gray-600">{highlight.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bonuses and Steps */}
        <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <Card className="border-blue-100 bg-white/85 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Bônus que facilitam o planejamento</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Materiais complementares para organizar finanças, reservas e experiências.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bonuses.map((bonus, index) => (
                <div key={index} className="flex items-start gap-3 rounded-xl bg-blue-50/60 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span className="text-sm text-gray-600">{bonus}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-blue-500/10 via-white to-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Como funciona na prática</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-blue-100/70 bg-white/90 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    {step.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Testimonials */}
        <section className="space-y-6">
          <div className="flex flex-col gap-3 text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Experiências reais
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Quem já viajou com o Guia</h2>
            <p className="text-base text-gray-600">
              Histórias de viajantes que usaram o material para viver Noronha sem perrengues.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex h-full flex-col gap-4 rounded-3xl border border-blue-100 bg-white/85 p-6 text-left shadow-sm"
              >
                <Quote className="h-5 w-5 text-blue-400" />
                <p className="text-base text-gray-700">
                  {testimonial.quote}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Dúvidas frequentes
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Perguntas frequentes</h2>
            <p className="mt-2 text-base text-gray-600">
              Tudo o que você precisa saber antes de garantir o seu Guia Exclusivo.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-blue-100 bg-white/85 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 px-8 py-10 text-white shadow-xl">
          <div className="pointer-events-none absolute -top-10 right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-bold">Pronto para explorar Noronha com confiança?</h2>
              <p className="text-base text-white/80">
                Garanta agora o Guia Exclusivo e siga um passo a passo completo para cada dia da viagem, sem perder tempo pesquisando.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-5 w-5" /> Garantia de 7 dias: se não amar, devolvemos seu dinheiro.
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleBuyGuide}
                disabled={isLoading}
                className="rounded-full bg-white px-6 py-6 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Quero receber agora"
                )}
              </Button>
              <p className="text-center text-xs text-white/80">
                Pagamento único de R$ 99,90 via Mercado Pago • Envio imediato
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
