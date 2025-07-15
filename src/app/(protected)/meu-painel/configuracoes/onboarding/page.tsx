"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { usePartner } from "@/lib/hooks/usePartner";
import Link from "next/link";

export default function OnboardingCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { partner, refreshOnboardingLink } = usePartner();
  
  const success = searchParams.get("success") === "true";
  const refresh = searchParams.get("refresh") === "true";
  
  useEffect(() => {
    // Se for sucesso e o partner estiver completo, redirecionar após 3 segundos
    if (success && partner?.onboardingStatus === "completed") {
      const timer = setTimeout(() => {
        router.push("/meu-painel/configuracoes");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, partner, router]);

  // Página de refresh (link expirado)
  if (refresh) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Link Expirado</CardTitle>
                <CardDescription>
                  O link de onboarding expirou ou precisa ser atualizado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Os links de onboarding expiram após alguns minutos por questões de segurança.
                Clique no botão abaixo para gerar um novo link e continuar o processo.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (partner?.stripeAccountId) {
                    const { onboardingUrl } = await refreshOnboardingLink({
                      stripeAccountId: partner.stripeAccountId,
                    });
                    window.location.href = onboardingUrl;
                  }
                }}
                disabled={!partner}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar Novo Link
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/meu-painel/configuracoes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Página de sucesso
  if (success) {
    // Verificar status real do onboarding
    const isComplete = partner?.onboardingStatus === "completed";
    const isInProgress = partner?.onboardingStatus === "in_progress";
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {isComplete ? (
                <>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Onboarding Concluído!</CardTitle>
                    <CardDescription>
                      Sua conta está configurada e pronta para receber pagamentos
                    </CardDescription>
                  </div>
                </>
              ) : isInProgress ? (
                <>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <CardTitle>Processando Informações</CardTitle>
                    <CardDescription>
                      Suas informações estão sendo verificadas pelo Stripe
                    </CardDescription>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <RefreshCw className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle>Informações Salvas</CardTitle>
                    <CardDescription>
                      Suas informações foram salvas, mas o processo ainda não está completo
                    </CardDescription>
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isComplete ? (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Parabéns! Você completou todo o processo de onboarding.
                    Agora você pode começar a receber pagamentos através da plataforma.
                  </AlertDescription>
                </Alert>
                
                <p className="text-sm text-muted-foreground text-center">
                  Você será redirecionado automaticamente em alguns segundos...
                </p>
              </>
            ) : isInProgress ? (
              <>
                <Alert>
                  <AlertDescription>
                    O Stripe está verificando suas informações. Este processo pode levar
                    alguns minutos. Você receberá uma notificação quando tudo estiver pronto.
                  </AlertDescription>
                </Alert>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/meu-painel/configuracoes">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Configurações
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    Algumas informações ainda precisam ser fornecidas para completar
                    o processo. Você pode continuar de onde parou a qualquer momento.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (partner?.stripeAccountId) {
                        const { onboardingUrl } = await refreshOnboardingLink({
                          stripeAccountId: partner.stripeAccountId,
                        });
                        window.location.href = onboardingUrl;
                      }
                    }}
                    disabled={!partner}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Continuar Onboarding
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <Link href="/meu-painel/configuracoes">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Página de erro ou acesso direto
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Erro no Processo</CardTitle>
              <CardDescription>
                Houve um problema ao processar seu retorno do Stripe
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível identificar o status do seu onboarding.
              Por favor, tente novamente ou entre em contato com o suporte.
            </AlertDescription>
          </Alert>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/meu-painel/configuracoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Configurações
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 