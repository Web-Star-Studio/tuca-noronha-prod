"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const preferenceId = searchParams.get("preference_id");

  // Get payment details if we have a payment ID
  const paymentStatus = useQuery(
    api.domains.payments.queries.getPaymentStatus,
    paymentId && preferenceId ? { proposalId: preferenceId as any } : "skip"
  );

  useEffect(() => {
    // Set loading to false after a short delay to show the success animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Processando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              Pagamento Aprovado!
            </h1>
            <p className="text-green-600 text-lg">
              Sua viagem foi confirmada com sucesso
            </p>
          </div>

          {/* Payment Details Card */}
          <Card className="mb-6 border-green-200 shadow-lg">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Detalhes do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paymentId && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">ID do Pagamento:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {paymentId}
                    </span>
                  </div>
                )}
                
                {status && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600 capitalize">
                      {status === "approved" ? "Aprovado" : status}
                    </span>
                  </div>
                )}

                {paymentStatus?.paymentData?.finalAmount && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Valor Pago:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(paymentStatus.paymentData.finalAmount)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Comprovante será enviado por email
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="mb-6 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Documentos de Viagem</p>
                    <p className="text-sm text-gray-600">
                      Você receberá os documentos contratuais e vouchers por email
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Contato da Equipe</p>
                    <p className="text-sm text-gray-600">
                      Nossa equipe entrará em contato para finalizar os detalhes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Aproveite sua Viagem!</p>
                    <p className="text-sm text-gray-600">
                      Prepare-se para uma experiência incrível
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              asChild 
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Link href="/meu-painel">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir para Meu Painel
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
              size="lg"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>

          {/* Support Info */}
          <Card className="mt-6 border-gray-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Precisa de ajuda? Entre em contato conosco:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
                <a 
                  href="mailto:contato@exemplo.com" 
                  className="text-blue-600 hover:underline"
                >
                  contato@exemplo.com
                </a>
                <span className="hidden sm:inline text-gray-400">•</span>
                <a 
                  href="tel:+5511999999999" 
                  className="text-blue-600 hover:underline"
                >
                  (11) 99999-9999
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
