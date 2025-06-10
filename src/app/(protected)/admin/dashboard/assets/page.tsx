"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database,
  Search, 
  Filter,
  Store,
  Calendar,
  Activity,
  Car,
  Building2,
  User,
  MapPin,
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Shield
} from "lucide-react";
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
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Id } from "@/../convex/_generated/dataModel";

type Asset = {
  _id: string;
  _creationTime: number;
  name: string;
  assetType: string;
  isActive: boolean;
  partnerId: Id<"users">;
  partnerName?: string;
  partnerEmail?: string;
  bookingsCount?: number;
  rating?: number;
  price?: number;
};

const assetTypeLabels: Record<string, string> = {
  restaurants: "Restaurante",
  events: "Evento",
  activities: "Atividade",
  vehicles: "Veículo",
  accommodations: "Hospedagem",
};

const assetTypeColors: Record<string, string> = {
  restaurants: "bg-orange-100 text-orange-800",
  events: "bg-blue-100 text-blue-800",
  activities: "bg-green-100 text-green-800",
  vehicles: "bg-purple-100 text-purple-800",
  accommodations: "bg-pink-100 text-pink-800",
};

const assetTypeIcons: Record<string, any> = {
  restaurants: Store,
  events: Calendar,
  activities: Activity,
  vehicles: Car,
  accommodations: Building2,
};

export default function AssetsManagementPage() {
  const { user } = useCurrentUser();
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const allAssets = useQuery(api["domains/users/queries"].listAllAssets, {
    assetType: selectedAssetType === "all" ? undefined : selectedAssetType as any,
    isActive: selectedStatus === "all" ? undefined : selectedStatus === "active",
    limit: 200,
  });

  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics);

  if (user?.role !== "master") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Filtrar assets baseado na busca
  const filteredAssets = allAssets?.filter((asset) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      asset.name.toLowerCase().includes(searchLower) ||
      asset.partnerName?.toLowerCase().includes(searchLower) ||
      asset.partnerEmail?.toLowerCase().includes(searchLower) ||
      assetTypeLabels[asset.assetType]?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getAssetIcon = (assetType: string) => {
    const Icon = assetTypeIcons[assetType] || Database;
    return <Icon className="h-4 w-4" />;
  };

  const getAssetStats = () => {
    if (!allAssets) return null;

    const stats = {
      total: allAssets.length,
      active: allAssets.filter(a => a.isActive).length,
      inactive: allAssets.filter(a => !a.isActive).length,
      withBookings: allAssets.filter(a => (a.bookingsCount || 0) > 0).length,
      avgRating: allAssets.reduce((sum, a) => sum + (a.rating || 0), 0) / allAssets.length,
    };

    return stats;
  };

  const assetStats = getAssetStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Assets</h1>
            <p className="text-sm text-gray-600">
              Visualizar e gerenciar todos os assets do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas Globais */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.assets.total}</div>
              <p className="text-xs text-muted-foreground">assets no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
              <Store className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{systemStats.assets.restaurants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{systemStats.assets.events}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemStats.assets.activities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veículos</CardTitle>
              <Car className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{systemStats.assets.vehicles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hospedagens</CardTitle>
              <Building2 className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{systemStats.assets.accommodations}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estatísticas dos Assets Filtrados */}
      {assetStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assetStats.total}</div>
              <p className="text-xs text-muted-foreground">assets encontrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{assetStats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{assetStats.inactive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Reservas</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{assetStats.withBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {assetStats.avgRating ? assetStats.avgRating.toFixed(1) : "0.0"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, parceiro, ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="restaurants">Restaurantes</SelectItem>
            <SelectItem value="events">Eventos</SelectItem>
            <SelectItem value="activities">Atividades</SelectItem>
            <SelectItem value="vehicles">Veículos</SelectItem>
            <SelectItem value="accommodations">Hospedagens</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Assets do Sistema
            {filteredAssets.length > 0 && (
              <Badge variant="secondary">
                {filteredAssets.length} {filteredAssets.length === 1 ? "asset" : "assets"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!allAssets && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {allAssets && filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum asset encontrado</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `Nenhum asset encontrado para "${searchTerm}".`
                  : "Não há assets no sistema no momento."
                }
              </p>
            </div>
          )}

          {filteredAssets.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                            {getAssetIcon(asset.assetType)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {asset._id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${assetTypeColors[asset.assetType]}`}>
                          {assetTypeLabels[asset.assetType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.isActive ? "default" : "secondary"}>
                          <div className="flex items-center gap-1">
                            {asset.isActive ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {asset.isActive ? "Ativo" : "Inativo"}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {asset.partnerName || "Nome não informado"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.partnerEmail}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {asset.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{asset.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.price ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatPrice(asset.price)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{asset.bookingsCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(asset._creationTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                          {asset.assetType === "events" && asset.bookingsCount && asset.bookingsCount > 0 && (
                            <Button variant="outline" size="sm">
                              Ver Reservas
                            </Button>
                          )}
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

      {/* Quick Actions por Tipo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Restaurantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {allAssets?.filter(a => a.assetType === "restaurants").length || 0}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Total de restaurantes cadastrados
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelectedAssetType("restaurants")}>
              Ver Restaurantes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {allAssets?.filter(a => a.assetType === "events").length || 0}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Total de eventos programados
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelectedAssetType("events")}>
              Ver Eventos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {allAssets?.filter(a => a.assetType === "activities").length || 0}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Total de atividades disponíveis
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelectedAssetType("activities")}>
              Ver Atividades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 