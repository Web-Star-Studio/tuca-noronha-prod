"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CreditCard, 
  Building2, 
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { usePartner } from "@/lib/hooks/usePartner";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { OnboardingStatus } from "./OnboardingStatus";
import { Id } from "@/convex/_generated/dataModel";

export function PartnerOnboarding() {
  const { user } = useUser();
  const { 
    partner, 
    canBePartner, 
    needsOnboarding,
    createStripeAccount,
    currentUser 
  } = usePartner();
  
  const [isCreating, setIsCreating] = useState(false);
  const [businessType, setBusinessType] = useState<"individual" | "company">("individual");
  const [businessName, setBusinessName] = useState("");

  // Se não pode ser partner, mostrar mensagem
  if (!canBePartner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>
            Apenas usuários com perfil de parceiro podem acessar esta funcionalidade.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Se já tem conta, mostrar status
  if (partner) {
    return <OnboardingStatus />;
  }

  const handleCreateAccount = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress || !currentUser?._id) {
      toast.error("Informações do usuário não encontradas");
      return;
    }

    if (businessType === "company" && !businessName.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    setIsCreating(true);
    try {
      const { stripeAccountId, onboardingUrl } = await createStripeAccount({
        userId: currentUser._id, // Usar ID do Convex
        email: user.emailAddresses[0].emailAddress,
        country: "BR", // Brasil como padrão
        businessType,
        businessName: businessType === "company" ? businessName : undefined,
      });

      toast.success("Conta criada com sucesso! Redirecionando...");
      
      // Aguardar um momento para o usuário ver a mensagem
      setTimeout(() => {
        window.location.href = onboardingUrl;
      }, 1500);
    } catch (error) {
      toast.error("Erro ao criar conta");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de Boas-vindas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo ao Sistema de Parceiros</CardTitle>
          <CardDescription className="text-base">
            Configure sua conta para começar a receber pagamentos através da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para receber pagamentos, você precisa configurar uma conta no Stripe Connect.
              Este processo é seguro e leva apenas alguns minutos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Card de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Conta de Pagamentos</CardTitle>
          <CardDescription>
            Escolha o tipo de conta e forneça as informações necessárias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Conta */}
          <div className="space-y-3">
            <Label>Tipo de Conta</Label>
            <RadioGroup
              value={businessType}
              onValueChange={(value) => setBusinessType(value as "individual" | "company")}
              disabled={isCreating}
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex-1 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 mt-0.5 text-gray-600" />
                    <div>
                      <div className="font-medium">Pessoa Física</div>
                      <div className="text-sm text-muted-foreground">
                        Para profissionais autônomos e MEIs
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="flex-1 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 mt-0.5 text-gray-600" />
                    <div>
                      <div className="font-medium">Pessoa Jurídica</div>
                      <div className="text-sm text-muted-foreground">
                        Para empresas com CNPJ
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Nome da Empresa (apenas para PJ) */}
          {businessType === "company" && (
            <div className="space-y-2">
              <Label htmlFor="businessName">Nome da Empresa</Label>
              <Input
                id="businessName"
                placeholder="Digite o nome da empresa"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isCreating}
              />
            </div>
          )}

          {/* Benefícios */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Benefícios da Conta de Parceiro</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Pagamentos Automáticos</div>
                  <div className="text-sm text-muted-foreground">
                    Receba pagamentos diretamente em sua conta bancária
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Dashboard Exclusivo</div>
                  <div className="text-sm text-muted-foreground">
                    Acompanhe suas vendas e transações em tempo real
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Segurança Garantida</div>
                  <div className="text-sm text-muted-foreground">
                    Processamento seguro com a tecnologia do Stripe
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <Button
            onClick={handleCreateAccount}
            disabled={isCreating || (businessType === "company" && !businessName.trim())}
            size="lg"
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Criar Conta e Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você será redirecionado para o Stripe para completar o processo.
            Suas informações são processadas de forma segura e criptografada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 