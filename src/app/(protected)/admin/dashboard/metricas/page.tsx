"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Calendar,
  Database,
  Activity,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Download
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

type MetricCardProps = {
  title: string
  value: string | number
  change: number
  icon: React.ElementType
  description: string
  color: string
}

function MetricCard({ title, value, change, icon: Icon, description, color }: MetricCardProps) {
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isPositive && <ArrowUp className="h-3 w-3 text-green-600" />}
          {isNegative && <ArrowDown className="h-3 w-3 text-red-600" />}
          {isNeutral && <Minus className="h-3 w-3 text-gray-400" />}
          <span className={`font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-400'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  // Buscar estatísticas do sistema
  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics)
  const supportStats = useQuery(api["domains/support/queries"].getSupportStatistics)

  // Simular dados de métricas (em produção, criar queries específicas)
  const mockMetrics = {
    usersGrowth: 12.5,
    organizationsGrowth: 8.3,
    assetsGrowth: 15.2,
    bookingsGrowth: 22.1,
    revenueGrowth: 18.7,
    supportGrowth: -5.2
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simular carregamento
    setTimeout(() => setRefreshing(false), 2000)
  }

  if (!systemStats || !supportStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Carregando métricas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Métricas do Sistema</h1>
            <p className="text-sm text-gray-600">
              Acompanhe o desempenho e crescimento da plataforma
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
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total de Usuários"
          value={systemStats.users.total.toLocaleString()}
          change={mockMetrics.usersGrowth}
          icon={Users}
          description="vs mês anterior"
          color="text-blue-600"
        />
        
        <MetricCard
          title="Organizações Ativas"
          value={systemStats.organizations.active.toLocaleString()}
          change={mockMetrics.organizationsGrowth}
          icon={Building2}
          description="vs mês anterior"
          color="text-green-600"
        />
        
        <MetricCard
          title="Total de Assets"
          value={systemStats.assets.total.toLocaleString()}
          change={mockMetrics.assetsGrowth}
          icon={Database}
          description="vs mês anterior"
          color="text-purple-600"
        />
        
        <MetricCard
          title="Reservas"
          value={systemStats.bookings.total.toLocaleString()}
          change={mockMetrics.bookingsGrowth}
          icon={Calendar}
          description="vs mês anterior"
          color="text-orange-600"
        />
        
        <MetricCard
          title="Receita Estimada"
          value="R$ 45.2K"
          change={mockMetrics.revenueGrowth}
          icon={TrendingUp}
          description="vs mês anterior"
          color="text-emerald-600"
        />
        
        <MetricCard
          title="Tickets de Suporte"
          value={supportStats.total.toLocaleString()}
          change={mockMetrics.supportGrowth}
          icon={MessageSquare}
          description="vs mês anterior"
          color="text-red-600"
        />
      </div>

      {/* Abas de Métricas Detalhadas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribuição de Usuários por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Usuários</CardTitle>
                <CardDescription>Breakdown por tipo de usuário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Viajantes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-blue-200 rounded-full">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${(systemStats.users.travelers / systemStats.users.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.users.travelers}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Parceiros</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-green-200 rounded-full">
                      <div 
                        className="h-full bg-green-600 rounded-full" 
                        style={{ width: `${(systemStats.users.partners / systemStats.users.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.users.partners}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Funcionários</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-yellow-200 rounded-full">
                      <div 
                        className="h-full bg-yellow-600 rounded-full" 
                        style={{ width: `${(systemStats.users.employees / systemStats.users.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.users.employees}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Masters</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-purple-200 rounded-full">
                      <div 
                        className="h-full bg-purple-600 rounded-full" 
                        style={{ width: `${(systemStats.users.masters / systemStats.users.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.users.masters}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribuição de Assets por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Assets</CardTitle>
                <CardDescription>Breakdown por categoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Restaurantes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-orange-200 rounded-full">
                      <div 
                        className="h-full bg-orange-600 rounded-full" 
                        style={{ width: `${(systemStats.assets.restaurants / systemStats.assets.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.assets.restaurants}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Eventos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-blue-200 rounded-full">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${(systemStats.assets.events / systemStats.assets.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.assets.events}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Atividades</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-green-200 rounded-full">
                      <div 
                        className="h-full bg-green-600 rounded-full" 
                        style={{ width: `${(systemStats.assets.activities / systemStats.assets.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.assets.activities}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Veículos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-purple-200 rounded-full">
                      <div 
                        className="h-full bg-purple-600 rounded-full" 
                        style={{ width: `${(systemStats.assets.vehicles / systemStats.assets.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.assets.vehicles}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hospedagens</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-pink-200 rounded-full">
                      <div 
                        className="h-full bg-pink-600 rounded-full" 
                        style={{ width: `${(systemStats.assets.accommodations / systemStats.assets.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{systemStats.assets.accommodations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Novos Usuários (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+127</div>
                <p className="text-xs text-green-600">+15.2% vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-green-600">+0.5pp vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-blue-600">nos últimos 7 dias</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Retenção (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-green-600">+2.1% vs mês anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Assets Mais Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Restaurante do João</span>
                    <span className="font-medium">245 views</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Evento Música na Praia</span>
                    <span className="font-medium">189 views</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mergulho com Tartarugas</span>
                    <span className="font-medium">156 views</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taxa de Ocupação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <p className="text-xs text-green-600">+5.2% vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avaliação Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.6⭐</div>
                <p className="text-xs text-green-600">+0.1 vs mês anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Reservas Confirmadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.bookings.total - systemStats.bookings.pending}</div>
                <p className="text-xs text-green-600">+22.1% vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Reservas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.bookings.pending}</div>
                <p className="text-xs text-yellow-600">aguardando confirmação</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taxa de Cancelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.2%</div>
                <p className="text-xs text-red-600">+1.1pp vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valor Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 347</div>
                <p className="text-xs text-green-600">+8.5% vs mês anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Receita Total (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 45.247</div>
                <p className="text-xs text-green-600">+18.7% vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Receita por Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 156</div>
                <p className="text-xs text-green-600">+12.3% vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Margem de Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23.5%</div>
                <p className="text-xs text-green-600">+2.1pp vs mês anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 