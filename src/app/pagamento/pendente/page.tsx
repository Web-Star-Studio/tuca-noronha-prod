"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, RefreshCw, ArrowLeft, AlertTriangle, Home, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const paymentType = searchParams.get("payment_type_id");

  const handleRefresh = async () => {
    setRefreshing(true);
    // Wait a moment to show the loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  const getStatusMessage = () => {
    if (paymentType === "bank_transfer" || paymentType === "pix") {
      return "Aguardando confirmação do PIX ou transferência bancária";
    }
    if (paymentType === "ticket") {
      return "Aguardando pagamento do boleto bancário";
    }
    return "Pagamento em análise";
  };

  const getTimeframe = () => {
    if (paymentType === "pix") {
      return "até 24 horas";
    }
    if (paymentType === "ticket") {
      return "1-3 dias úteis";
    }
    return "24-48 horas";
  };

  const getInstructions = () => {
    if (paymentType === "pix") {
      return [
        "Seu pagamento via PIX está sendo processado",
        "A confirmação pode levar até 24 horas",
        "Você receberá um email quando for aprovado",
        "Não é necessário fazer nada no momento",
      ];
    }
    if (paymentType === "ticket") {
      return [
        "Seu boleto foi gerado com sucesso",
        "O pagamento pode levar 1-3 dias úteis para ser confirmado",
        "Guarde o comprovante de pagamento",
        "Você receberá um email de confirmação",
      ];
    }
    return [
      "Seu pagamento está sendo analisado",
      "A confirmação pode levar até 48 horas",
      "Você será notificado por email",
      "Não é necessário tomar nenhuma ação",
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          {/* Pending Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
              <Clock className="h-10 w-10 text-yellow-600 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-800 mb-2">
              Pagamento Pendente
            </h1>
            <p className="text-yellow-600 text-lg">
              {getStatusMessage()}
            </p>
          </div>

          {/* Status Card */}
          <Card className="mb-6 border-yellow-200 shadow-lg">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">Aguardando Confirmação</p>
                  </div>
                  <p className="text-yellow-700">
                    Seu pagamento está sendo processado. O prazo de confirmação é de {getTimeframe()}.
                  </p>
                </div>

                {paymentId && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">ID do Pagamento:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {paymentId}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Status Atual:</span>
                  <span className="font-semibold text-yellow-600 capitalize">
                    {status === "pending" ? "Pendente" : 
                     status === "in_process" ? "Em Processamento" : status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Previsão:</span>
                  <span className="font-semibold text-gray-800">
                    {getTimeframe()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="mb-6 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">O que acontece agora?</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getInstructions().map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{instruction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracker */}
          <Card className="mb-6 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Progresso do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Proposta aceita</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Dados dos participantes enviados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Voos confirmados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Documentos enviados</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <span className="text-yellow-700 font-medium">Pagamento em processamento</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  <span className="text-gray-500">Viagem confirmada</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status
                </>
              )}
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="flex-1 border-gray-300"
              size="lg"
            >
              <Link href="/meu-painel">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir para Meu Painel
              </Link>
            </Button>
          </div>

          {/* Important Info */}
          <Card className="mb-6 border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="text-orange-800">Importante</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-orange-700">
                    <strong>Não faça o pagamento novamente.</strong> Aguarde a confirmação do pagamento atual.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-orange-700">
                    Você receberá um email assim que o pagamento for confirmado.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-orange-700">
                    Se tiver dúvidas, entre em contato conosco.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Precisa de ajuda ou tem alguma dúvida?
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
