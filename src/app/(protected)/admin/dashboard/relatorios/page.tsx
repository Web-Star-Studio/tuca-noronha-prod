"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  BarChart3, 
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Globe,
  Package
} from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { DashboardPageHeader } from "../components"

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function RelatoriosPage() {
  const { user } = useCurrentUser()
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [refreshing, setRefreshing] = useState(false)

  // Calcular datas baseadas no período selecionado
  const { startDate, endDate } = useMemo(() => {
    const now = Date.now()
    const periodMs = timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
                    timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 :
                    timeRange === "90d" ? 90 * 24 * 60 * 60 * 1000 :
                    365 * 24 * 60 * 60 * 1000
    
    return {
      startDate: now - periodMs,
      endDate: now
    }
  }, [timeRange])

  // Queries para dados de relatórios
  const revenueAnalytics = useQuery(api.domains.reports.queries.getRevenueAnalytics, {
    startDate,
    endDate,
  })

  const conversionFunnel = useQuery(api.domains.reports.queries.getConversionFunnel, {
    startDate,
    endDate,
  })

  const destinationPerformance = useQuery(api.domains.reports.queries.getDestinationPerformance, {
    startDate,
    endDate,
    limit: 5,
  })

  const assetTypePerformance = useQuery(api.domains.reports.queries.getAssetTypePerformance, {
    startDate,
    endDate,
  })

  const userGrowth = useQuery(api.domains.reports.queries.getUserGrowthAnalytics, {
    startDate,
    endDate,
  })

  const executiveDashboard = useQuery(api.domains.reports.queries.getExecutiveDashboard, {
    period: timeRange,
  })

  // Funções auxiliares
  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
  }

  // Verificar permissões usando o sistema correto
  if (user?.role !== "master") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores master podem acessar relatórios avançados.</p>
        </div>
      </div>
    )
  }

  if (!revenueAnalytics || !conversionFunnel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Carregando relatórios...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Relatórios Executivos"
        description="Análise avançada de performance e insights estratégicos"
        icon={BarChart3}
        iconBgClassName="bg-purple-100"
        iconColorClassName="text-purple-600"
      >
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </DashboardPageHeader>

      {/* Alertas do Dashboard Executivo */}
      {executiveDashboard?.alerts && executiveDashboard.alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {executiveDashboard.alerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${
              alert.type === 'success' ? 'border-l-green-500 bg-green-50' :
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
              'border-l-red-500 bg-red-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  <div>
                    <p className={`font-medium ${
                      alert.type === 'success' ? 'text-green-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {alert.message}
                    </p>
                    <Badge variant="outline" size="sm" className="mt-1">
                      {alert.priority === 'high' ? 'Alta' :
                       alert.priority === 'medium' ? 'Média' : 'Baixa'} prioridade
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueAnalytics.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(revenueAnalytics.revenueGrowth)}
              <p className={`text-xs ${getTrendColor(revenueAnalytics.revenueGrowth)}`}>
                {formatPercentage(revenueAnalytics.revenueGrowth)} vs período anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Reservas Confirmadas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {conversionFunnel.bookingCompleted.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              De {conversionFunnel.uniqueVisitors.toLocaleString()} visitantes únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {conversionFunnel.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tempo médio: {conversionFunnel.averageTimeToConvert}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(revenueAnalytics.averageTicketValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Por reserva confirmada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Breakdown Financeiro
          </CardTitle>
          <CardDescription>Análise de margem e distribuição de receita</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                <span className="text-sm">Receita Bruta</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(revenueAnalytics.commissionBreakdown.grossRevenue)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                <span className="text-sm">Comissão Partners</span>
                <span className="text-sm font-medium text-blue-600">
                  - {formatCurrency(revenueAnalytics.commissionBreakdown.partnerCommission)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                  <span className="text-sm font-semibold">Receita Líquida</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(revenueAnalytics.commissionBreakdown.netRevenue)}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between text-sm">
                <span>Margem da Plataforma</span>
                <span className="font-medium">{revenueAnalytics.commissionBreakdown.marginPercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={revenueAnalytics.commissionBreakdown.marginPercentage} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Detalhados */}
      <Tabs defaultValue="conversao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="conversao">Conversão</TabsTrigger>
          <TabsTrigger value="receita">Receita</TabsTrigger>
          <TabsTrigger value="destinos">Destinos</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="conversao">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Jornada do visitante até a reserva</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <span className="text-sm">Visitantes Únicos</span>
                    <span className="text-sm font-medium">{conversionFunnel.uniqueVisitors.toLocaleString()}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <span className="text-sm">Visualizaram Assets</span>
                    <span className="text-sm font-medium">{conversionFunnel.assetViews.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(conversionFunnel.assetViews / conversionFunnel.uniqueVisitors) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <span className="text-sm">Iniciaram Reserva</span>
                    <span className="text-sm font-medium">{conversionFunnel.bookingStarted.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(conversionFunnel.bookingStarted / conversionFunnel.uniqueVisitors) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <span className="text-sm">Finalizaram Reserva</span>
                    <span className="text-sm font-medium text-green-600">{conversionFunnel.bookingCompleted.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(conversionFunnel.bookingCompleted / conversionFunnel.uniqueVisitors) * 100} 
                    className="h-2 bg-green-100" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversão por Fonte</CardTitle>
                <CardDescription>Performance por canal de aquisição</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversionFunnel.conversionBySource.map((source, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                      <span className="text-sm font-medium">{source.source}</span>
                      <Badge variant="outline">{source.conversionRate}%</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between text-xs text-gray-500">
                      <span>{source.visitors.toLocaleString()} visitantes</span>
                      <span>{source.conversions.toLocaleString()} conversões</span>
                    </div>
                    <Progress value={source.conversionRate} className="h-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receita">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Tipo de Asset</CardTitle>
                <CardDescription>Distribuição da receita por categoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueAnalytics.revenueByAssetType.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type.assetType}</span>
                      <span className="text-sm font-medium">{formatCurrency(type.revenue)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between text-xs text-gray-500">
                      <span>{type.percentage.toFixed(1)}% do total</span>
                    </div>
                    <Progress value={type.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Receita e reservas por mês</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueAnalytics.revenueByMonth.slice(-6).map((month, index) => (
                  <div key={index} className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{month.month}</div>
                      <div className="text-xs text-gray-500">{month.bookings} reservas</div>
                    </div>
                    <div className="text-sm font-medium">{formatCurrency(month.revenue)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="destinos">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Destino</CardTitle>
              <CardDescription>Ranking dos destinos mais populares e rentáveis</CardDescription>
            </CardHeader>
            <CardContent>
              {destinationPerformance ? (
                <div className="space-y-4">
                  {destinationPerformance.map((destination, index) => (
                    <div key={index} className="flex flex-wrap gap-3 items-start sm:items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <Globe className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{destination.location}</div>
                          <div className="text-sm text-gray-500">
                            {destination.assetCount} assets • {destination.bookings} reservas
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(destination.revenue)}</div>
                        <div className="flex items-center gap-1 text-sm">
                          {destination.averageRating > 0 && (
                            <>
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>{destination.averageRating && typeof destination.averageRating === 'number' ? destination.averageRating.toFixed(1) : 'N/A'}</span>
                            </>
                          )}
                          {getTrendIcon(destination.growthRate)}
                          <span className={getTrendColor(destination.growthRate)}>
                            {formatPercentage(destination.growthRate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Carregando dados de destinos...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Categoria de Asset</CardTitle>
              <CardDescription>Comparativo de desempenho entre tipos de assets</CardDescription>
            </CardHeader>
            <CardContent>
              {assetTypePerformance ? (
                <div className="space-y-4">
                  {assetTypePerformance.map((asset, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium capitalize">{asset.assetType}</h3>
                          <Badge 
                            variant={asset.trendDirection === 'up' ? 'default' : 
                                    asset.trendDirection === 'down' ? 'destructive' : 'secondary'}
                          >
                            {asset.trendDirection === 'up' ? 'Crescendo' :
                             asset.trendDirection === 'down' ? 'Declínio' : 'Estável'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(asset.totalRevenue)}</div>
                          <div className="text-sm text-gray-500">Receita total</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Assets Ativos</div>
                          <div className="font-medium">{asset.activeAssets}/{asset.totalAssets}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Reservas</div>
                          <div className="font-medium">{asset.totalBookings}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Utilização</div>
                          <div className="font-medium">{asset.utilizationRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Score</div>
                          <div className="font-medium">{asset.profitabilityScore.toFixed(0)}/100</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Carregando performance dos assets...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Usuários</CardTitle>
                <CardDescription>Evolução da base de usuários</CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowth ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{userGrowth.totalUsers}</div>
                        <div className="text-sm text-gray-500">Total de usuários</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatPercentage(userGrowth.userGrowthRate)}
                        </div>
                        <div className="text-sm text-gray-500">Crescimento</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Segmentação por Tipo</h4>
                      {userGrowth.userSegmentation.map((segment, index) => (
                        <div key={index} className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                          <span className="text-sm capitalize">{segment.role}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{segment.count}</span>
                            <span className="text-xs text-gray-500">({segment.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Carregando dados de usuários...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Retenção</CardTitle>
                <CardDescription>Taxa de retorno dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowth ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                        <span className="text-sm">1 dia</span>
                        <span className="text-sm font-medium">{userGrowth.userRetention.day1}%</span>
                      </div>
                      <Progress value={userGrowth.userRetention.day1} className="h-2" />
                      
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                        <span className="text-sm">7 dias</span>
                        <span className="text-sm font-medium">{userGrowth.userRetention.day7}%</span>
                      </div>
                      <Progress value={userGrowth.userRetention.day7} className="h-2" />
                      
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                        <span className="text-sm">30 dias</span>
                        <span className="text-sm font-medium">{userGrowth.userRetention.day30}%</span>
                      </div>
                      <Progress value={userGrowth.userRetention.day30} className="h-2" />
                      
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                        <span className="text-sm">90 dias</span>
                        <span className="text-sm font-medium">{userGrowth.userRetention.day90}%</span>
                      </div>
                      <Progress value={userGrowth.userRetention.day90} className="h-2" />
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <h4 className="font-medium">Análise de Churn</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex flex-wrap gap-3 justify-between">
                          <span>Taxa de Churn:</span>
                          <span className="font-medium">{userGrowth.churnAnalysis.churnRate}%</span>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-between">
                          <span>LTV Médio:</span>
                          <span className="font-medium">{formatCurrency(userGrowth.churnAnalysis.avgLifetimeValue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Carregando análise de retenção...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Previsões e Insights */}
      {executiveDashboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Previsões e Insights
            </CardTitle>
            <CardDescription>Projeções baseadas em tendências atuais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Receita Esperada</div>
                <div className="text-xl font-bold text-blue-700">
                  {formatCurrency(executiveDashboard.forecasts.expectedRevenue)}
                </div>
                <div className="text-xs text-blue-600">Próximo período</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Reservas Esperadas</div>
                <div className="text-xl font-bold text-green-700">
                  {executiveDashboard.forecasts.expectedBookings.toLocaleString()}
                </div>
                <div className="text-xs text-green-600">Próximo período</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Ajuste Sazonal</div>
                <div className="text-xl font-bold text-purple-700">
                  +{((executiveDashboard.forecasts.seasonalAdjustment - 1) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-purple-600">Fator de correção</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
