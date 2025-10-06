"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Camera,
  CheckCircle2,
  Compass,
  Map,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../../convex/_generated/api";
import { guaranteePoints, launchBonuses } from "./guideHighlights";

interface GuideSubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideSubscriptionPopup({ isOpen, onClose }: GuideSubscriptionPopupProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [activePanel, setActivePanel] = useState<"benefits" | "content" | "reviews">("benefits");

  const currentSubscription = useQuery(
    api.domains.subscriptions.queries.getCurrentSubscription,
    isLoaded && user ? {} : "skip",
  );

  useEffect(() => {
    if (currentSubscription?.status === "authorized") {
      onClose();
    }
  }, [currentSubscription, onClose]);

  const handleCTA = () => {
    const target = "/meu-painel/guia/assinar";
    if (!user) {
      router.push(`/sign-in?redirect_url=${target}`);
    } else {
      router.push(target);
    }
    onClose();
  };

  const stats = useMemo(
    () => [
      {
        icon: Users,
        label: "Viajantes guiados",
        helper: "desde 2022",
        value: "500+",
      },
      {
        icon: Star,
        label: "Avaliação média",
        helper: "avaliações reais",
        value: "4,9",
      },
      {
        icon: BadgeCheck,
        label: "Planejamentos concluídos",
        helper: "sem estresse",
        value: "95%",
      },
    ],
    [],
  );

  const benefitCards = useMemo(
    () => [
      {
        icon: Map,
        title: "Roteiro sob medida",
        description: "Sequências prontas para 4 a 7 dias com horários ideais e alertas de maré.",
      },
      {
        icon: Camera,
        title: "Spots secretos",
        description: "Locais pouco conhecidos, com dicas para fotos sem multidão.",
      },
      {
        icon: Compass,
        title: "Decisões rápidas",
        description: "Tabela de clima, logística e valores para comparar passeios em minutos.",
      },
    ],
    [],
  );

  const contentHighlights = useMemo(
    () => [
      "Checklists editáveis para mala, mergulho e crianças",
      "Calendário de maré e vento integrado ao roteiro",
      "Contatos verificados de guias, transfers e experiências",
      "Alertas automáticos quando houver bloqueios ou obras",
      "Planilhas de custos para controlar o orçamento da viagem",
      "Recomendações gastronômicas testadas pela equipe local",
    ],
    [],
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Marina Souza",
        quote:
          "Fizemos tudo sem perder tempo com filas ou pesquisa. O guia te segura pela mão do começo ao fim!",
        rating: 5,
      },
      {
        name: "Carlos Ribeiro",
        quote:
          "Reservamos os passeios certos e economizamos nos deslocamentos. Os alertas de maré salvaram nosso dia.",
        rating: 5,
      },
      {
        name: "Ana Paula",
        quote:
          "A curadoria gastronômica vale sozinha o investimento. Seguimos o plano e aproveitamos cada noite.",
        rating: 5,
      },
    ],
    [],
  );

  const steps = useMemo(
    () => [
      {
        title: "Assine em 2 minutos",
        body: "Pagamento seguro via Mercado Pago com liberação imediata do acesso.",
      },
      {
        title: "Personalize o roteiro",
        body: "Atualize as datas, escolha os passeios favoritos e receba alertas conforme o clima.",
      },
      {
        title: "Viaje com suporte",
        body: "Time local disponível no WhatsApp para ajustes de última hora durante toda a estada.",
      },
    ],
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="relative flex w-[min(96vw,1120px)] max-h-[95vh] flex-col overflow-hidden rounded-3xl border-2 border-blue-200/60 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-0 shadow-2xl lg:h-[90vh]"
        aria-describedby="guide-subscription-description"
      >
        <DialogTitle className="sr-only">
          Plano premium do Guia Interativo de Fernando de Noronha
        </DialogTitle>
        <p id="guide-subscription-description" className="sr-only">
          Tenha acesso a roteiros, alertas e suporte local para viajar por Fernando de Noronha sem perrengues.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:-translate-y-0.5 hover:scale-105 hover:bg-white"
          aria-label="Fechar oferta do guia"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[1.1fr,0.9fr]">
          {/* Informational column */}
          <div className="flex flex-col bg-white/70 backdrop-blur">
            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-8 lg:px-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <Badge className="inline-flex items-center gap-2 border-0 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-white shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  Atualização verão 2025
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold leading-tight text-slate-900 lg:text-5xl">
                    Planeje Noronha
                    <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                      como um morador
                    </span>
                  </h2>
                  <p className="text-base text-slate-600 lg:text-lg">
                    Receba um plano diário validado por quem vive na ilha, com alertas de maré, contatos confiáveis e ajustes em tempo real.
                  </p>
                </div>
              </motion.div>

              <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
                <div className="relative h-56 w-full">
                  <Image
                    src="/images/praias-hero.png"
                    alt="Vista aérea das praias de Fernando de Noronha"
                    fill
                    priority
                    className="object-cover"
                    sizes="(min-width: 1024px) 500px, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-blue-600/20 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between gap-4 text-white">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/70">Preview do guia</p>
                      <p className="text-lg font-semibold leading-tight">
                        Sequência perfeita para 7 dias de Noronha
                      </p>
                    </div>
                    <div className="hidden rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider sm:flex sm:items-center sm:gap-2">
                      <Compass className="h-4 w-4" />
                      Insider tips
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 border-t border-blue-100/80 bg-white/80 px-6 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">Atualizado em</p>
                    <p className="text-base font-semibold text-slate-900">Janeiro 2025</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium text-slate-600">
                      Alertas climáticos incluídos durante 6 meses
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <span className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <stat.icon className="relative z-10 mb-2 h-6 w-6 text-blue-500" />
                    <p className="relative z-10 text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="relative z-10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {stat.helper}
                    </p>
                    <p className="relative z-10 mt-1 text-sm text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-2">
                  {(
                    [
                      { id: "benefits", label: "Por que funciona" },
                      { id: "content", label: "O que está incluso" },
                      { id: "reviews", label: "Quem já usou" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivePanel(tab.id)}
                      className={`${
                        activePanel === tab.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      } rounded-xl px-4 py-2 text-sm font-semibold transition-all`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <AnimatePresence mode="wait">
                    {activePanel === "benefits" && (
                      <motion.div
                        key="benefits"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                        className="grid gap-5 px-6 py-6 sm:grid-cols-3"
                      >
                        {benefitCards.map((item) => (
                          <div key={item.title} className="flex flex-col gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="text-sm text-slate-600">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {activePanel === "content" && (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 px-6 py-6"
                      >
                        {contentHighlights.map((line) => (
                          <div key={line} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                            <p className="text-sm text-slate-600">{line}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {activePanel === "reviews" && (
                      <motion.div
                        key="reviews"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 px-6 py-6"
                      >
                        {testimonials.map((review) => (
                          <div key={review.name} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-center gap-2">
                              {Array.from({ length: review.rating }).map((_, idx) => (
                                <Star key={idx} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="text-sm font-semibold text-slate-800">{review.name}</span>
                            </div>
                            <p className="mt-3 text-sm italic text-slate-600">“{review.quote}”</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Badge className="border border-blue-200 bg-blue-100 text-blue-700">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Em três passos simples
                  </Badge>
                  <span className="hidden text-sm text-slate-500 lg:block">Do pagamento à viagem sem perrengue</span>
                </div>
                <div className="space-y-5">
                  {steps.map((step, index) => (
                    <div key={step.title} className="flex items-start gap-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-semibold text-white shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{step.title}</p>
                        <p className="text-sm text-slate-600">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Offer column */}
          <div className="flex flex-col bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-8 text-white lg:px-9">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                  <Shield className="h-4 w-4" />
                  Acesso por 12 meses
                </div>
                <div className="flex items-end gap-3">
                  <div className="text-5xl font-bold lg:text-6xl">R$ 99</div>
                  <div className="text-white/80">
                    <div className="text-sm">,90</div>
                    <div className="text-xs">pagamento único</div>
                  </div>
                </div>
                <p className="text-sm text-blue-100 lg:text-base">Menos de R$ 8,50 por mês para viajar com suporte local.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">O que você destrava:</h3>
                {[
                  "Roteiros prontos e ajustáveis por duração",
                  "Calendário inteligente de marés e clima",
                  "Contatos verificados de passeios e transfers",
                  "Alertas instantâneos quando houver mudanças",
                  "Suporte pelo WhatsApp antes e durante a viagem",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-white/90">
                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  <Zap className="h-4 w-4" />
                  Bônus de lançamento
                </div>
                <div className="space-y-3">
                  {launchBonuses.map((bonus) => (
                    <div key={bonus.title} className="rounded-2xl border border-white/20 bg-white/15 p-4">
                      <p className="text-sm font-semibold">{bonus.title}</p>
                      <p className="text-xs text-white/80">{bonus.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <Button
                  onClick={handleCTA}
                  className="group w-full justify-center rounded-2xl bg-white px-6 py-6 text-lg font-bold text-blue-600 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Garantir acesso agora
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/90">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Shield className="h-4 w-4" />
                    Garantia tranquilidade
                  </div>
                  <p className="mb-3 text-xs text-white/80">
                    Ajustamos o plano com você ou devolvemos o investimento em até 7 dias se o guia não encantar.
                  </p>
                  <ul className="space-y-2 text-xs text-white/80">
                    {guaranteePoints.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-200" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-white/20 px-6 py-5 text-xs text-white/80 lg:px-9">
                  <div className="flex flex-wrap items-center justify-center gap-6">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Pagamento seguro
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Avaliado em 4,9/5
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  500+ viajantes felizes
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
