"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Car, 
  Users, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  Fuel, 
  Settings,
  Search,
  Filter,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  MapPin
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRouter } from "next/navigation";

type VehicleData = {
  _id: Id<"vehicles">;
  name: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  licensePlate: string;
  color: string;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  description?: string;
  features: string[];
  imageUrl?: string;
  status: string;
  createdAt: number;
  ownerId?: Id<"users">;
  organizationId?: string;
};

const categoryLabels: Record<string, string> = {
  "economy": "Econômico",
  "compact": "Compacto",
  "sedan": "Sedan",
  "suv": "SUV",
  "luxury": "Luxo",
  "minivan": "Minivan",
  "pickup": "Pickup",
  "convertible": "Conversível",
  "hatchback": "Hatchback",
};

const statusLabels: Record<string, string> = {
  "available": "Disponível",
  "rented": "Alugado",
  "maintenance": "Manutenção",
  "inactive": "Inativo",
};

const statusColors: Record<string, string> = {
  "available": "bg-green-100 text-green-800",
  "rented": "bg-blue-100 text-blue-800",
  "maintenance": "bg-yellow-100 text-yellow-800",
  "inactive": "bg-gray-100 text-gray-800",
};

export default function VehiclesMasterPage() {
  const { user } = useCurrentUser();
  const router = useRouter();

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTransmission, setSelectedTransmission] = useState("all");

  // Verificar permissões
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "master") {
    router.push("/admin/dashboard");
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Queries
  const vehiclesData = useQuery(api.domains.vehicles.queries.listVehiclesSimple, {});
  const vehicles = vehiclesData as VehicleData[] | undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filtrar veículos baseado nos filtros aplicados
  const filteredVehicles = vehicles?.filter((vehicle) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !vehicle.name.toLowerCase().includes(searchLower) &&
        !vehicle.brand.toLowerCase().includes(searchLower) &&
        !vehicle.model.toLowerCase().includes(searchLower) &&
        !vehicle.licensePlate.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (selectedCategory !== "all" && vehicle.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== "all" && vehicle.status !== selectedStatus) {
      return false;
    }
    if (selectedTransmission !== "all" && vehicle.transmission !== selectedTransmission) {
      return false;
    }
    return true;
  }) || [];

  // Estatísticas
  const stats = vehicles ? {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    rented: vehicles.filter(v => v.status === "rented").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
    totalRevenuePotential: vehicles.reduce((sum, v) => sum + v.pricePerDay, 0),
    avgPricePerDay: vehicles.length > 0 ? vehicles.reduce((sum, v) => sum + v.pricePerDay, 0) / vehicles.length : 0,
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Car className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Veículos</h1>
            <p className="text-sm text-gray-600">
              Visão completa de todos os veículos da plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">veículos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alugados</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.rented}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.rented / stats.total) * 100) : 0}% em uso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
              <Settings className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.maintenance / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Potencial</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalRevenuePotential)}
              </div>
              <p className="text-xs text-muted-foreground">por dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.avgPricePerDay)}
              </div>
              <p className="text-xs text-muted-foreground">por dia</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Nome, marca, modelo ou placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transmissão</Label>
              <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as transmissões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as transmissões</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automática</SelectItem>
                  <SelectItem value="cvt">CVT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Veículos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Veículos da Plataforma
            {filteredVehicles.length > 0 && (
              <Badge variant="secondary">
                {filteredVehicles.length} {filteredVehicles.length === 1 ? "veículo" : "veículos"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!vehicles && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {vehicles && filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" || selectedTransmission !== "all"
                  ? "Nenhum veículo corresponde aos filtros aplicados."
                  : "Não há veículos cadastrados no momento."
                }
              </p>
            </div>
          )}

          {filteredVehicles.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço/Dia</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vehicle.licensePlate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Cor:</span> {vehicle.color}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Câmbio:</span> {vehicle.transmission}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[vehicle.category] || vehicle.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(vehicle.pricePerDay)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {vehicle.seats} pessoas
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Fuel className="h-4 w-4 text-gray-400" />
                          {vehicle.fuelType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[vehicle.status] || "bg-gray-100 text-gray-800"}>
                          {statusLabels[vehicle.status] || vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(vehicle.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/veiculos/${vehicle._id}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
