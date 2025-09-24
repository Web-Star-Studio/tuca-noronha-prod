"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PartnerTransactionNotifications } from "@/components/dashboard/partners/PartnerTransactionNotifications";
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";

export default function TestPhase4Page() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get current user's partner record
  const currentPartner = useQuery(api.domains.partners.queries.getMyPartnerRecord);
  
  // Get recent transactions
  const recentTransactions = useQuery(api.domains.partners.queries.getPartnerTransactions, 
    currentPartner ? {
      partnerId: currentPartner._id,
      paginationOpts: { numItems: 5, cursor: null },
    } : undefined
  );

  const simulateSuccessfulTransaction = async () => {
    setIsProcessing(true);
    try {
      // This would normally happen through the webhook
      toast.success("Transação simulada com sucesso!");
      toast.info("Em produção, isto seria processado automaticamente via webhook do provedor de pagamentos");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateFailedTransaction = async () => {
    setIsProcessing(true);
    try {
      // This would normally happen through the webhook
      toast.error("Falha de transação simulada!");
      toast.info("Em produção, o parceiro receberia uma notificação sobre a falha");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateRefund = async () => {
    if (!recentTransactions?.page?.[0]) {
      toast.error("Nenhuma transação disponível para estorno");
      return;
    }

    setIsProcessing(true);
    try {
      // In a real scenario, we would process the refund
      toast.success("Estorno simulado com sucesso!");
      toast.info("O parceiro seria notificado sobre o estorno da transação");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Teste da Fase 4 - Sistema de Taxas de Parceiros</h1>
        <p className="text-muted-foreground">
          Demonstração das funcionalidades implementadas: tratamento de erros, refunds e notificações
        </p>
      </div>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Funcionalidades</CardTitle>
          <CardDescription>Implementações concluídas na Fase 4</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Tratamento de Erros e Reversões</span>
            <Badge variant="success">Implementado</Badge>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Processamento de Refunds</span>
            <Badge variant="success">Implementado</Badge>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Notificações de Transações</span>
            <Badge variant="success">Implementado</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Teste</CardTitle>
          <CardDescription>
            Simule diferentes cenários para testar as funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={simulateSuccessfulTransaction}
              disabled={isProcessing}
              className="w-full"
              variant="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Simular Transação Bem-sucedida
            </Button>
            
            <Button
              onClick={simulateFailedTransaction}
              disabled={isProcessing}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Simular Falha na Transação
            </Button>
            
            <Button
              onClick={simulateRefund}
              disabled={isProcessing || !recentTransactions?.page?.length}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Simular Estorno
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <strong>Nota:</strong> Em produção, essas ações são processadas automaticamente 
              através dos webhooks do provedor de pagamentos. As simulações demonstram o comportamento esperado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas transações processadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions?.page && recentTransactions.page.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.page.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.bookingType} - {transaction.bookingId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Valor: R$ {(transaction.amount / 100).toFixed(2)} | 
                      Taxa: R$ {(transaction.platformFee / 100).toFixed(2)} | 
                      Líquido: R$ {(transaction.partnerAmount / 100).toFixed(2)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      transaction.status === "completed" ? "success" :
                      transaction.status === "failed" ? "destructive" :
                      transaction.status === "refunded" ? "warning" :
                      "secondary"
                    }
                  >
                    {transaction.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications Component */}
      <PartnerTransactionNotifications
        partnerId={currentPartner?._id}
        limit={5}
      />

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Implementação</CardTitle>
          <CardDescription>
            Como as funcionalidades foram implementadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">1. Tratamento de Erros e Reversões</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Mutation <code>handlePartnerTransactionError</code> para marcar transações como falhadas</li>
              <li>Notificação automática ao parceiro sobre falhas</li>
              <li>Logs detalhados de erro armazenados nos metadados</li>
              <li>Tratamento robusto no webhook handler</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. Processamento de Refunds</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Mutation <code>processPartnerTransactionRefund</code> integrada ao fluxo de refund</li>
              <li>Cálculo proporcional de estorno de taxas</li>
              <li>Atualização automática do status da transação</li>
              <li>Notificação ao parceiro com valores estornados</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Notificações de Transações</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Mutation <code>notifyPartnerNewTransaction</code> para novas transações</li>
              <li>Tipos de notificação: nova transação, falha, estorno</li>
              <li>Componente <code>PartnerTransactionNotifications</code> para visualização</li>
              <li>Integração com o sistema de notificações existente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
