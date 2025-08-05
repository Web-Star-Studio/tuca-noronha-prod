"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Star, Shield, Calendar, CreditCard, Loader2, ArrowRight, ChevronRight, Sparkles, Globe, Users, TrendingUp, Zap, Award, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cardStyles, buttonStyles } from "@/lib/ui-config";

const benefits = [
  {
    icon: Star,
    title: "Conteúdo Exclusivo",
    description: "Acesso a dicas secretas e informações que só os locais conhecem"
  },
  {
    icon: Globe,
    title: "Atualizações Constantes", 
    description: "Guia sempre atualizado com as últimas novidades da ilha"
  },
  {
    icon: Shield,
    title: "Suporte Premium",
    description: "Tire suas dúvidas diretamente com nossos especialistas"
  },
  {
    icon: Calendar,
    title: "1 Ano de Acesso",
    description: "Planeje múltiplas viagens durante todo o ano"
  },
  {
    icon: Users,
    title: "Comunidade Exclusiva",
    description: "Conecte-se com outros viajantes e compartilhe experiências"
  },
  {
    icon: TrendingUp,
    title: "Economia Garantida",
    description: "Economize até 30% com nossas dicas e descontos exclusivos"
  }
];

const testimonials = [
  {
    name: "Maria Silva",
    location: "São Paulo, SP",
    rating: 5,
    comment: "O guia foi essencial para nossa viagem! Economizamos muito e conhecemos lugares incríveis.",
    avatar: "/images/avatar-1.jpg"
  },
  {
    name: "João Santos",
    location: "Rio de Janeiro, RJ",
    rating: 5,
    comment: "Vale cada centavo! As dicas de praias desertas foram as melhores.",
    avatar: "/images/avatar-2.jpg"
  },
  {
    name: "Ana Costa",
    location: "Belo Horizonte, MG",
    rating: 5,
    comment: "Planejei toda a viagem usando o guia. Foi perfeito do início ao fim!",
    avatar: "/images/avatar-3.jpg"
  }
];

const faqs = [
  {
    question: "Por quanto tempo terei acesso ao guia?",
    answer: "Você terá acesso completo ao guia por 1 ano a partir da data de assinatura. Durante esse período, receberá todas as atualizações e novos conteúdos."
  },
  {
    question: "Posso cancelar minha assinatura?",
    answer: "Sim! Você pode cancelar sua assinatura a qualquer momento através do portal do cliente. O acesso continuará até o final do período pago."
  },
  {
    question: "O pagamento é seguro?",
    answer: "Totalmente! Usamos o Stripe, uma das plataformas de pagamento mais seguras do mundo. Não armazenamos dados do seu cartão."
  },
  {
    question: "Receberei atualizações do guia?",
    answer: "Sim! O guia é constantemente atualizado com novas informações, e você receberá todas as atualizações durante sua assinatura."
  }
];

export default function GuiaAssinaturaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/meu-painel/guia";
  
  const { user, isLoading: userLoading } = useCurrentUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"benefits" | "testimonials" | "faq">("benefits");
  
  // Check if user already has subscription
  const hasSubscription = useQuery(
    api.domains.subscriptions.queries.hasActiveSubscription,
    user ? {} : undefined
  );

  // Create checkout session action
  const createCheckoutSession = useAction(api.domains.subscriptions.actions.createCheckoutSession);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
    }
    
    if (hasSubscription) {
      router.push(redirectUrl);
    }
  }, [user, userLoading, hasSubscription, router, redirectUrl]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar");
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await createCheckoutSession({
        userId: user._id,
        userEmail: user.email || "",
        userName: user.name,
        successUrl: `${window.location.origin}/guia-assinatura/sucesso?redirect=${encodeURIComponent(redirectUrl)}`,
        cancelUrl: window.location.href,
      });

      if (result.success && result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
      } else {
        toast.error(result.error || "Erro ao criar sessão de pagamento");
      }
    } catch {
      console.error("Erro no checkout:", error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  if (userLoading || hasSubscription === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-70" />
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Oferta Especial de Lançamento
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Seu Guia Completo de
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Fernando de Noronha</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Descubra todos os segredos da ilha paradisíaca com nosso guia exclusivo. 
                Economize tempo, dinheiro e aproveite ao máximo sua viagem dos sonhos.
              </p>

              {/* Price and CTA */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-5xl font-bold text-gray-900">R$ 99</span>
                  <span className="text-gray-500 line-through">R$ 149</span>
                  <Badge variant="destructive">33% OFF</Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  ✓ Acesso por 1 ano completo<br />
                  ✓ Atualizações incluídas<br />
                  ✓ Garantia de 7 dias
                </p>

                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className={cn(
                    buttonStyles.variant.default,
                    "w-full sm:w-auto text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Assinar Agora
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-4">
                  Pagamento seguro via Stripe • Cancele quando quiser
                </p>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Garantia de 7 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">+500 Assinantes</span>
                </div>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/noronha-hero.jpg"
                  alt="Fernando de Noronha"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                
                {/* Floating Stats */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4"
                >
                  {[
                    { label: "Praias", value: "21" },
                    { label: "Atividades", value: "50+" },
                    { label: "Restaurantes", value: "30+" }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              {[
                { id: "benefits", label: "Benefícios", icon: Zap },
                { id: "testimonials", label: "Depoimentos", icon: Heart },
                { id: "faq", label: "Perguntas", icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200",
                    selectedTab === tab.id
                      ? "bg-white shadow-sm text-indigo-600 font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {selectedTab === "benefits" && (
              <motion.div
                key="benefits"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(cardStyles.base, "p-6 hover:shadow-lg transition-shadow")}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedTab === "testimonials" && (
              <motion.div
                key="testimonials"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-3 gap-6"
              >
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(cardStyles.base, "p-6")}
                  >
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">&ldquo;{testimonial.comment}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div>
                        <p className="font-medium text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedTab === "faq" && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto space-y-4"
              >
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(cardStyles.base, "p-6")}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 ml-7">{faq.answer}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Pronto para Descobrir Fernando de Noronha?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Junte-se a mais de 500 viajantes que já transformaram suas viagens com nosso guia exclusivo.
            </p>
            
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={isProcessing}
              className={cn(
                buttonStyles.variant.default,
                "text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Garantir Meu Acesso por R$ 99
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-sm text-gray-500 mt-6">
              <Shield className="w-4 h-4 inline mr-1" />
              Garantia de satisfação de 7 dias ou seu dinheiro de volta
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 