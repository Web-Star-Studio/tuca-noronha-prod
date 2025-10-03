"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Sparkles, 
  ChevronRight,
  Star,
  Shield,
  Zap,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

interface GuidePopupMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile-optimized version of the Guide Subscription Popup
 * Shown on screens < 768px for better UX
 */
export function GuidePopupMobile({ isOpen, onClose }: GuidePopupMobileProps) {
  const router = useRouter();
  const { user } = useUser();

  if (!isOpen) return null;

  const handleCTA = () => {
    if (!user) {
      router.push("/sign-in?redirect_url=/meu-painel/guia/assinar");
    } else {
      router.push("/meu-painel/guia/assinar");
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-h-[95vh] overflow-y-auto bg-gradient-to-b from-white to-blue-50 rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white shadow-lg p-2 hover:bg-gray-50"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-6 pb-8 space-y-6">
          {/* Header */}
          <div className="space-y-3 pt-2">
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Oferta Exclusiva 2025
            </Badge>
            
            <h2 className="text-3xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Desvende Noronha
              </span>
              <br />
              <span className="text-gray-900">como um Local</span>
            </h2>
            
            <p className="text-gray-600">
              Roteiros prontos, contatos confiáveis e segredos da ilha em um só lugar.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100 min-w-[100px]">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-xs text-gray-500">Viajantes</div>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100 min-w-[100px]">
              <div className="text-2xl font-bold text-blue-600">4.9★</div>
              <div className="text-xs text-gray-500">Avaliação</div>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100 min-w-[100px]">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-xs text-gray-500">Sucesso</div>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              O que você vai ter
            </h3>
            {[
              "🗺️ Roteiros dia a dia detalhados",
              "📸 Spots secretos para fotos",
              "💰 Dicas de economia testadas",
              "🔄 Atualizações grátis por 6 meses",
              "📱 Acesso em todos dispositivos",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-semibold text-gray-900">Marina S.</span>
            </div>
            <p className="text-sm text-gray-700 italic">
              &ldquo;Economizei dias de pesquisa! O guia é completo e atualizado. Valeu cada centavo.&rdquo;
            </p>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">R$ 99</span>
              <div className="text-blue-100">
                <div className="text-sm">,90</div>
                <div className="text-xs">único</div>
              </div>
            </div>
            <p className="text-blue-100 text-sm">Menos de R$ 8,50 por mês • Acesso por 1 ano</p>

            {/* CTA */}
            <Button
              onClick={handleCTA}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 text-lg font-bold py-6 rounded-xl shadow-xl"
            >
              <span>Garantir Meu Acesso</span>
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Trust */}
            <div className="flex items-center justify-center gap-2 text-white/90 text-xs pt-2">
              <Shield className="h-3 w-3" />
              <span>Pagamento seguro via Mercado Pago</span>
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900">
                <p className="font-semibold mb-1">Planeje agora!</p>
                <p className="text-orange-800">
                  +100 pessoas acessaram esta semana. Não deixe para última hora.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
