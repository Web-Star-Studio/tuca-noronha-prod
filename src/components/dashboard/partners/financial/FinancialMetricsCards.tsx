"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Percent,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface FinancialMetricsCardsProps {
  analytics: {
    summary: {
      totalTransactions: number;
      completedTransactions: number;
      failedTransactions: number;
      refundedTransactions: number;
      grossRevenue: number;
      platformFees: number;
      netRevenue: number;
      totalRefunded: number;
      refundedFees: number;
      avgTransactionValue: number;
      pendingAmount: number;
      conversionRate: number;
    };
  };
  feePercentage: number;
}

export function FinancialMetricsCards({ analytics, feePercentage }: FinancialMetricsCardsProps) {
  const metrics = [
    {
      title: "Receita Bruta",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(analytics.summary.grossRevenue / 100),
      icon: DollarSign,
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Total antes das taxas",
    },
    {
      title: "Receita Líquida",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(analytics.summary.netRevenue / 100),
      icon: TrendingUp,
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: `Após taxa de ${feePercentage}%`,
    },
    {
      title: "Transações",
      value: analytics.summary.totalTransactions.toString(),
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: `${analytics.summary.completedTransactions} concluídas`,
      badge: analytics.summary.failedTransactions > 0 
        ? `${analytics.summary.failedTransactions} falhadas` 
        : null,
    },
    {
      title: "Taxa de Conversão",
      value: `${analytics.summary.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Transações bem-sucedidas",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              {metric.trend && (
                <div className={`flex items-center text-sm ${
                  metric.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              {metric.description && (
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              )}
              {metric.badge && (
                <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {metric.badge}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 