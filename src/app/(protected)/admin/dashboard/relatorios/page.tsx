"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Activity,
  MapPin,
  Star,
  Clock,
  Filter,
  FileText,
  LineChart,
  Percent
} from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RelatoriosPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [reportType, setReportType] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  // Buscar estatísticas do sistema
  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics)

  // Dados mockados para relatórios
  const mockReportData = {
    revenue: {
      total: 245678,
      growth: 18.5,
      byMonth: [
        { month: "Jan", value: 18000 },
        { month: "Fev", value: 22000 },
        { month: "Mar", value: 25000 },
        { month: "Abr", value: 28000 },
        { month: "Mai", value: 32000 },
        { month: "Jun", value: 35000 },
      ]
    },
    bookings: {
      total: 1847,
      growth: 22.3,
      conversionRate: 3.2,
      averageValue: 347
    },
    topDestinations: [
      { name: "Fernando de Noronha", bookings: 456, revenue: 89000 },
      { name: "Porto de Galinhas", bookings: 234, revenue: 45000 },
      { name: "Recife", bookings: 189, revenue: 38000 },
      { name: "Olinda", bookings: 123, revenue: 25000 }
    ],
    assetPerformance: [
      { category: "Restaurantes", bookings: 567, revenue: 98000, rating: 4.6 },
      { category: "Hospedagens", bookings: 423, revenue: 125000, rating: 4.4 },
      { category: "Atividades", bookings: 389, revenue: 67000, rating: 4.8 },
      { category: "Eventos", bookings: 298, revenue: 45000, rating: 4.3 },
      { category: "Veículos", bookings: 234, revenue: 34000, rating: 4.2 }
    ]
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  if (!systemStats) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h1>
            <p className="text-sm text-gray-600">
              Insights detalhados sobre o desempenho da plataforma
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {mockReportData.revenue.total.toLocaleString()}
            </div>
            <p className="text-xs text-green-600">
              +{mockReportData.revenue.growth}% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockReportData.bookings.total.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600">
              +{mockReportData.bookings.growth}% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mockReportData.bookings.conversionRate}%
            </div>
            <p className="text-xs text-purple-600">
              +0.5pp vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {mockReportData.bookings.averageValue}
            </div>
            <p className="text-xs text-orange-600">
              +8.3% vs período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Detalhados */}
      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="destinos">Destinos</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Mês</CardTitle>
                <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportData.revenue.byMonth.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-green-200 rounded-full">
                          <div 
                            className="h-full bg-green-600 rounded-full" 
                            style={{ width: `${(item.value / 35000) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">R$ {item.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Margem</CardTitle>
                <CardDescription>Breakdown da rentabilidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Receita Bruta</span>
                  <span className="text-sm font-medium text-green-600">R$ 245.678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Comissões de Partners</span>
                  <span className="text-sm font-medium text-red-600">- R$ 49.136</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Custos Operacionais</span>
                  <span className="text-sm font-medium text-red-600">- R$ 73.703</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Margem Líquida</span>
                    <span className="text-sm font-semibold text-green-600">R$ 122.839</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Margem %</span>
                    <span className="text-xs text-green-600">50.0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reservas">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Jornada do usuário até a reserva</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visitantes Únicos</span>
                    <span className="text-sm font-medium">12,450</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visualizaram Assets</span>
                    <span className="text-sm font-medium">8,967</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '72%' }} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Iniciaram Reserva</span>
                    <span className="text-sm font-medium">3,124</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '25%' }} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Finalizaram Reserva</span>
                    <span className="text-sm font-medium text-green-600">1,847</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservas por Status</CardTitle>
                <CardDescription>Estado atual das reservas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">Confirmadas</span>
                  </div>
                  <span className="text-sm font-medium">1,523 (82.5%)</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm">Pendentes</span>
                  </div>
                  <span className="text-sm font-medium">234 (12.7%)</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm">Canceladas</span>
                  </div>
                  <span className="text-sm font-medium">90 (4.8%)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="destinos">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Destino</CardTitle>
              <CardDescription>Ranking dos destinos mais populares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.topDestinations.map((destination, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{destination.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{destination.bookings} reservas</span>
                          <span>R$ {destination.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <Badge variant="secondary">
                        {Math.round((destination.bookings / mockReportData.bookings.total) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Categoria de Asset</CardTitle>
              <CardDescription>Comparativo de desempenho entre categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.assetPerformance.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">{asset.category}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{asset.bookings}</div>
                        <div className="text-gray-500">reservas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">R$ {asset.revenue.toLocaleString()}</div>
                        <div className="text-gray-500">receita</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="font-medium">{asset.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Usuários</CardTitle>
                <CardDescription>Novos registros por mês</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Janeiro</span>
                    <span className="text-sm font-medium">+127 usuários</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fevereiro</span>
                    <span className="text-sm font-medium">+156 usuários</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Março</span>
                    <span className="text-sm font-medium">+189 usuários</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abril</span>
                    <span className="text-sm font-medium">+234 usuários</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retenção de Usuários</CardTitle>
                <CardDescription>Taxa de retorno dos usuários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1 dia</span>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">7 dias</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">30 dias</span>
                    <span className="text-sm font-medium">52%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">90 dias</span>
                    <span className="text-sm font-medium">34%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 