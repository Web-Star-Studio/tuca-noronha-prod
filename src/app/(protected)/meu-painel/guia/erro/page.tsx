"use client";

import { useSearchParams } from "next/navigation";
import { XCircle, AlertTriangle, ArrowLeft, RefreshCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SubscriptionErrorPage() {
  const searchParams = useSearchParams();
  
  const error = searchParams.get("error");
  const paymentStatus = searchParams.get("payment_status");
  const statusDetail = searchParams.get("status_detail");

  // Determinar tipo de erro e mensagem apropriada
  const getErrorInfo = () => {
    if (paymentStatus === "rejected") {
      return {
        title: "Pagamento Recusado",
        description: "O pagamento da assinatura não foi autorizado.",
        icon: <XCircle className="w-12 h-12 text-red-600" />,
        color: "red",
      };
    }
    
    if (error === "cancelled" || paymentStatus === "cancelled") {
      return {
        title: "Assinatura Cancelada",
        description: "Você cancelou o processo de assinatura.",
        icon: <AlertTriangle className="w-12 h-12 text-yellow-600" />,
        color: "yellow",
      };
    }

    return {
      title: "Erro no Processamento",
      description: "Ocorreu um erro ao processar sua assinatura.",
      icon: <XCircle className="w-12 h-12 text-red-600" />,
      color: "red",
    };
  };

  const errorInfo = getErrorInfo();

  // Sugestões baseadas no tipo de erro
  const getSuggestions = () => {
    if (paymentStatus === "rejected") {
      return [
        "Verifique se o cartão tem limite disponível",
        "Confirme se os dados do cartão estão corretos",
        "Tente usar outro cartão de crédito",
        "Entre em contato com seu banco se o problema persistir",
      ];
    }

    if (error === "cancelled") {
      return [
        "Você pode tentar novamente quando quiser",
        "Sem taxas ou cobranças foram realizadas",
        "Seus dados estão seguros conosco",
      ];
    }

    return [
      "Tente novamente em alguns minutos",
      "Verifique sua conexão com a internet",
      "Se o erro persistir, entre em contato conosco",
    ];
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-${errorInfo.color}-50 via-white to-white py-16 px-4`}>
      <div className="max-w-3xl mx-auto">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-${errorInfo.color}-100 rounded-full mb-4`}>
            {errorInfo.icon}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-lg text-gray-600">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Details */}
        {statusDetail && (
          <Card className="border-2 border-gray-200 mb-6">
            <CardContent className="pt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Detalhes do Erro</p>
                <p className="text-sm text-gray-700">{statusDetail}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions Card */}
        <Card className={`border-2 border-${errorInfo.color}-200 bg-gradient-to-br from-${errorInfo.color}-50 to-white mb-6`}>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">O que você pode fazer:</h3>
            <ul className="space-y-2">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            asChild
            size="lg"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
          >
            <Link href="/meu-painel/guia/assinar">
              <RefreshCcw className="mr-2 h-5 w-5" />
              Tentar Novamente
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Link href="/meu-painel">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar ao Painel
            </Link>
          </Button>
        </div>

        {/* Support Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <MessageCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Precisa de Ajuda?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Nossa equipe está pronta para ajudar você a resolver qualquer problema.
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:suporte@tucanoronha.com" className="text-blue-600 hover:underline">
                      suporte@tucanoronha.com
                    </a>
                  </p>
                  <p>
                    <strong>WhatsApp:</strong>{" "}
                    <a href="https://wa.me/5581999999999" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      (81) 9 9999-9999
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Consulte nossa{" "}
            <Link href="/ajuda" className="text-blue-600 hover:underline">
              Central de Ajuda
            </Link>
            {" "}para mais informações
          </p>
        </div>
      </div>
    </div>
  );
}
