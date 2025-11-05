"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Sparkles, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const preapprovalId = searchParams.get("preapproval_id");
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    // Limpar localStorage após sucesso
    localStorage.removeItem("pending_subscription_user_id");
    localStorage.removeItem("pending_subscription_email");
    
    // Log para debug
    console.log("[Subscription Success]", {
      preapprovalId,
      externalReference,
      userId: user?.id,
    });
  }, [preapprovalId, externalReference, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Assinatura Ativada! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Bem-vindo ao Guia Digital Exclusivo de Fernando de Noronha
          </p>
        </div>

        {/* Success Card */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Sua assinatura está ativa!</h3>
                <p className="text-sm text-gray-600">
                  Você agora tem acesso completo ao painel de guia com roteiros exclusivos, 
                  dicas de viagem e contatos confiáveis de Fernando de Noronha.
                </p>
              </div>
            </div>

            {preapprovalId && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-xs text-gray-500 mb-1">ID da Assinatura</p>
                <p className="text-sm font-mono text-gray-700">{preapprovalId}</p>
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Acesso imediato ao painel de guia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Válido por 1 ano</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Atualizações gratuitas por 6 meses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Renovação automática (pode cancelar a qualquer momento)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
          >
            <Link href="/meu-painel/guia">
              <Sparkles className="mr-2 h-5 w-5" />
              Acessar Painel de Guia
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Link href="/meu-painel">
              <Home className="mr-2 h-5 w-5" />
              Voltar ao Painel
            </Link>
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">📧 Confirma ção por Email</h3>
            <p className="text-sm text-gray-600">
              Enviamos um email de confirmação com os detalhes da sua assinatura. 
              Você pode gerenciar sua assinatura a qualquer momento através do app do Mercado Pago.
            </p>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Dúvidas? Entre em contato:{" "}
            <a href="mailto:suporte@tucanoronha.com" className="text-blue-600 hover:underline">
              suporte@tucanoronha.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
