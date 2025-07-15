"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  CreditCard, 
  Calendar, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function SubscriptionManager() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get subscription details
  const subscription = useQuery(
    api.domains.subscriptions.queries.getCurrentSubscription,
    user ? {} : undefined
  );
  
  // Get payment history
  const payments = useQuery(
    api.domains.subscriptions.queries.getPaymentHistory,
    user ? {} : undefined
  );
  
  // Create portal session action
  const createPortalSession = useAction(api.domains.subscriptions.actions.createPortalSession);
  
  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await createPortalSession({
        userId: user._id,
        returnUrl: window.location.href,
      });
      
      if (result.success && result.portalUrl) {
        window.location.href = result.portalUrl;
      } else {
        toast.error(result.error || "Erro ao abrir portal");
      }
    } catch (error) {
      console.error("Erro ao criar sessão do portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!subscription) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura ativa</h3>
          <p className="text-gray-600 mb-4">
            Assine agora para ter acesso completo ao guia
          </p>
          <Button onClick={() => router.push("/guia-assinatura")}>
            Assinar Agora
          </Button>
        </div>
      </Card>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Ativa</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-100 text-yellow-700">Pagamento Pendente</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-700">Período de Teste</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Sua Assinatura</h2>
            <p className="text-gray-600">
              Gerencie sua assinatura do Guia Fernando de Noronha
            </p>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Plano</p>
              <p className="font-medium">Guia Anual 2025</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Valor</p>
              <p className="font-medium">R$ 99,00/ano</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Período Atual</p>
              <p className="font-medium">
                {format(new Date(subscription.currentPeriodStart), "dd/MM/yyyy", { locale: ptBR })} - 
                {format(new Date(subscription.currentPeriodEnd), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            
            {subscription.canceledAt && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Cancelada em</p>
                <p className="font-medium">
                  {format(new Date(subscription.canceledAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            variant="outline"
            className="flex-1 sm:flex-initial"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Assinatura
              </>
            )}
          </Button>
          
          {subscription.status === "active" && (
            <Button
              variant="ghost"
              onClick={() => toast.info("Use o portal de gerenciamento para cancelar")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Portal do Cliente
            </Button>
          )}
        </div>
      </Card>
      
      {/* Payment History */}
      {payments && payments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {payment.status === "succeeded" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      R$ {(payment.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.paidAt
                        ? format(new Date(payment.paidAt), "dd/MM/yyyy", { locale: ptBR })
                        : "Pendente"}
                    </p>
                  </div>
                </div>
                <Badge variant={payment.status === "succeeded" ? "secondary" : "destructive"}>
                  {payment.status === "succeeded" ? "Pago" : "Falhou"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Benefits Reminder */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <h3 className="text-lg font-semibold mb-4">Seus Benefícios</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Acesso completo ao guia",
            "Atualizações incluídas",
            "Suporte premium",
            "Comunidade exclusiva",
            "Descontos em parceiros",
            "Conteúdo exclusivo"
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 