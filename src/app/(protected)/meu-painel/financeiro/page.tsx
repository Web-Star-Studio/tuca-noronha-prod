"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { usePartner } from "@/lib/hooks/usePartner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Activity, Download, RefreshCw, CreditCard, AlertCircle } from "lucide-react";

import { FinancialMetricsCards } from "@/components/dashboard/partners/financial/FinancialMetricsCards";
import { MonthlyRevenueChart } from "@/components/dashboard/partners/financial/MonthlyRevenueChart";
import { TransactionsList } from "@/components/dashboard/partners/financial/TransactionsList";
import { RevenueByTypeChart } from "@/components/dashboard/partners/financial/RevenueByTypeChart";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function FinanceiroPage() {
  const router = useRouter();
  const { partner, isLoading: partnerLoading, canBePartner } = usePartner();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert date range to numbers for Convex
  const dateRangeForQuery = dateRange 
    ? {
        startDate: dateRange.from.getTime(),
        endDate: dateRange.to.getTime(),
      }
    : undefined;

  // Fetch financial data
  const analytics = useQuery(
    api.domains.partners.queries.getPartnerFinancialAnalytics,
    partner?._id 
      ? {
          partnerId: partner._id,
          dateRange: dateRangeForQuery,
        }
      : undefined
  );

  const balance = useQuery(
    api.domains.partners.queries.getPartnerBalance,
    partner?._id ? { partnerId: partner._id } : undefined
  );

  // Handle loading states
  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  // Handle access control
  if (!canBePartner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-gray-600 text-center max-w-md">
          Esta área é exclusiva para parceiros. Entre em contato com o suporte para saber como se tornar um parceiro.
        </p>
      </div>
    );
  }

  // Partner onboarding check
  if (!partner || partner.stripeAccountStatus !== "complete") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <CreditCard className="h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Configure seus Pagamentos</h2>
        <p className="text-gray-600 text-center max-w-md mb-6">
          Para acessar o dashboard financeiro, você precisa completar a configuração da sua conta de pagamentos.
        </p>
        <Button onClick={() => router.push("/meu-painel/configuracoes")}>
          Configurar Conta
        </Button>
      </div>
    );
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dados atualizados com sucesso!");
    }, 1000);
  };

  const handleExportData = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe seus ganhos e transações na plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-auto"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      {balance && (
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-blue-600" />
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Disponível para Saque</p>
                <p className="text-3xl font-bold text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balance.availableBalance / 100)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendente</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balance.pendingBalance / 100)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ganhos Hoje</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balance.todayRevenue / 100)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {balance.todayTransactions} transações
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {analytics && (
            <>
              <FinancialMetricsCards 
                analytics={analytics} 
                feePercentage={partner.feePercentage}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthlyRevenueChart data={analytics.monthlyTrends} />
                <RevenueByTypeChart data={analytics.revenueByType} />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsList partnerId={partner._id} dateRange={dateRangeForQuery} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Detalhada</CardTitle>
                  <CardDescription>
                    Análise aprofundada das suas transações e receitas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Conversion Rate */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Taxa de Conversão</p>
                        <p className="text-sm text-gray-600">
                          Porcentagem de transações concluídas com sucesso
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {analytics.summary.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {analytics.summary.completedTransactions} de {analytics.summary.totalTransactions}
                        </p>
                      </div>
                    </div>

                    {/* Average Transaction Value */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Ticket Médio</p>
                        <p className="text-sm text-gray-600">
                          Valor médio das transações concluídas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(analytics.summary.avgTransactionValue / 100)}
                        </p>
                      </div>
                    </div>

                    {/* Platform Fees */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Taxa da Plataforma</p>
                        <p className="text-sm text-gray-600">
                          Taxa atual: {analytics.feePercentage}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(analytics.summary.platformFees / 100)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Total em taxas
                        </p>
                      </div>
                    </div>

                    {/* Refunds */}
                    {analytics.summary.refundedTransactions > 0 && (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                        <div>
                          <p className="font-medium">Reembolsos</p>
                          <p className="text-sm text-gray-600">
                            {analytics.summary.refundedTransactions} transações reembolsadas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(analytics.summary.totalRefunded / 100)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Taxas devolvidas: {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(analytics.summary.refundedFees / 100)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Type Detailed */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Tipo de Serviço</CardTitle>
                  <CardDescription>
                    Detalhamento completo por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.revenueByType).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{type.replace("_", " ")}</p>
                          <p className="text-sm text-gray-600">{data.count} transações</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(data.netRevenue / 100)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Bruto: {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(data.grossRevenue / 100)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 