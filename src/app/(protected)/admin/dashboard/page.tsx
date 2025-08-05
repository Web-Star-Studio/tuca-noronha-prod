"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  Plus,
  Shield,
  MessageSquare,
  Database,
  MessageCircle,
  Star,
  DollarSign,
  CheckCircle,
  Image,
  AlertCircle,
  Building2
} from "lucide-react"
import { useOrganization } from "@/lib/providers/organization-context"
import Link from "next/link"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { ChatNotifications } from "@/components/dashboard/ChatNotifications"
import { StatsCard, DashboardSection, ActionCard, DashboardPageHeader } from "./components"

// Master Dashboard Component for system-wide view
function MasterDashboard() {
  const systemStats = useQuery(api.domains.users.queries.getSystemStatistics);
  const supportStats = useQuery(api.domains.support.queries.getSupportStatistics);

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

  const systemActions = [
    {
      title: "Gestão de Usuários",
      description: "Gerenciar partners, employees e travellers",
      icon: Users,
      actions: [
        { label: "Ver Todos", href: "/admin/dashboard/usuarios", variant: "default" as const },
        { label: "Partners", href: "/admin/dashboard/usuarios?role=partner", variant: "outline" as const }
      ]
    },
    {
      title: "Todos os Assets",
      description: "Visualizar e gerenciar todos os assets do sistema",
      icon: Database,
      actions: [
        { label: "Ver Todos", href: "/admin/dashboard/assets", variant: "default" as const },
        { label: "Inativos", href: "/admin/dashboard/assets?active=false", variant: "outline" as const }
      ]
    },
    {
      title: "Suporte",
      description: "Gerenciar mensagens de suporte dos usuários",
      icon: MessageSquare,
      actions: [
        { 
          label: "Gerenciar", 
          href: "/admin/dashboard/suporte", 
          variant: "default" as const,
          badge: supportStats.urgent
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header do Master Admin */}
      <DashboardPageHeader
        title="Painel Master Admin"
        description="Visão geral e administração completa do sistema"
        icon={Shield}
        iconBgClassName="bg-purple-100"
        iconColorClassName="text-purple-600"
      >
        <div className="flex gap-3">
          <Link href="/admin/dashboard/suporte">
            <Button variant="default" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Suporte
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
              Usuários
            </Button>
          </Link>
        </div>
      </DashboardPageHeader>

      {/* Estatísticas Gerais */}
      <DashboardSection 
        title="Estatísticas do Sistema" 
        description="Visão geral dos recursos do sistema"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de Usuários"
            value={systemStats.users.total}
            subtitle={`${systemStats.users.partners} partners, ${systemStats.users.employees} employees`}
            icon={Users}
            variant="info"
          />
          <StatsCard
            title="Total de Assets"
            value={systemStats.assets.total}
            subtitle={`${systemStats.assets.active} ativos`}
            icon={Database}
            variant="default"
          />
          <StatsCard
            title="Organizações"
            value={systemStats.organizations.total}
            subtitle={`${systemStats.organizations.active} ativas`}
            icon={Building2}
            variant="success"
          />
          <StatsCard
            title="Reservas"
            value={systemStats.bookings.total}
            subtitle={`${systemStats.bookings.pending} pendentes`}
            icon={Calendar}
            variant="info"
          />
          <StatsCard
            title="Suporte"
            value={supportStats.total}
            subtitle={supportStats.urgent > 0 ? `${supportStats.urgent} urgentes` : `${supportStats.open} abertas`}
            icon={MessageSquare}
            variant={supportStats.urgent > 0 ? "danger" : "default"}
          />
        </div>
      </DashboardSection>
    </div>
  )
}

/*
const _getOrganizationTypeInfo = (type: string) => {
  switch (type) {
    case "restaurant":
      return {
        label: "Restaurante",
        icon: Store,
        description: "Estabelecimento gastronômico",
        mainMetric: "Reservas",
        assets: "Mesas e Cardápio"
      }
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
*/

function EmptyStateCard() {
  const { user } = useCurrentUser()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Building2 className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
        Bem-vindo ao Dashboard
      </h3>
      {user?.role === "employee" ? (
        <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
          Aguarde que um partner atribua organizações para você gerenciar.
        </p>
      ) : user?.role === "master" ? (
        <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
          Use o menu lateral para acessar as funcionalidades de administração do sistema.
        </p>
      ) : (
        <>
          <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
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


function PartnerDashboard() {
  const { activeOrganization } = useOrganization();
  const partnerStats = useQuery(api.domains.rbac.queries.getPartnerStats);
  
  if (!activeOrganization) {
    return <EmptyStateCard />;
  }

  const quickActions = [
    {
      title: "Gerenciar Assets",
      description: "Configurar e atualizar seus recursos",
      icon: Building2,
      actions: [
        {
          label: "Ver Assets",
          href: `/admin/dashboard/${
            activeOrganization.type === 'restaurant' ? 'restaurantes' : 
            activeOrganization.type === 'event_service' ? 'eventos' :
            activeOrganization.type === 'activity_service' ? 'atividades' :
            activeOrganization.type === 'rental_service' ? 'veiculos' :
            activeOrganization.type === 'accommodation' ? 'hospedagens' : 'assets'
          }`,
          variant: "default" as const
        }
      ]
    },
    {
      title: "Reservas",
      description: "Acompanhar e gerenciar reservas",
      icon: Calendar,
      actions: [
        { label: "Ver Reservas", href: "/admin/dashboard/reservas", variant: "default" as const }
      ]
    },
    {
      title: "Equipe",
      description: "Gerenciar colaboradores e usuários",
      icon: Users,
      actions: [
        { label: "Colaboradores", href: "/admin/dashboard/colaboradores", variant: "outline" as const },
        { label: "Relatórios", href: "/admin/dashboard/metricas", variant: "outline" as const }
      ]
    },
    {
      title: "Chat",
      description: "Central de atendimento ao cliente",
      icon: MessageCircle,
      actions: [
        { label: "Abrir Chat", href: "/admin/dashboard/chat", variant: "default" as const }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo ao painel de controle - {activeOrganization.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        <DashboardSection 
          title="Estatísticas" 
          description="Desempenho do seu negócio"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total de Assets"
              value={partnerStats.totalAssets}
              subtitle={`+${partnerStats.recentAssets} este mês`}
              icon={Building2}
              variant="info"
            />
            <StatsCard
              title="Reservas do Mês"
              value={partnerStats.monthlyBookings}
              icon={Calendar}
              trend={{ value: `${partnerStats.bookingGrowth}%`, isPositive: partnerStats.bookingGrowth > 0 }}
              variant="success"
            />
            <StatsCard
              title="Receita Mensal"
              value={`R$ ${partnerStats.monthlyRevenue?.toLocaleString()}`}
              icon={DollarSign}
              trend={{ value: `${partnerStats.revenueGrowth}%`, isPositive: partnerStats.revenueGrowth > 0 }}
              variant="success"
            />
            <StatsCard
              title="Avaliação Média"
              value={partnerStats.averageRating}
              subtitle={`De ${partnerStats.totalReviews} avaliações`}
              icon={Star}
              variant="warning"
            />
          </div>
        </DashboardSection>
      )}

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Chat Notifications */}
        <div className="lg:col-span-1">
          <DashboardSection title="Notificações" variant="elevated">
            <ChatNotifications 
              maxItems={5} 
              showTitle={false}
              className="h-fit"
            />
          </DashboardSection>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <DashboardSection 
            title="Ações Rápidas" 
            description="Acesso rápido às principais funcionalidades"
            variant="elevated"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action, index) => (
                <ActionCard key={index} {...action} />
              ))}
            </div>
          </DashboardSection>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { activeOrganization, organizations } = useOrganization();
  
  if (!activeOrganization) {
    return <EmptyStateCard />;
  }

  const employeeActions = [
    {
      title: "Visualizar Assets",
      description: "Consultar recursos da organização",
      icon: Building2,
      actions: [
        {
          label: "Ver Assets",
          href: `/admin/dashboard/${
            activeOrganization.type === 'restaurant' ? 'restaurantes' : 
            activeOrganization.type === 'event_service' ? 'eventos' :
            activeOrganization.type === 'activity_service' ? 'atividades' :
            activeOrganization.type === 'rental_service' ? 'veiculos' :
            activeOrganization.type === 'accommodation' ? 'hospedagens' : 'assets'
          }`,
          variant: "outline" as const
        }
      ]
    },
    {
      title: "Ver Reservas",
      description: "Acompanhar reservas da organização",
      icon: Calendar,
      actions: [
        { label: "Ver Reservas", href: "/admin/dashboard/reservas", variant: "outline" as const }
      ]
    },
    {
      title: "Central de Chat",
      description: "Atendimento ao cliente",
      icon: MessageCircle,
      actions: [
        { label: "Abrir Chat", href: "/admin/dashboard/chat", variant: "outline" as const }
      ]
    },
    {
      title: "Mídias",
      description: "Visualizar mídias da organização",
      icon: Image,
      actions: [
        { label: "Ver Mídias", href: "/admin/dashboard/midias", variant: "outline" as const }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header - diferente para employee */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Área de trabalho - {activeOrganization.name}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Funcionário
            </Badge>
            <span className="text-sm text-gray-500">
              Acesso limitado às suas organizações atribuídas
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/chat">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Employee specific cards */}
      <DashboardSection 
        title="Informações da Conta" 
        description="Status e organizações atribuídas"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Suas Organizações"
            value={organizations?.length || 0}
            subtitle="Organizações atribuídas"
            icon={Building2}
            variant="info"
          />
          <StatsCard
            title="Organização Ativa"
            value={activeOrganization.name}
            subtitle={activeOrganization.type.replace('_', ' ')}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Status"
            value="Ativo"
            subtitle="Acesso autorizado"
            icon={CheckCircle}
            variant="success"
          />
        </div>
      </DashboardSection>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Chat Notifications */}
        <DashboardSection title="Notificações" variant="elevated">
          <ChatNotifications 
            maxItems={5} 
            showTitle={false}
            className="h-fit"
          />
        </DashboardSection>

        {/* Employee Actions */}
        <DashboardSection 
          title="Suas Ações" 
          description="Ações disponíveis para sua função"
          variant="elevated"
        >
          <div className="grid gap-4">
            {employeeActions.map((action, index) => (
              <ActionCard key={index} {...action} />
            ))}
          </div>
        </DashboardSection>
      </div>

      {/* Employee Notice */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Acesso de Funcionário</h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              Você tem acesso apenas às organizações atribuídas pelo seu parceiro. 
              Entre em contato com seu supervisor para solicitar acesso a outras áreas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useCurrentUser()
  
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
