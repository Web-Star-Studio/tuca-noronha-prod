"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processingTime, setProcessingTime] = useState(0);

  const proposalId = searchParams.get("proposal_id");
  const preferenceId = searchParams.get("preference_id");

  useEffect(() => {
    // Start timer
    const timer = setInterval(() => {
      setProcessingTime(prev => prev + 1);
    }, 1000);

    // Auto redirect after 30 seconds
    const autoRedirect = setTimeout(() => {
      router.push("/meu-painel");
    }, 30000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoRedirect);
    };
  }, [router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          {/* Processing Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              Processando Pagamento
            </h1>
            <p className="text-blue-600 text-lg">
              Criando sua preferência de pagamento no Mercado Pago
            </p>
          </div>

          {/* Processing Details */}
          <Card className="mb-6 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status do Processamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Tempo decorrido:</span>
                  <span className="font-mono text-lg bg-blue-100 px-3 py-1 rounded">
                    {formatTime(processingTime)}
                  </span>
                </div>

                {proposalId && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Proposta ID:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {proposalId}
                    </span>
                  </div>
                )}

                {preferenceId && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Preferência:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {preferenceId}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Criando preferência no Mercado Pago...</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm">Aguardando redirecionamento...</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mb-6 border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-yellow-800">O que está acontecendo?</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Criando Pagamento</p>
                    <p className="text-sm text-gray-600">
                      Estamos preparando sua preferência de pagamento no Mercado Pago
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Redirecionamento</p>
                    <p className="text-sm text-gray-600">
                      Você será redirecionado automaticamente para o checkout do Mercado Pago
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Finalizar Pagamento</p>
                    <p className="text-sm text-gray-600">
                      Complete o pagamento no Mercado Pago para confirmar sua viagem
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
              size="lg"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Verificar Status
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

          {/* Support Info */}
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Processamento demorado?</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Se o redirecionamento não acontecer em alguns minutos, entre em contato conosco
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

          {/* Auto Redirect Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Você será redirecionado automaticamente para seu painel em {30 - processingTime} segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
