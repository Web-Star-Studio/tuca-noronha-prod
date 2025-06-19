"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
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
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Ticket,
  Music,
  Utensils
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
import { DashboardPageHeader } from "../components"

const eventTypeColors = {
  "music": "bg-purple-100 text-purple-800",
  "gastronomy": "bg-orange-100 text-orange-800",
  "culture": "bg-blue-100 text-blue-800",
  "sport": "bg-green-100 text-green-800",
  "nature": "bg-emerald-100 text-emerald-800"
}

const eventStatusColors = {
  "upcoming": "bg-blue-100 text-blue-800",
  "ongoing": "bg-green-100 text-green-800", 
  "finished": "bg-gray-100 text-gray-800",
  "cancelled": "bg-red-100 text-red-800"
}

export default function EventosMasterPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCity, setSelectedCity] = useState<string>("all")

  // Buscar estatísticas do sistema
  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics)
  
  // Buscar todos os eventos
  const eventsResult = useQuery(api["domains/events/queries"].getAll, {})

  const allEvents = eventsResult || []
  
  // Aplicar filtros do lado do cliente
  const events = allEvents.filter((event: any) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }
    
    // Filtro por status
    if (selectedStatus !== "all") {
      // Determinar status baseado na data
      const eventDate = new Date(event.date)
      const today = new Date()
      let eventStatus = "upcoming"
      
      if (eventDate < today) {
        eventStatus = "finished"
      } else if (eventDate.toDateString() === today.toDateString()) {
        eventStatus = "ongoing"
      }
      
      if (eventStatus !== selectedStatus) {
        return false
      }
    }
    
    // Filtro por tipo/categoria
    if (selectedType !== "all" && event.category !== selectedType) {
      return false
    }
    
    // Filtro por cidade (baseado no location)
    if (selectedCity !== "all") {
      const cityMatches = event.location?.toLowerCase().includes(selectedCity.toLowerCase())
      if (!cityMatches) {
        return false
      }
    }
    
    return true
  })

  // Calculate event statistics from real data
  const eventStats = {
    upcoming: allEvents.filter((event: any) => {
      const eventDate = new Date(event.date)
      return eventDate > new Date()
    }).length,
    totalParticipants: 0, // TODO: Calculate from bookings when available
    averageRating: 4.7 // TODO: Calculate from real ratings when available
  }

  if (!systemStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Carregando eventos...</div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      "upcoming": "Próximo",
      "ongoing": "Em andamento",
      "finished": "Finalizado", 
      "cancelled": "Cancelado"
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      "music": "Música",
      "gastronomy": "Gastronomia",
      "culture": "Cultura",
      "sport": "Esporte",
      "nature": "Natureza"
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Gestão de Eventos"
        description="Visualizar e gerenciar todos os eventos do sistema"
        icon={Calendar}
      />

      {/* Estatísticas dos Eventos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.events}</div>
            <p className="text-xs text-muted-foreground">eventos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {eventStats.upcoming}
            </div>
            <p className="text-xs text-muted-foreground">eventos programados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {eventStats.totalParticipants}
            </div>
            <p className="text-xs text-muted-foreground">inscrições confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{eventStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">de 5 estrelas</p>
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
                placeholder="Buscar por nome, organizador ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
                <SelectItem value="ongoing">Em andamento</SelectItem>
                <SelectItem value="finished">Finalizados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="music">Música</SelectItem>
                <SelectItem value="gastronomy">Gastronomia</SelectItem>
                <SelectItem value="culture">Cultura</SelectItem>
                <SelectItem value="sport">Esporte</SelectItem>
                <SelectItem value="nature">Natureza</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                <SelectItem value="praia-do-sancho">Praia do Sancho</SelectItem>
                <SelectItem value="vila-dos-remedios">Vila dos Remédios</SelectItem>
                <SelectItem value="baia-dos-porcos">Baía dos Porcos</SelectItem>
                <SelectItem value="morro-do-piquinho">Morro do Piquinho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos ({allEvents.length})</CardTitle>
          <CardDescription>
            Lista completa de todos os eventos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Organizador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: any) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={event.imageUrl || event.image} alt={event.title || event.name} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {(event.title || event.name).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{event.title || event.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {event.rating || 4.5}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{event.organizer || event.creatorName || "Organizador"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={eventTypeColors[(event.type || event.category) as keyof typeof eventTypeColors] || "bg-gray-100 text-gray-800"}
                    >
                      {getTypeLabel(event.type || event.category || 'general')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatDate(event.date)}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time || event.start_time || "Não informado"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {event.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {event.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">-/-</div>
                      <div className="text-gray-500">
                        A implementar
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      R$ {event.price || 0}
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
                        <DropdownMenuItem>
                          <Ticket className="mr-2 h-4 w-4" />
                          Participantes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Eventos em Destaque - Será implementado quando houver dados de desempenho */}
      {allEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>
              Os eventos cadastrados mais recentemente no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allEvents.slice(0, 3).map((event: any) => (
                <Card key={event._id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={event.imageUrl} alt={event.title} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {event.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600">{event.category || "Evento"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 