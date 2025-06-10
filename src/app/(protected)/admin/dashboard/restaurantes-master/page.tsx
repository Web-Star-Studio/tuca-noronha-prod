"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Utensils, 
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
  AlertTriangle,
  Star,
  Clock,
  Phone,
  Globe
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

export default function RestaurantesMasterPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedCity, setSelectedCity] = useState<string>("all")

  // Buscar estatísticas do sistema
  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics)
  
  // Buscar todos os restaurantes
  const restaurantsResult = useQuery(api["domains/restaurants/queries"].getAll, {})

  const allRestaurants = restaurantsResult || []
  
  // Aplicar filtros do lado do cliente
  const restaurants = allRestaurants.filter((restaurant: any) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        restaurant.name?.toLowerCase().includes(searchLower) ||
        restaurant.description?.toLowerCase().includes(searchLower) ||
        restaurant.cuisine?.some((c: string) => c.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }
    
    // Filtro por status
    if (selectedStatus !== "all") {
      const restaurantStatus = restaurant.isActive ? "active" : "inactive"
      if (restaurantStatus !== selectedStatus) {
        return false
      }
    }
    
    // Filtro por cidade
    if (selectedCity !== "all") {
      const cityMatches = restaurant.address?.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
                          restaurant.address?.neighborhood?.toLowerCase().includes(selectedCity.toLowerCase())
      if (!cityMatches) {
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
          <div className="text-slate-600">Carregando restaurantes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
            <Utensils className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Restaurantes</h1>
            <p className="text-sm text-gray-600">
              Visualizar e gerenciar todos os restaurantes do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas dos Restaurantes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.restaurants}</div>
            <p className="text-xs text-muted-foreground">restaurantes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(systemStats.assets.restaurants * 0.85)}
            </div>
            <p className="text-xs text-muted-foreground">operando normalmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">4.6</div>
            <p className="text-xs text-muted-foreground">de 5 estrelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas/Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1.2K</div>
            <p className="text-xs text-green-600">+12% vs mês anterior</p>
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
                placeholder="Buscar por nome, dono ou especialidade..."
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
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                <SelectItem value="fernando-de-noronha">Fernando de Noronha</SelectItem>
                <SelectItem value="recife">Recife</SelectItem>
                <SelectItem value="olinda">Olinda</SelectItem>
                <SelectItem value="porto-de-galinhas">Porto de Galinhas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Restaurantes */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurantes ({restaurants.length})</CardTitle>
          <CardDescription>
            Lista completa de todos os restaurantes cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm || selectedStatus !== "all" || selectedCity !== "all" 
                        ? "Nenhum restaurante encontrado com os filtros aplicados" 
                        : "Nenhum restaurante cadastrado"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Dados mockados para exemplo
                [
                  {
                    _id: "1",
                    name: "Restaurante do Duda",
                    owner: "Eduardo Silva",
                    specialty: "Frutos do Mar",
                    location: "Fernando de Noronha",
                    status: "active",
                    rating: 4.8,
                    reservations: 45,
                    image: "/images/restaurants/duda.jpg",
                    _creationTime: Date.now() - 86400000
                  },
                  {
                    _id: "2", 
                    name: "Varanda Sunset",
                    owner: "Maria Santos",
                    specialty: "Culinária Regional",
                    location: "Fernando de Noronha",
                    status: "active",
                    rating: 4.6,
                    reservations: 32,
                    image: "/images/restaurants/varanda.jpg",
                    _creationTime: Date.now() - 172800000
                  },
                  {
                    _id: "3",
                    name: "Mergulhão Grill",
                    owner: "João Costa",
                    specialty: "Churrasco",
                    location: "Fernando de Noronha", 
                    status: "pending",
                    rating: 4.2,
                    reservations: 18,
                    image: "/images/restaurants/mergulhao.jpg",
                    _creationTime: Date.now() - 259200000
                  }
                ].map((restaurant: any) => (
                  <TableRow key={restaurant._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={restaurant.image} alt={restaurant.name} />
                          <AvatarFallback className="bg-orange-600 text-white">
                            {restaurant.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Aberto agora
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gray-200 text-xs">
                            {restaurant.owner.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{restaurant.owner}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {restaurant.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {restaurant.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={restaurant.status === "active" ? "default" : restaurant.status === "pending" ? "secondary" : "destructive"}>
                        {restaurant.status === "active" ? "Ativo" : restaurant.status === "pending" ? "Pendente" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{restaurant.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{restaurant.reservations}</div>
                        <div className="text-gray-500">este mês</div>
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
                            <Phone className="mr-2 h-4 w-4" />
                            Contatar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Suspender
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

      {/* Restaurantes em Destaque */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurantes em Destaque</CardTitle>
          <CardDescription>
            Os restaurantes com melhor desempenho este mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/images/restaurants/duda.jpg" alt="Restaurante do Duda" />
                    <AvatarFallback className="bg-orange-600 text-white">RD</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Restaurante do Duda</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm">4.8 · 45 reservas</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-orange-600">🏆 Maior Avaliação</Badge>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/images/restaurants/varanda.jpg" alt="Varanda Sunset" />
                    <AvatarFallback className="bg-blue-600 text-white">VS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Varanda Sunset</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm">4.6 · 32 reservas</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-blue-600">📈 Maior Crescimento</Badge>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/images/restaurants/mergulhao.jpg" alt="Mergulhão Grill" />
                    <AvatarFallback className="bg-green-600 text-white">MG</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Mergulhão Grill</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm">4.2 · 18 reservas</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-600">🚀 Novo Destaque</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 