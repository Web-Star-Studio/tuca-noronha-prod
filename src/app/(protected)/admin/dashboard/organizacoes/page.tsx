"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const organizationTypeLabels = {
  "restaurant": "Restaurante",
  "accommodation": "Hospedagem", 
  "rental_service": "Aluguel de Veículos",
  "activity_service": "Atividades",
  "event_service": "Eventos"
}

const organizationTypeColors = {
  "restaurant": "bg-orange-100 text-orange-800",
  "accommodation": "bg-blue-100 text-blue-800",
  "rental_service": "bg-purple-100 text-purple-800",
  "activity_service": "bg-green-100 text-green-800",
  "event_service": "bg-pink-100 text-pink-800"
}

export default function OrganizationsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Buscar estatísticas do sistema
  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics)
  
  // Buscar todas as organizações
  const organizationsResult = useQuery(api["domains/rbac/queries"].listPartnerOrganizations, {})

  const allOrganizations = organizationsResult || []
  
  // Aplicar filtros do lado do cliente
  const organizations = allOrganizations.filter((org: any) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        org.name?.toLowerCase().includes(searchLower) ||
        org.location?.toLowerCase().includes(searchLower) ||
        org.type?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }
    
    // Filtro por tipo
    if (selectedType !== "all" && org.type !== selectedType) {
      return false
    }
    
    // Filtro por status
    if (selectedStatus !== "all") {
      const orgStatus = org.isActive ? "active" : "inactive"
      if (orgStatus !== selectedStatus) {
        return false
      }
    }
    
    return true
  })

  if (!systemStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Carregando organizações...</div>
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
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Organizações</h1>
            <p className="text-sm text-gray-600">
              Visualizar e gerenciar todas as organizações do sistema
            </p>
          </div>
        </div>
        <Link href="/admin/dashboard/novo-empreendimento">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Organização
          </Button>
        </Link>
      </div>

      {/* Estatísticas Globais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.organizations.total}</div>
            <p className="text-xs text-muted-foreground">organizações cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.organizations.active}</div>
            <p className="text-xs text-muted-foreground">em funcionamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {systemStats.organizations.total - systemStats.organizations.active}
            </div>
            <p className="text-xs text-muted-foreground">aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(systemStats.organizations.active * 0.8)}
            </div>
            <p className="text-xs text-muted-foreground">com conteúdo ativo</p>
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
                placeholder="Buscar por nome, cidade ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="restaurant">Restaurantes</SelectItem>
                <SelectItem value="rental_service">Aluguel de Veículos</SelectItem>
                <SelectItem value="activity_service">Atividades</SelectItem>
                <SelectItem value="event_service">Eventos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Organizações */}
      <Card>
        <CardHeader>
          <CardTitle>Organizações ({organizations.length})</CardTitle>
          <CardDescription>
            Lista completa de todas as organizações cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm || selectedType !== "all" || selectedStatus !== "all" 
                        ? "Nenhuma organização encontrada com os filtros aplicados" 
                        : "Nenhuma organização cadastrada"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org: any) => (
                  <TableRow key={org._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={org.image} alt={org.name} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {org.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {org.location || "Localização não informada"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={organizationTypeColors[org.type as keyof typeof organizationTypeColors] || "bg-gray-100 text-gray-800"}
                      >
                        {organizationTypeLabels[org.type as keyof typeof organizationTypeLabels] || org.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gray-200 text-xs">
                            {org.ownerId ? "U" : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {org.ownerName || "Nome não disponível"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? "default" : "secondary"}>
                        {org.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{org.assetsCount || 0}</div>
                        <div className="text-gray-500">assets</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(org._creationTime).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 