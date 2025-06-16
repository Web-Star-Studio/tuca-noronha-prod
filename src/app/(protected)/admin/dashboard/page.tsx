"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Activity, 
  Calendar, 
  Store, 
  TrendingUp, 
  ArrowUpRight,
  Building2,
  Car,
  Plus,
  Shield,
  MessageSquare,
  Database,
  AlertTriangle,
  MessageCircle,
  Star,
  DollarSign,
  BarChart3,
  PieChart,
  Bell,
  CheckCircle,
  Image,
  AlertCircle
} from "lucide-react"
import { useOrganization, useOrganizationAssets } from "@/lib/providers/organization-context"
import { ChatList } from "@/components/chat/ChatList"
import Link from "next/link"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { ChatNotifications } from "@/components/dashboard/ChatNotifications"

// Master Dashboard Component for system-wide view
function MasterDashboard() {
  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics);
  const supportStats = useQuery(api["domains/support/queries"].getSupportStatistics);

  if (!systemStats || !supportStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Carregando estatísticas do sistema...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Master Admin */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Master Admin</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">Master</Badge>
              <span className="text-sm text-gray-600">Administração do Sistema</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/suporte">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens de Suporte
              {supportStats.open > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {supportStats.open}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/admin/dashboard/usuarios">
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Gerenciar Usuários
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.users.partners} partners, {systemStats.users.employees} employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.total}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.assets.active} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.organizations.total}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.organizations.active} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.bookings.total}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.bookings.pending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suporte</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportStats.total}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {supportStats.urgent > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {supportStats.urgent} urgentes
                </div>
              )}
              {supportStats.urgent === 0 && `${supportStats.open} abertas`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown de Assets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.restaurants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.events}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.activities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.vehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hospedagens</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.accommodations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Master */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gestão de Usuários</CardTitle>
            <CardDescription>
              Gerenciar partners, employees e travellers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/admin/dashboard/usuarios" className="flex-1">
              <Button className="w-full">Ver Todos</Button>
            </Link>
            <Link href="/admin/dashboard/usuarios?role=partner">
              <Button variant="outline">Partners</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Todos os Assets</CardTitle>
            <CardDescription>
              Visualizar e gerenciar todos os assets do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/admin/dashboard/assets" className="flex-1">
              <Button className="w-full">Ver Todos</Button>
            </Link>
            <Link href="/admin/dashboard/assets?active=false">
              <Button variant="outline">Inativos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suporte</CardTitle>
            <CardDescription>
              Gerenciar mensagens de suporte dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/admin/dashboard/suporte" className="flex-1">
              <Button className="w-full gap-2">
                <MessageSquare className="h-4 w-4" />
                Gerenciar
              </Button>
            </Link>
            {supportStats.urgent > 0 && (
              <Badge variant="destructive">
                {supportStats.urgent} urgentes
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const getOrganizationTypeInfo = (type: string) => {
  switch (type) {
    case "restaurant":
      return {
        label: "Restaurante",
        icon: Store,
        description: "Estabelecimento gastronômico",
        mainMetric: "Reservas",
        assets: "Mesas e Cardápio"
      }
    // Temporariamente desabilitado - accommodation
    /*
    case "accommodation":
      return {
        label: "Hospedagem",
        icon: Building2,
        description: "Pousada/Hotel",
        mainMetric: "Ocupação",
        assets: "Quartos e Suítes"
      }
    */
    case "rental_service":
      return {
        label: "Aluguel de Veículos",
        icon: Car,
        description: "Locadora de veículos",
        mainMetric: "Locações",
        assets: "Frota de Veículos"
      }
    case "activity_service":
      return {
        label: "Atividades",
        icon: Activity,
        description: "Atividades turísticas",
        mainMetric: "Participantes",
        assets: "Atividades Disponíveis"
      }
    case "event_service":
      return {
        label: "Eventos",
        icon: Calendar,
        description: "Organização de eventos",
        mainMetric: "Eventos",
        assets: "Eventos Programados"
      }
    default:
      return {
        label: "Organização",
        icon: Building2,
        description: "Empreendimento",
        mainMetric: "Atividade",
        assets: "Assets"
      }
  }
}

function EmptyStateCard() {
  const { user } = useCurrentUser()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="rounded-full bg-blue-50 p-6 mb-4">
        <Building2 className="h-12 w-12 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Bem-vindo ao Dashboard
      </h3>
      {user?.role === "employee" ? (
        <p className="text-gray-600 max-w-md mb-6">
          Aguarde que um partner atribua organizações para você gerenciar.
        </p>
      ) : user?.role === "master" ? (
        <p className="text-gray-600 max-w-md mb-6">
          Use o menu lateral para acessar as funcionalidades de administração do sistema.
        </p>
      ) : (
        <>
          <p className="text-gray-600 max-w-md mb-6">
            Para começar, crie sua primeira organização e comece a gerenciar seus empreendimentos.
          </p>
          {user && user.role === "partner" && (
            <Link href="/admin/dashboard/novo-empreendimento">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Organização
              </Button>
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function OrganizationDashboard() {
  const { activeOrganization } = useOrganization()
  const { assets, isLoading } = useOrganizationAssets()

  if (!activeOrganization) {
    return <EmptyStateCard />
  }

  const orgInfo = getOrganizationTypeInfo(activeOrganization.type)
  const Icon = orgInfo.icon

  // Agrupa assets por tipo
  const assetsByType = assets.reduce((acc, asset) => {
    if (!acc[asset.assetType]) {
      acc[asset.assetType] = []
    }
    acc[asset.assetType].push(asset)
    return acc
  }, {} as Record<string, any[]>)

  const totalAssets = assets.length
  const activeAssets = assets.filter(asset => asset.isActive).length

  return (
    <div className="space-y-6">
      {/* Header da Organização */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activeOrganization.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{orgInfo.label}</Badge>
              <span className="text-sm text-gray-600">{orgInfo.description}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Asset
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de {orgInfo.assets}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              {activeAssets} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{orgInfo.mainMetric} do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Employees ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat List */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
          <CardDescription>
            Mensagens de clientes interessados em seus serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatList />
        </CardContent>
      </Card>
    </div>
  )
}

function PartnerDashboard() {
  const { activeOrganization, organizations } = useOrganization();
  
  // Buscar estatísticas gerais do partner
  const partnerStats = useQuery(api.domains.rbac.queries.getPartnerStats);
  
  // Se não tem organização ativa, mostrar página de seleção
  if (!activeOrganization) {
    return <EmptyStateCard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Bem-vindo ao painel de controle - {activeOrganization.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard/chat">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </Link>

        </div>
      </div>

      {/* Statistics Cards */}
      {partnerStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Assets</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerStats.totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                +{partnerStats.recentAssets} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas do Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerStats.monthlyBookings}</div>
              <p className="text-xs text-muted-foreground">
                +{partnerStats.bookingGrowth}% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {partnerStats.monthlyRevenue?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{partnerStats.revenueGrowth}% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerStats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                De {partnerStats.totalReviews} avaliações
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Chat Notifications */}
        <div className="lg:col-span-1">
          <ChatNotifications 
            maxItems={5} 
            showTitle={true}
            className="h-fit"
          />
        </div>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href={`/admin/dashboard/${activeOrganization.type === 'restaurant' ? 'restaurantes' : 
                          activeOrganization.type === 'event_service' ? 'eventos' :
                          activeOrganization.type === 'activity_service' ? 'atividades' :
                          activeOrganization.type === 'rental_service' ? 'veiculos' :
                          activeOrganization.type === 'accommodation' ? 'hospedagens' : 'assets'}`}>
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Gerenciar Assets
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/reservas">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Reservas
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/colaboradores">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Colaboradores
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/metricas">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
            </Link>

            <Link href="/admin/dashboard/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                Central de Chat
              </Button>
            </Link>
            

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { activeOrganization, organizations } = useOrganization();
  
  // Se não tem organização ativa, mostrar página de seleção
  if (!activeOrganization) {
    return <EmptyStateCard />;
  }

  return (
    <div className="space-y-6">
      {/* Header - diferente para employee */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Área de trabalho - {activeOrganization.name}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Funcionário
            </Badge>
            <span className="text-sm text-gray-500">
              • Acesso limitado às suas organizações atribuídas
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard/chat">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Employee specific cards - sem estatísticas financeiras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suas Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Organizações atribuídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organização Ativa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">{activeOrganization.name}</div>
            <p className="text-xs text-muted-foreground capitalize">
              {activeOrganization.type.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Acesso autorizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - ações limitadas para employee */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Chat Notifications */}
        <div>
          <ChatNotifications 
            maxItems={5} 
            showTitle={true}
            className="h-fit"
          />
        </div>

        {/* Quick Actions for Employee - limitado */}
        <Card>
          <CardHeader>
            <CardTitle>Suas Ações</CardTitle>
            <CardDescription>
              Ações disponíveis para sua função
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href={`/admin/dashboard/${activeOrganization.type === 'restaurant' ? 'restaurantes' : 
                          activeOrganization.type === 'event_service' ? 'eventos' :
                          activeOrganization.type === 'activity_service' ? 'atividades' :
                          activeOrganization.type === 'rental_service' ? 'veiculos' :
                          activeOrganization.type === 'accommodation' ? 'hospedagens' : 'assets'}`}>
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Visualizar Assets
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/reservas">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Reservas
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                Central de Chat
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/midias">
              <Button variant="outline" className="w-full justify-start">
                <Image className="mr-2 h-4 w-4" />
                Mídias
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Employee Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Acesso de Funcionário</h4>
              <p className="text-sm text-amber-700 mt-1">
                Você tem acesso apenas às organizações atribuídas pelo seu parceiro. 
                Entre em contato com seu supervisor para solicitar acesso a outras áreas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useCurrentUser()
  const { activeOrganization } = useOrganization()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Masters get the system-wide view
  if (user.role === "master") {
    return <MasterDashboard />
  }

  // Partners get full organizational dashboard
  if (user.role === "partner") {
    return <PartnerDashboard />
  }

  // Employees get limited dashboard
  if (user.role === "employee") {
    return <EmployeeDashboard />
  }

  // Fallback - shouldn't happen
  return <EmptyStateCard />
}
