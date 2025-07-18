"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Loader2,
  RotateCw
} from "lucide-react";
import { useState } from "react";
import { usePartner } from "@/lib/hooks/usePartner";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

type OnboardingStatus = "pending" | "in_progress" | "completed" | "rejected";

const statusConfig: Record<OnboardingStatus, {
  label: string;
  color: "default" | "secondary" | "success" | "destructive";
  icon: React.ReactNode;
  progress: number;
}> = {
  pending: {
    label: "Não Iniciado",
    color: "default",
    icon: <Clock className="h-4 w-4" />,
    progress: 0,
  },
  in_progress: {
    label: "Em Andamento",
    color: "secondary",
    icon: <AlertCircle className="h-4 w-4" />,
    progress: 50,
  },
  completed: {
    label: "Concluído",
    color: "success",
    icon: <CheckCircle2 className="h-4 w-4" />,
    progress: 100,
  },
  rejected: {
    label: "Rejeitado",
    color: "destructive",
    icon: <XCircle className="h-4 w-4" />,
    progress: 0,
  },
};

export function OnboardingStatus() {
  const { 
    partner, 
    refreshOnboardingLink,
    createDashboardLink 
  } = usePartner();
  
  const syncPartnerStatus = useAction(api.domains.partners.actions.syncPartnerStatus);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!partner) {
    return null;
  }

  const status = partner.onboardingStatus;
  const config = statusConfig[status];

  const handleRefreshLink = async () => {
    if (!partner.stripeAccountId) return;
    
    setIsRefreshing(true);
    try {
      const { onboardingUrl } = await refreshOnboardingLink({
        stripeAccountId: partner.stripeAccountId,
      });
      
      window.open(onboardingUrl, "_blank");
      toast.success("Link de onboarding atualizado!");
    } catch (error) {
      toast.error("Erro ao gerar novo link de onboarding");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (!partner.stripeAccountId) return;
    
    setIsCreatingDashboard(true);
    try {
      const { dashboardUrl } = await createDashboardLink({
        stripeAccountId: partner.stripeAccountId,
      });
      
      window.open(dashboardUrl, "_blank");
    } catch (error) {
      toast.error("Erro ao abrir dashboard");
      console.error(error);
    } finally {
      setIsCreatingDashboard(false);
    }
  };

  const handleSyncStatus = async () => {
    if (!partner.stripeAccountId) return;
    
    setIsSyncing(true);
    try {
      const result = await syncPartnerStatus({
        stripeAccountId: partner.stripeAccountId,
      });
      
      toast.success(`Status sincronizado: ${statusConfig[result.status].label}`);
      
      // Aguardar um momento para o estado atualizar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error("Erro ao sincronizar status");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status do Onboarding</CardTitle>
            <CardDescription>
              Configure sua conta para começar a receber pagamentos
            </CardDescription>
          </div>
          <Badge variant={config.color} className="flex items-center gap-1">
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso</span>
            <span>{config.progress}%</span>
          </div>
          <Progress value={config.progress} className="h-2" />
        </div>

        {status === "pending" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Onboarding não iniciado</AlertTitle>
            <AlertDescription>
              Você precisa completar o processo de onboarding para começar a receber pagamentos.
              Clique no botão abaixo para continuar.
            </AlertDescription>
          </Alert>
        )}

        {status === "in_progress" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Onboarding em andamento</AlertTitle>
            <AlertDescription>
              Você já iniciou o processo, mas ainda há informações pendentes.
              Continue de onde parou para finalizar sua configuração.
            </AlertDescription>
          </Alert>
        )}

        {status === "completed" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Onboarding concluído!</AlertTitle>
            <AlertDescription className="text-green-700">
              Sua conta está configurada e pronta para receber pagamentos.
              Você pode acessar seu dashboard do Stripe a qualquer momento.
            </AlertDescription>
          </Alert>
        )}

        {status === "rejected" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Onboarding rejeitado</AlertTitle>
            <AlertDescription>
              Houve um problema com sua conta. Entre em contato com o suporte
              para mais informações.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {(status === "pending" || status === "in_progress") && (
            <Button 
              onClick={handleRefreshLink}
              disabled={isRefreshing}
              className="flex-1"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando link...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {status === "pending" ? "Iniciar Onboarding" : "Continuar Onboarding"}
                </>
              )}
            </Button>
          )}

          {status === "completed" && (
            <Button 
              onClick={handleOpenDashboard}
              disabled={isCreatingDashboard}
              className="flex-1"
            >
              {isCreatingDashboard ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Abrindo dashboard...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Acessar Dashboard Stripe
                </>
              )}
            </Button>
          )}
          
          {/* Botão de sincronização */}
          <Button
            onClick={handleSyncStatus}
            disabled={isSyncing}
            variant="outline"
            size="icon"
            title="Sincronizar status com o Stripe"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Capabilities Status */}
        {partner.capabilities && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Capacidades da Conta</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Pagamentos com Cartão</span>
                {partner.capabilities.cardPayments ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Transferências</span>
                {partner.capabilities.transfers ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 