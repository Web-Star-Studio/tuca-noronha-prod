"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Users, 
  Calendar, 
  Target,
  Award,
  AlertTriangle
} from "lucide-react";

interface CouponStatsProps {
  partnerId?: string;
  organizationId?: string;
}

export default function CouponStats({ partnerId, organizationId }: CouponStatsProps) {
  // Query para obter estatísticas gerais dos cupons
  const couponsData = useQuery(api.domains.coupons.queries.listCoupons, {
    partnerId: partnerId as any,
    organizationId: organizationId as any,
  });

  const coupons = couponsData?.coupons || [];
  const totalCount = couponsData?.totalCount || 0;

  if (couponsData === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular estatísticas
  const now = Date.now();
  
  const activeCoupons = coupons.filter(coupon => 
    coupon.isActive && 
    coupon.validFrom <= now && 
    coupon.validUntil >= now
  );

  const expiredCoupons = coupons.filter(coupon => coupon.validUntil < now);
  
  const expiringSoonCoupons = coupons.filter(coupon => {
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
    return coupon.validUntil <= threeDaysFromNow && coupon.validUntil > now;
  });

  const usedUpCoupons = coupons.filter(coupon => 
    coupon.usageLimit && coupon.usageCount >= coupon.usageLimit
  );

  const publicCoupons = coupons.filter(coupon => coupon.type === "public");
  const privateCoupons = coupons.filter(coupon => coupon.type === "private");

  const totalUsages = coupons.reduce((sum, coupon) => sum + coupon.usageCount, 0);
  const averageUsage = totalCount > 0 ? totalUsages / totalCount : 0;

  // Cupons com maior taxa de uso
  const highUsageCoupons = coupons.filter(coupon => {
    if (!coupon.usageLimit) return false;
    const usageRate = (coupon.usageCount / coupon.usageLimit) * 100;
    return usageRate >= 80;
  });

  // Estatísticas por tipo de desconto
  const percentageCoupons = coupons.filter(coupon => coupon.discountType === "percentage");
  const fixedAmountCoupons = coupons.filter(coupon => coupon.discountType === "fixed_amount");

  const stats = [
    {
      title: "Total de Cupons",
      value: totalCount.toString(),
      description: `${activeCoupons.length} ativos`,
      icon: Target,
      trend: null,
      color: "text-blue-600",
    },
    {
      title: "Cupons Ativos",
      value: activeCoupons.length.toString(),
      description: `${Math.round((activeCoupons.length / Math.max(totalCount, 1)) * 100)}% do total`,
      icon: Award,
      trend: activeCoupons.length > 0 ? "up" : null,
      color: "text-green-600",
    },
    {
      title: "Usos Totais",
      value: totalUsages.toString(),
      description: `Média de ${averageUsage.toFixed(1)} por cupom`,
      icon: Users,
      trend: totalUsages > 0 ? "up" : null,
      color: "text-purple-600",
    },
    {
      title: "Taxa de Desconto",
      value: `${percentageCoupons.length}%`,
      description: `${fixedAmountCoupons.length} valor fixo`,
      icon: Percent,
      trend: null,
      color: "text-orange-600",
    },
    {
      title: "Expirando em Breve",
      value: expiringSoonCoupons.length.toString(),
      description: "Próximos 3 dias",
      icon: Calendar,
      trend: expiringSoonCoupons.length > 0 ? "warning" : null,
      color: expiringSoonCoupons.length > 0 ? "text-yellow-600" : "text-gray-600",
    },
    {
      title: "Expirados",
      value: expiredCoupons.length.toString(),
      description: `${Math.round((expiredCoupons.length / Math.max(totalCount, 1)) * 100)}% do total`,
      icon: AlertTriangle,
      trend: expiredCoupons.length > 0 ? "down" : null,
      color: "text-red-600",
    },
    {
      title: "Públicos",
      value: publicCoupons.length.toString(),
      description: `${privateCoupons.length} privados`,
      icon: Users,
      trend: null,
      color: "text-indigo-600",
    },
    {
      title: "Muito Utilizados",
      value: highUsageCoupons.length.toString(),
      description: "≥80% do limite",
      icon: TrendingUp,
      trend: highUsageCoupons.length > 0 ? "up" : null,
      color: "text-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                
                {stat.trend && (
                  <div className="flex items-center">
                    {stat.trend === "up" && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                    {stat.trend === "down" && (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {stat.trend === "warning" && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progresso de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Taxa de Cupons Ativos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cupons Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ativos</span>
                <span>{activeCoupons.length} / {totalCount}</span>
              </div>
              <Progress 
                value={totalCount > 0 ? (activeCoupons.length / totalCount) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Públicos</span>
                  <span>{publicCoupons.length}</span>
                </div>
                <Progress 
                  value={totalCount > 0 ? (publicCoupons.length / totalCount) * 100 : 0} 
                  className="h-1"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Privados</span>
                  <span>{privateCoupons.length}</span>
                </div>
                <Progress 
                  value={totalCount > 0 ? (privateCoupons.length / totalCount) * 100 : 0} 
                  className="h-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Uso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Com Uso</span>
                  <span>{coupons.filter(c => c.usageCount > 0).length}</span>
                </div>
                <Progress 
                  value={totalCount > 0 ? (coupons.filter(c => c.usageCount > 0).length / totalCount) * 100 : 0} 
                  className="h-1"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Sem Uso</span>
                  <span>{coupons.filter(c => c.usageCount === 0).length}</span>
                </div>
                <Progress 
                  value={totalCount > 0 ? (coupons.filter(c => c.usageCount === 0).length / totalCount) * 100 : 0} 
                  className="h-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Notificações */}
      {(expiringSoonCoupons.length > 0 || usedUpCoupons.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringSoonCoupons.length > 0 && (
              <p className="text-sm text-yellow-700">
                {expiringSoonCoupons.length} cupom(s) expirando nos próximos 3 dias
              </p>
            )}
            {usedUpCoupons.length > 0 && (
              <p className="text-sm text-yellow-700">
                {usedUpCoupons.length} cupom(s) atingiram o limite de uso
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}