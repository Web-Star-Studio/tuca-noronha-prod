"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useOptimizedAssets, useAssetTypeCounts } from "@/hooks/useOptimizedAssets";
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
  Shield,
  Eye,
  ExternalLink
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Id } from "@/../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "../components";

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
  // Campos adicionais que podem existir nos assets
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  location?: string;
  address?: string;
  imageUrl?: string;
  galleryImages?: string[];
  includes?: string[];
  additionalInfo?: string[];
  highlights?: string[];
  isFeatured?: boolean;
  maxParticipants?: number;
  hasMultipleTickets?: boolean;
  date?: string;
  time?: string;
  speaker?: string;
  speakerBio?: string;
  whatsappContact?: string;
  pricePerDay?: number;
  pricePerNight?: number;
  status?: string;
  ownerId?: Id<"users">;
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
  const router = useRouter();
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAssetDetailsModalOpen, setIsAssetDetailsModalOpen] = useState(false);

  // Use optimized asset management hooks
  const {
    allAssets,
    isLoading,
    hasError,
    refetch,
    totalCount,
    activeCount,
    inactiveCount,
  } = useOptimizedAssets({
    assetType: selectedAssetType as any,
    isActive: selectedStatus === "all" ? undefined : selectedStatus === "active",
    limit: 200,
  });

  // Use optimized asset type counts for system statistics
  const assetTypeCounts = useAssetTypeCounts();
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

  // Optimized asset statistics using memoization
  const assetStats = useMemo(() => {
    if (!allAssets || allAssets.length === 0) return null;

    const withBookings = allAssets.filter(a => (a.bookingsCount || 0) > 0).length;
    const avgRating = allAssets.length > 0 
      ? allAssets.reduce((sum, a) => sum + (a.rating || 0), 0) / allAssets.length
      : 0;

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      withBookings,
      avgRating,
    };
  }, [allAssets, totalCount, activeCount, inactiveCount]);

  // Handler for viewing asset details
  const handleViewAssetDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetDetailsModalOpen(true);
  };

  // Handler for navigating to asset-specific page
  const handleNavigateToAsset = (asset: Asset) => {
    const routes = {
      restaurants: `/restaurantes/${asset.name.toLowerCase().replace(/\s+/g, '-')}`,
      events: `/eventos/${asset._id}`,
      activities: `/atividades/${asset._id}`,
      vehicles: `/veiculos/${asset._id}`,
      accommodations: `/hospedagens/${asset.name.toLowerCase().replace(/\s+/g, '-')}`
    };

    const route = routes[asset.assetType as keyof typeof routes];
    if (route) {
      window.open(route, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Gestão de Assets"
        description="Visualizar e gerenciar todos os assets do sistema"
        icon={Database}
      />

      {/* Estatísticas Globais */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assetTypeCounts.total}</div>
              <p className="text-xs text-muted-foreground">assets no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
              <Store className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{assetTypeCounts.restaurants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{assetTypeCounts.events}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{assetTypeCounts.activities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veículos</CardTitle>
              <Car className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{assetTypeCounts.vehicles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hospedagens</CardTitle>
              <Building2 className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{assetTypeCounts.accommodations}</div>
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
                {assetStats.avgRating && typeof assetStats.avgRating === 'number' ? assetStats.avgRating.toFixed(1) : "0.0"}
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
          {/* Enhanced loading state with query-specific status */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Carregando Assets</h3>
                <p className="text-sm text-gray-500">
                  {selectedAssetType === "all" 
                    ? "Buscando todos os tipos de assets..." 
                    : `Carregando ${assetTypeLabels[selectedAssetType] || selectedAssetType}...`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Erro ao Carregar Assets</h3>
                <p className="text-sm text-gray-500">
                  Ocorreu um erro ao buscar os dados. Tente novamente.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !hasError && allAssets && filteredAssets.length === 0 && (
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

          {!isLoading && !hasError && filteredAssets.length > 0 && (
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
                        {asset.rating && typeof asset.rating === 'number' ? (
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAssetDetails(asset)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleNavigateToAsset(asset)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Visitar
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
              {assetTypeCounts.restaurants}
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
              {assetTypeCounts.events}
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
              {assetTypeCounts.activities}
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

      {/* Asset Details Modal */}
      <Dialog open={isAssetDetailsModalOpen} onOpenChange={setIsAssetDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Asset
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre {selectedAsset?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getAssetIcon(selectedAsset.assetType)}
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Nome:</span>
                      <p className="text-sm text-gray-900">{selectedAsset.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Tipo:</span>
                      <Badge className={`${assetTypeColors[selectedAsset.assetType]} ml-2`}>
                        {assetTypeLabels[selectedAsset.assetType]}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <Badge variant={selectedAsset.isActive ? "default" : "secondary"} className="ml-2">
                        {selectedAsset.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">ID:</span>
                      <p className="text-sm text-gray-900 font-mono">{selectedAsset._id}</p>
                    </div>
                  </div>

                  {selectedAsset.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Descrição:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedAsset.description}</p>
                    </div>
                  )}

                  {selectedAsset.location && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Localização:</span>
                      <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedAsset.location}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Partner Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Parceiro Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Nome:</span>
                      <p className="text-sm text-gray-900">{selectedAsset.partnerName || "Nome não informado"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email:</span>
                      <p className="text-sm text-gray-900">{selectedAsset.partnerEmail || "Email não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Métricas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{selectedAsset.bookingsCount || 0}</div>
                      <p className="text-sm text-gray-600">Reservas</p>
                    </div>
                                         <div className="text-center p-4 bg-yellow-50 rounded-lg">
                       <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                       <div className="text-2xl font-bold text-yellow-600">
                         {selectedAsset.rating && typeof selectedAsset.rating === 'number' ? selectedAsset.rating.toFixed(1) : "N/A"}
                       </div>
                       <p className="text-sm text-gray-600">Avaliação</p>
                     </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {selectedAsset.price ? formatPrice(selectedAsset.price) : "N/A"}
                      </div>
                      <p className="text-sm text-gray-600">Preço</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Criado em:</span>
                      <p>{formatDate(selectedAsset._creationTime)}</p>
                    </div>
                    {selectedAsset.maxParticipants && (
                      <div>
                        <span className="font-medium text-gray-700">Capacidade máxima:</span>
                        <p>{selectedAsset.maxParticipants} pessoas</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex justify-between gap-4">
                <Button 
                  variant="outline"
                  onClick={() => handleNavigateToAsset(selectedAsset)}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visitar Página
                </Button>
                <Button 
                  onClick={() => setIsAssetDetailsModalOpen(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 