"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Users, 
  Activity, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Clock,
  User,
  Settings,
  Database,
  Trash2,
  Edit
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const logTypeColors = {
  "create": "bg-green-100 text-green-800",
  "update": "bg-blue-100 text-blue-800", 
  "delete": "bg-red-100 text-red-800",
  "login": "bg-purple-100 text-purple-800",
  "logout": "bg-gray-100 text-gray-800",
  "error": "bg-red-100 text-red-800",
  "warning": "bg-yellow-100 text-yellow-800",
  "info": "bg-blue-100 text-blue-800"
}

const logTypeIcons = {
  "create": CheckCircle,
  "update": Edit,
  "delete": Trash2,
  "login": User,
  "logout": User,
  "error": XCircle,
  "warning": AlertTriangle,
  "info": Info
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [timeRange, setTimeRange] = useState("24h")
  const [refreshing, setRefreshing] = useState(false)

  // Buscar logs de auditoria (precisa criar esta query)
  const logsResult = useQuery(api["domains/audit/queries"].getAuditLogs, {
    searchTerm: searchTerm || undefined,
    type: selectedType !== "all" ? selectedType : undefined,
    userId: selectedUser !== "all" ? selectedUser : undefined,
    timeRange: timeRange,
  })

  const logs = logsResult?.page || []
  const logStats = logsResult?.stats || { total: 0, errors: 0, warnings: 0, today: 0 }

  // Dados mockados para exemplo
  const mockLogs = [
    {
      _id: "1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "create",
      action: "Usuário criado",
      user: { name: "Maria Santos", email: "maria@example.com", role: "partner" },
      details: "Novo usuário registrado no sistema",
      resource: "users",
      resourceId: "user_123",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    {
      _id: "2",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: "update",
      action: "Restaurante atualizado",
      user: { name: "João Silva", email: "joao@example.com", role: "partner" },
      details: "Informações do restaurante foram modificadas",
      resource: "restaurants",
      resourceId: "rest_456",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    },
    {
      _id: "3",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      type: "error",
      action: "Falha no pagamento",
      user: { name: "Ana Costa", email: "ana@example.com", role: "traveler" },
      details: "Erro ao processar pagamento da reserva",
      resource: "payments",
      resourceId: "pay_789",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
    },
    {
      _id: "4",
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      type: "login",
      action: "Login realizado",
      user: { name: "Admin Master", email: "admin@tucanoronha.com", role: "master" },
      details: "Usuário fez login no sistema",
      resource: "auth",
      resourceId: "session_101",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    {
      _id: "5",
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      type: "delete",
      action: "Asset removido",
      user: { name: "Pedro Admin", email: "pedro@example.com", role: "partner" },
      details: "Evento foi removido do sistema",
      resource: "events",
      resourceId: "event_202",
      ipAddress: "192.168.1.103",
      userAgent: "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36"
    }
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m atrás`
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`
    } else {
      return `${diffDays}d atrás`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
            <p className="text-sm text-gray-600">
              Monitore todas as atividades e eventos do sistema
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
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

      {/* Estatísticas dos Logs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">nas últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">23</div>
            <p className="text-xs text-muted-foreground">requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avisos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">56</div>
            <p className="text-xs text-muted-foreground">para monitorar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">89</div>
            <p className="text-xs text-muted-foreground">online agora</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por ação, usuário ou recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="master">Masters</SelectItem>
                <SelectItem value="partner">Partners</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
                <SelectItem value="traveler">Travelers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
          <CardDescription>
            Histórico completo de atividades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => {
                const IconComponent = logTypeIcons[log.type as keyof typeof logTypeIcons] || Info
                return (
                  <TableRow key={log._id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={logTypeColors[log.type as keyof typeof logTypeColors] || "bg-gray-100 text-gray-800"}
                      >
                        <IconComponent className="h-3 w-3 mr-1" />
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-gray-500">{log.details}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gray-200 text-xs">
                            {log.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{log.user.name}</div>
                          <div className="text-xs text-gray-500">{log.user.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resource}</div>
                        <div className="text-gray-500 font-mono text-xs">{log.resourceId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{log.ipAddress}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumo por Categoria */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades por Tipo</CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Criações</span>
              </div>
              <div className="text-sm font-medium">156</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Atualizações</span>
              </div>
              <div className="text-sm font-medium">89</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-600" />
                <span className="text-sm">Exclusões</span>
              </div>
              <div className="text-sm font-medium">12</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Autenticação</span>
              </div>
              <div className="text-sm font-medium">234</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recursos Mais Acessados</CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Usuários</span>
              </div>
              <div className="text-sm font-medium">345 eventos</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-sm">Assets</span>
              </div>
              <div className="text-sm font-medium">189 eventos</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Autenticação</span>
              </div>
              <div className="text-sm font-medium">234 eventos</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Configurações</span>
              </div>
              <div className="text-sm font-medium">67 eventos</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 