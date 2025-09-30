"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw, MessageCircle, Home } from "lucide-react";
import Link from "next/link";

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const statusDetail = searchParams.get("status_detail");

  const getErrorMessage = () => {
    const detail = statusDetail?.toLowerCase();
    
    if (detail?.includes("rejected")) {
      return "Pagamento rejeitado pelo banco. Verifique os dados do cartão e tente novamente.";
    }
    if (detail?.includes("insufficient")) {
      return "Saldo ou limite insuficiente. Tente com outro cartão ou método de pagamento.";
    }
    if (detail?.includes("expired")) {
      return "Cartão expirado. Verifique a data de validade do seu cartão.";
    }
    if (detail?.includes("security")) {
      return "Transação rejeitada por motivos de segurança. Entre em contato com seu banco.";
    }
    
    return "Não foi possível processar o pagamento. Tente novamente ou use outro método.";
  };

  const getSuggestions = () => {
    const detail = statusDetail?.toLowerCase();
    
    const commonSuggestions = [
      "Verifique se os dados do cartão estão corretos",
      "Certifique-se de que há saldo/limite suficiente",
      "Tente com outro cartão ou método de pagamento",
    ];

    if (detail?.includes("security")) {
      return [
        "Entre em contato com seu banco para liberar a transação",
        "Verifique se o cartão está bloqueado",
        ...commonSuggestions,
      ];
    }

    return commonSuggestions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          {/* Error Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-800 mb-2">
              Pagamento Não Aprovado
            </h1>
            <p className="text-red-600 text-lg">
              Ocorreu um problema ao processar seu pagamento
            </p>
          </div>

          {/* Error Details Card */}
          <Card className="mb-6 border-red-200 shadow-lg">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Detalhes do Erro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium mb-2">Motivo:</p>
                  <p className="text-red-700">{getErrorMessage()}</p>
                </div>

                {paymentId && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">ID da Tentativa:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {paymentId}
                    </span>
                  </div>
                )}
                
                {status && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="font-semibold text-red-600 capitalize">
                      {status === "rejected" ? "Rejeitado" : 
                       status === "cancelled" ? "Cancelado" : status}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Card */}
          <Card className="mb-6 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">O que você pode fazer?</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getSuggestions().map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
              onClick={() => router.back()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="flex-1 border-gray-300"
              size="lg"
            >
              <Link href="/meu-painel">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Link>
            </Button>
          </div>

          {/* Alternative Payment Methods */}
          <Card className="mb-6 border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-yellow-800">Métodos Alternativos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Se continuar tendo problemas, você pode:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Usar um cartão de crédito diferente</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Tentar com PIX ou boleto bancário</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Entrar em contato com nossa equipe</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Precisa de Ajuda?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Nossa equipe está pronta para ajudar você a resolver este problema
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline" size="sm">
                  <a href="mailto:contato@exemplo.com">
                    Enviar Email
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="tel:+5511999999999">
                    Ligar Agora
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Página Inicial
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
