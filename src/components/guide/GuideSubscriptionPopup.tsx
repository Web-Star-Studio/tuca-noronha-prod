"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  Clock,
  Award,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../../convex/_generated/api";
import { 
  guaranteePoints, 
  launchBonuses, 
  testimonials,
  mainBenefits,
  socialProof,
  urgencyMessages,
} from "./guideHighlights";

interface GuideSubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideSubscriptionPopup({ isOpen, onClose }: GuideSubscriptionPopupProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const hasGuideAccess = useQuery(
    api.domains.subscriptions.queries.hasGuideAccess,
    isLoaded ? {} : "skip"
  );

  useEffect(() => {
    if (hasGuideAccess) {
      onClose();
    }
  }, [hasGuideAccess, onClose]);

  const handleCTA = () => {
    const target = "/meu-painel/guia/assinar";
    if (!user) {
      router.push(`/sign-in?redirect_url=${target}`);
    } else {
      router.push(target);
    }
    onClose();
  };

  // Calcular valor total dos bônus
  const totalBonusValue = launchBonuses.reduce((acc, bonus) => {
    const value = parseInt(bonus.value.replace(/\D/g, ''));
    return acc + value;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] flex w-[min(96vw,1200px)] max-h-[95vh] flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl lg:h-[92vh] z-50"
        aria-describedby="guide-subscription-description"
      >
        <DialogTitle className="sr-only">
          Guia Completo de Fernando de Noronha - Economize Tempo e Dinheiro
        </DialogTitle>
        <p id="guide-subscription-description" className="sr-only">
          Pare de perder tempo pesquisando. Acesse o roteiro completo validado por quem vive na ilha.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all hover:bg-white hover:scale-110"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[1.05fr,0.95fr]">
          {/* LEFT COLUMN - Social Proof & Benefits */}
          <div className="flex flex-col bg-gradient-to-br from-white via-blue-50/30 to-white">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8 lg:px-10">
              
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    🔥 Limitado
                  </Badge>
                  <span className="text-xs text-gray-600 font-medium">{urgencyMessages.limited}</span>
                </div>
                
                <h2 className="text-3xl font-bold leading-tight text-gray-900 lg:text-5xl">
                  Pare de Perder Tempo
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Pesquisando Noronha
                  </span>
                </h2>
                
                <p className="text-lg text-gray-700 lg:text-xl font-medium">
                  <strong className="text-gray-900">3 dias de pesquisa</strong> em 500 blogs diferentes. Ou <strong className="text-blue-600">1 clique</strong> para o roteiro completo validado por moradores.
                </p>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{socialProof.travelers}</div>
                  <div className="text-xs text-gray-600 font-medium">Viajantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{socialProof.rating}⭐</div>
                  <div className="text-xs text-gray-600 font-medium">Avaliação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{socialProof.successRate}</div>
                  <div className="text-xs text-gray-600 font-medium">Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{socialProof.averageSavings}</div>
                  <div className="text-xs text-gray-600 font-medium">Economia</div>
                </div>
              </div>

              {/* Main Benefits - Result Focused */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  O Que Você Realmente Ganha:
                </h3>
                <div className="grid gap-3">
                  {mainBenefits.map((benefit) => (
                    <div key={benefit.title} className="bg-white rounded-xl p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{benefit.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{benefit.title}</h4>
                          <p className="text-sm text-gray-600">{benefit.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials - Social Proof */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Quem Já Usou Adorou:
                </h3>
                <div className="space-y-3">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.name} className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{testimonial.avatar}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{testimonial.name}</span>
                            <span className="text-xs text-gray-500">{testimonial.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          {testimonial.highlight}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Image */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div className="relative h-48 w-full">
                  <Image
                    src="/images/praias-hero.png"
                    alt="Preview do Guia Interativo"
                    fill
                    priority
                    className="object-cover"
                    sizes="(min-width: 1024px) 500px, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs mb-2">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Atualizado Jan/2025
                    </Badge>
                    <p className="text-white font-bold text-lg">Roteiro Completo + Spots Secretos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Offer & CTA */}
          <div className="flex flex-col bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8 text-white lg:px-8">
              
              {/* Urgency Banner */}
              <div className="bg-red-500 rounded-xl p-3 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-sm font-bold">
                  <Clock className="h-4 w-4" />
                  {urgencyMessages.popular}
                </div>
              </div>

              {/* Price Section */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Zap className="h-3 w-3" />
                  Oferta Limitada
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-white/70 line-through">De R$ {totalBonusValue + 99},90</span>
                </div>
                
                <div className="flex items-end gap-3">
                  <div className="text-6xl font-black">R$ 99</div>
                  <div className="text-white/90 pb-2">
                    <div className="text-xl font-bold">,90</div>
                    <div className="text-xs uppercase tracking-wide">à vista</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-300" />
                  <span className="font-semibold">Menos de R$ 8,50/mês • Acesso por 1 ano completo</span>
                </div>
              </div>

              {/* Main CTA */}
              <Button
                onClick={handleCTA}
                className="group w-full rounded-xl bg-white px-6 py-7 text-lg font-black text-blue-600 shadow-2xl transition-all hover:scale-105 hover:bg-yellow-300 hover:text-blue-700"
                size="lg"
              >
                <span className="mr-2">🎯</span>
                QUERO MEU ACESSO AGORA
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Button>

              <div className="text-center text-xs text-white/80">
                <Clock className="h-3 w-3 inline mr-1" />
                Acesso liberado em menos de 1 minuto
              </div>

              {/* Bonuses */}
              <div className="space-y-3">
                <div className="text-center">
                  <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold text-xs px-3 py-1">
                    🎁 BÔNUS GRÁTIS (Valor: R$ {totalBonusValue})
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {launchBonuses.map((bonus) => (
                    <div key={bonus.title} className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-bold">{bonus.title}</p>
                        <Badge className="bg-green-400 text-green-900 border-0 text-xs px-2 py-0.5 shrink-0">
                          {bonus.value}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/80">{bonus.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantee */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-green-300" />
                  <span className="font-bold text-lg">Garantia de 7 Dias</span>
                </div>
                <p className="text-sm text-white/90 mb-3">
                  Teste sem risco. Se não gostar, devolvemos <strong>100% do seu dinheiro</strong> - sem perguntas.
                </p>
                <div className="space-y-1.5">
                  {guaranteePoints.map((point) => (
                    <div key={point} className="flex items-start gap-2 text-xs text-white/80">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-300 mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary CTA */}
              <Button
                onClick={handleCTA}
                variant="outline"
                className="w-full rounded-xl border-2 border-white bg-transparent py-6 text-base font-bold text-white transition-all hover:bg-white hover:text-blue-600"
              >
                Sim, Quero Economizar Tempo e Dinheiro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

            </div>

            {/* Footer Trust Signals */}
            <div className="border-t border-white/20 bg-white/10 backdrop-blur-sm px-6 py-4">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/90">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-300" />
                  Pagamento 100% Seguro
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-300" />
                  {socialProof.rating}★ ({socialProof.travelers} Reviews)
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-200" />
                  {socialProof.successRate} Satisfeitos
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
