"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Sparkles, 
  Map, 
  Camera, 
  ChevronRight,
  Star,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GuideSubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideSubscriptionPopup({ isOpen, onClose }: GuideSubscriptionPopupProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"benefits" | "content" | "social">("benefits");
  
  const currentSubscription = useQuery(
    api.domains.subscriptions.queries.getCurrentSubscription,
    isLoaded && user ? {} : "skip"
  );

  // Close if user has active subscription
  useEffect(() => {
    if (currentSubscription?.status === "authorized") {
      onClose();
    }
  }, [currentSubscription, onClose]);

  const handleCTA = () => {
    if (!user) {
      // Redirect to sign in, then to subscription page
      router.push("/sign-in?redirect_url=/meu-painel/guia/assinar");
    } else {
      router.push("/meu-painel/guia/assinar");
    }
    onClose();
  };

  const stats = [
    { icon: Users, value: "500+", label: "Viajantes satisfeitos" },
    { icon: Star, value: "4.9", label: "Avaliação média" },
    { icon: TrendingUp, value: "95%", label: "Taxa de sucesso" },
  ];

  const benefits = [
    {
      icon: Map,
      title: "Roteiros Dia a Dia",
      description: "Planejamento completo com horários otimizados para aproveitar cada minuto",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Camera,
      title: "Spots Secretos",
      description: "Lugares exclusivos para fotos que só quem mora na ilha conhece",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Zap,
      title: "Acesso Imediato",
      description: "Comece a planejar agora mesmo, disponível 24/7 no seu dispositivo",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Shield,
      title: "Atualizações Grátis",
      description: "6 meses de updates com novos conteúdos e dicas exclusivas",
      gradient: "from-green-500 to-emerald-500"
    },
  ];

  const contentHighlights = [
    "Melhores praias por período do dia",
    "Contatos confiáveis de guias locais",
    "Dicas de economia e otimização",
    "Rotas de mergulho e trilhas",
    "Restaurantes testados e aprovados",
    "Checklist completo pré-viagem"
  ];

  const socialProof = [
    {
      name: "Marina S.",
      text: "Economizei dias de pesquisa! O guia é completo e atualizado. Valeu cada centavo.",
      rating: 5
    },
    {
      name: "Carlos R.",
      text: "Os spots secretos fizeram toda diferença. Conseguimos fotos incríveis sem aglomeração!",
      rating: 5
    },
    {
      name: "Ana Paula",
      text: "Roteiro perfeito! Seguimos dia a dia e aproveitamos tudo sem estresse.",
      rating: 5
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[95vh] overflow-hidden p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 border-2 border-blue-200/50"
        aria-describedby="guide-subscription-description"
      >
        <DialogTitle className="sr-only">
          Guia Exclusivo de Fernando de Noronha - Oferta Especial
        </DialogTitle>
        
        <div id="guide-subscription-description" className="sr-only">
          Assine o guia exclusivo de Fernando de Noronha e tenha acesso a roteiros completos, spots secretos e dicas de quem vive na ilha.
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 group"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
        </button>

        <div className="grid lg:grid-cols-[1.2fr,1fr] h-full overflow-hidden">
          {/* LEFT SIDE - Main Content */}
          <div className="relative overflow-y-auto p-8 lg:p-12 bg-white/40 backdrop-blur-sm">
            {/* Floating particles decoration */}
            <div className="absolute top-20 right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            
            <div className="relative z-10 space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Oferta Exclusiva 2025
                  </Badge>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl lg:text-5xl font-bold leading-tight"
                >
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Desvende Noronha
                  </span>
                  <br />
                  <span className="text-gray-900">como um Local</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg text-gray-600 max-w-xl"
                >
                  Pare de perder tempo pesquisando. Acesse roteiros prontos, contatos confiáveis e os segredos da ilha em um só lugar.
                </motion.p>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-3 gap-4"
              >
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <stat.icon className="h-6 w-6 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Tabs */}
              <div className="space-y-6">
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
                  {(["benefits", "content", "social"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        activeTab === tab
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab === "benefits" && "Benefícios"}
                      {tab === "content" && "Conteúdo"}
                      {tab === "social" && "Avaliações"}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "benefits" && (
                    <motion.div
                      key="benefits"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid sm:grid-cols-2 gap-4"
                    >
                      {benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <benefit.icon className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2">{benefit.title}</h4>
                          <p className="text-sm text-gray-600">{benefit.description}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === "content" && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                    >
                      <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        O que você vai encontrar
                      </h4>
                      <div className="grid gap-3">
                        {contentHighlights.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 group">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "social" && (
                    <motion.div
                      key="social"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {socialProof.map((review, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">{review.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 italic">&ldquo;{review.text}&rdquo;</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - CTA Section */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-8">
              {/* Price Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="text-sm text-white font-semibold">Acesso por 1 ano completo</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold text-white">R$ 99</span>
                    <div className="text-white/80">
                      <div className="text-sm">,90</div>
                      <div className="text-xs">único</div>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm">Menos de R$ 8,50 por mês</p>
                </div>
              </div>

              {/* Included Features */}
              <div className="space-y-3">
                <h4 className="text-white font-bold text-lg">Incluso na assinatura:</h4>
                {[
                  "✨ Guia completo atualizado 2025",
                  "🗺️ Roteiros dia a dia detalhados",
                  "📸 Spots secretos para fotos",
                  "🔄 Atualizações grátis por 6 meses",
                  "📱 Acesso ilimitado em todos dispositivos",
                  "🎯 Suporte via WhatsApp"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="space-y-4">
                <Button
                  onClick={handleCTA}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 text-lg font-bold py-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
                >
                  <span>Garantir Meu Acesso Agora</span>
                  <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Pagamento 100% seguro via Mercado Pago</span>
                  </div>
                  <p className="text-xs text-white/70">
                    Acesso imediato após confirmação do pagamento
                  </p>
                </div>
              </div>

              {/* Urgency Element */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white">
                    <p className="font-semibold mb-1">Planeje sua viagem agora!</p>
                    <p className="text-white/80 text-xs">
                      Mais de 100 pessoas acessaram o guia esta semana. Não deixe para última hora.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust badges at bottom */}
            <div className="relative z-10 pt-6 border-t border-white/20">
              <div className="flex items-center justify-center gap-6 text-white/80 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>4.9/5 estrelas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>500+ clientes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
