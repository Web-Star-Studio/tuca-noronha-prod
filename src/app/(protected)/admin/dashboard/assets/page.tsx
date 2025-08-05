"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useOptimizedAssets, useAssetTypeCounts, type EnrichedAsset } from "@/hooks/useOptimizedAssets";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, Search, Filter, Store, Calendar, Activity, Car, Building2, User,
  Star, TrendingUp, CheckCircle, XCircle, Shield,
  ExternalLink, MoreHorizontal, Info, AlertTriangle, Package
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import Image from 'next/image';
import { DashboardPageHeader } from "../components";

type Asset = EnrichedAsset;

const assetTypeLabels: Record<string, string> = {
  restaurants: "Restaurante",
  events: "Evento",
  activities: "Atividade",
  vehicles: "Veículo",
};

const assetTypeColors: Record<string, string> = {
  restaurants: "bg-orange-100 text-orange-800",
  events: "bg-blue-100 text-blue-800",
  activities: "bg-green-100 text-green-800",
  vehicles: "bg-purple-100 text-purple-800",
};

const assetTypeIcons: Record<string, any> = {
  restaurants: Store,
  events: Calendar,
  activities: Activity,
  vehicles: Car,
};

const getAssetIcon = (assetType: string) => {
  const Icon = assetTypeIcons[assetType] || Database;
  return <Icon className="h-4 w-4" />;
};

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

  // Helper component for rendering asset-specific details in the table
  const AssetDetailsCell = ({ asset }: { asset: Asset }) => {
    const getAssetDetails = () => {
      switch (asset.assetType) {
        case 'vehicles':
          return [
            asset.category && { label: 'Categoria', value: asset.category },
            asset.licensePlate && { label: 'Placa', value: asset.licensePlate },
            asset.pricePerDay && { label: 'Diária', value: formatPrice(asset.pricePerDay) }
          ].filter(Boolean);
        
        case 'accommodations':
          return [
            asset.type && { label: 'Tipo', value: asset.type },
            asset.location && { label: 'Local', value: asset.location },
            asset.pricePerNight && { label: 'Noite', value: formatPrice(asset.pricePerNight) }
          ].filter(Boolean);
        
        case 'events':
          return [
            asset.date && { label: 'Data', value: formatDate(new Date(asset.date).getTime()) },
            asset.location && { label: 'Local', value: asset.location }
          ].filter(Boolean);
        
        case 'activities':
          return [
            asset.category && { label: 'Categoria', value: asset.category },
            asset.duration && { label: 'Duração', value: asset.duration }
          ].filter(Boolean);
        
        case 'restaurants':
          return [
            asset.cuisine && Array.isArray(asset.cuisine) && { label: 'Cozinha', value: asset.cuisine.join(', ') },
            asset.address && { label: 'Endereço', value: String(asset.address) }
          ].filter(Boolean);
        
        default:
          return [];
      }
    };

    const details = getAssetDetails();

    if (details.length === 0) {
      return <span className="text-gray-500">-</span>;
    }

    return (
      <div className="flex flex-col text-xs text-gray-600 space-y-1">
        {details.slice(0, 2).map((detail, index) => (
          <div key={index} className="flex">
            <span className="font-semibold w-20">{(detail as any).label}:</span>
            <span className="truncate">{(detail as any).value}</span>
          </div>
        ))}
      </div>
    );
  };

// Component for rendering assets in a table (Desktop)
const AssetsTable = ({ assets, handleNavigateToAsset }: {
  assets: Asset[];
  handleNavigateToAsset: (asset: Asset) => void;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Asset</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Detalhes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Parceiro</TableHead>
          <TableHead className="text-right">Criado em</TableHead>
          <TableHead className="w-[50px] text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset._id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  {asset.imageUrl ? (
                    <Image 
                      src={asset.imageUrl} 
                      alt={asset.name || asset.title || 'Asset Image'} 
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  ) : (
                    getAssetIcon(asset.assetType)
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-semibold block truncate max-w-[150px]">{asset.name || asset.title}</span>
                  <p className="text-xs text-gray-500">{asset._id}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={`text-xs ${assetTypeColors[asset.assetType] || "bg-gray-100 text-gray-800"}`}>
                {assetTypeLabels[asset.assetType] || "Desconhecido"}
              </Badge>
            </TableCell>
            <TableCell>
              <AssetDetailsCell asset={asset} />
            </TableCell>
            <TableCell>
              <Badge variant={asset.isActive ? "default" : "outline"} className="flex items-center gap-1.5 w-fit">
                {asset.isActive ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                {asset.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">{asset.partnerName || "N/A"}</div>
                  <div className="text-sm text-gray-500">{asset.partnerEmail}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(asset._creationTime)}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleNavigateToAsset(asset)}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Visitar Página
                  </DropdownMenuItem>
                  {asset.assetType === "events" && asset.bookingsCount && asset.bookingsCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Package className="mr-2 h-4 w-4" /> Ver Reservas
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// Component for rendering assets in a grid (Mobile)
const AssetsGrid = ({ assets, handleNavigateToAsset }: {
  assets: Asset[];
  handleNavigateToAsset: (asset: Asset) => void;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {assets.map((asset) => (
      <Card key={asset._id} className="flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden relative flex-shrink-0">
              {asset.imageUrl ? (
                <Image 
                  src={asset.imageUrl} 
                  alt={asset.name || asset.title || 'Asset Image'} 
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-md"
                />
              ) : (
                getAssetIcon(asset.assetType)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold block truncate">{asset.name || asset.title}</p>
              <p className="text-xs text-gray-500 truncate">{asset._id}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleNavigateToAsset(asset)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Visitar Página
              </DropdownMenuItem>
              {asset.assetType === "events" && asset.bookingsCount && asset.bookingsCount > 0 && (
                 <DropdownMenuItem>
                  <Package className="mr-2 h-4 w-4" /> Ver Reservas
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Badge className={`text-xs ${assetTypeColors[asset.assetType] || "bg-gray-100 text-gray-800"}`}>
              {assetTypeLabels[asset.assetType] || "Desconhecido"}
            </Badge>
            <Badge variant={asset.isActive ? "default" : "outline"} className="flex items-center gap-1.5">
              {asset.isActive ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              {asset.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div className="border-t pt-3">
            <AssetDetailsCell asset={asset} />
          </div>
        </CardContent>
        <div className="border-t p-4 text-xs text-gray-500 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{asset.partnerName || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(asset._creationTime)}</span>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const StatusDisplay = ({
  isLoading,
  hasError,
  hasData,
  filteredData,
  searchTerm,
  selectedAssetType,
  onRetry,
}: {
  isLoading: boolean;
  hasError: boolean;
  hasData: boolean;
  filteredData: any[];
  searchTerm: string;
  selectedAssetType: string;
  onRetry: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Carregando Assets</h3>
          <p className="text-sm text-gray-500">
            {selectedAssetType === "all"
              ? "Buscando todos os tipos de assets..."
              : `Carregando ${assetTypeLabels[selectedAssetType] || selectedAssetType}...`}
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-red-50 rounded-lg">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-900">Erro ao Carregar Assets</h3>
          <p className="text-sm text-red-700">Ocorreu um erro ao buscar os dados. Por favor, tente novamente.</p>
          <Button variant="destructive" className="mt-4" onClick={onRetry}>
            <ExternalLink className="h-4 w-4 mr-2" /> Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (hasData && filteredData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum asset encontrado</h3>
        <p className="text-gray-600">
          {searchTerm
            ? `Nenhum asset corresponde à busca por "${searchTerm}".`
            : "Não há assets cadastrados para os filtros selecionados."}
        </p>
      </div>
    );
  }

  return null;
};


export default function AssetsManagementPage() {
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset] = useState<Asset | null>(null);
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
  const systemStats = useQuery(api.domains.users.queries.getSystemStatistics);

  // Filtrar assets baseado na busca - moved before early return
  const filteredAssets = useMemo(() => {
    if (!allAssets) return [];
    if (!searchTerm) return allAssets;
    
    const searchLower = searchTerm.toLowerCase();
    return allAssets.filter((asset) => (
      (asset.name || asset.title || "").toLowerCase().includes(searchLower) ||
      asset.partnerName?.toLowerCase().includes(searchLower) ||
      asset.partnerEmail?.toLowerCase().includes(searchLower) ||
      assetTypeLabels[asset.assetType]?.toLowerCase().includes(searchLower)
    ));
  }, [allAssets, searchTerm]);

  // Optimized asset statistics using memoization - moved before early return
  const assetStats = useMemo(() => {
    if (!filteredAssets || filteredAssets.length === 0) return null;

    const withBookings = filteredAssets.filter(a => (a.bookingsCount || 0) > 0).length;
    const avgRating = allAssets && allAssets.length > 0 
      ? allAssets.reduce((sum, a) => sum + (a.rating || 0), 0) / allAssets.length
      : 0;

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      withBookings,
      avgRating,
    };
  }, [allAssets, filteredAssets, totalCount, activeCount, inactiveCount]);

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


  // Handler for navigating to asset-specific page
  const handleNavigateToAsset = (asset: Asset) => {
    const routes = {
      restaurants: `/restaurantes/${asset.slug}`,
      events: `/eventos/${asset._id}`,
      activities: `/atividades/${asset._id}`,
      vehicles: `/veiculos/${asset._id}`,
  
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

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">Filtros de Assets</CardTitle>
              <p className="text-sm text-muted-foreground">
                Refine sua busca para encontrar assets específicos.
              </p>
            </div>
            <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
                placeholder="Buscar por nome, parceiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
            <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="restaurants">Restaurantes</SelectItem>
            <SelectItem value="events">Eventos</SelectItem>
            <SelectItem value="activities">Atividades</SelectItem>
            <SelectItem value="vehicles">Veículos</SelectItem>
            
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        </CardContent>
      </Card>

      {/* Tabela de Assets / Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Lista de Assets
            {filteredAssets.length > 0 && (
              <Badge variant="secondary">
                {filteredAssets.length} {filteredAssets.length === 1 ? "encontrado" : "encontrados"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusDisplay
            isLoading={isLoading}
            hasError={hasError}
            hasData={!!allAssets}
            filteredData={filteredAssets}
            searchTerm={searchTerm}
            selectedAssetType={selectedAssetType}
            onRetry={() => refetch()}
          />

          {!isLoading && !hasError && filteredAssets.length > 0 && (
            isMobile ? (
              <AssetsGrid
                assets={filteredAssets}
                handleNavigateToAsset={handleNavigateToAsset}
                              />
                            ) : (
              <AssetsTable
                assets={filteredAssets}
                handleNavigateToAsset={handleNavigateToAsset}
              />
            )
          )}
        </CardContent>
      </Card>

      {/* Quick Actions (já estava bom, mantive) */}
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
            <DialogTitle>Detalhes do Asset</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o asset selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedAsset && (
              <>
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  {selectedAsset.imageUrl ? (
                    <Image 
                      src={selectedAsset.imageUrl} 
                      alt={selectedAsset.name || selectedAsset.title || ''}
                      fill
                      style={{objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Database className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-500">Nome</p>
                    <p>{selectedAsset.name || selectedAsset.title}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-500">Tipo</p>
                    <p>{assetTypeLabels[selectedAsset.assetType] || "Desconhecido"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-500">ID do Asset</p>
                    <p className="text-xs">{selectedAsset._id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p>{selectedAsset.isActive ? "Ativo" : "Inativo"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-500">Parceiro</p>
                    <p>{selectedAsset.partnerName} ({selectedAsset.partnerEmail})</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-500">Criado em</p>
                    <p>{formatDate(selectedAsset._creationTime)}</p>
                  </div>
                  
                  {/* Detalhes específicos do asset */}
                  {selectedAsset.assetType === 'vehicles' && (
                    <>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Categoria</p><p>{selectedAsset.category}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Placa</p><p>{selectedAsset.licensePlate}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Preço/dia</p><p>{selectedAsset.pricePerDay ? formatPrice(selectedAsset.pricePerDay) : '-'}</p></div>
                    </>
                  )}
                  {selectedAsset.assetType === 'accommodations' && (
                    <>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Tipo</p><p>{selectedAsset.type}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Localização</p><p>{selectedAsset.location}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Preço/noite</p><p>{selectedAsset.pricePerNight ? formatPrice(selectedAsset.pricePerNight) : '-'}</p></div>
                    </>
                  )}
                  {selectedAsset.assetType === 'events' && (
                     <>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Data</p><p>{selectedAsset.date ? formatDate(new Date(selectedAsset.date).getTime()) : '-'}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Localização</p><p>{selectedAsset.location}</p></div>
                    </>
                  )}
                  {selectedAsset.assetType === 'activities' && (
                    <>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Categoria</p><p>{selectedAsset.category}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Duração</p><p>{selectedAsset.duration}</p></div>
                    </>
                  )}
                   {selectedAsset.assetType === 'restaurants' && (
                    <>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Cozinha</p><p>{Array.isArray(selectedAsset.cuisine) ? selectedAsset.cuisine.join(', ') : '-'}</p></div>
                      <div className="space-y-1"><p className="text-sm font-semibold text-gray-500">Endereço</p><p>{String(selectedAsset.address)}</p></div>
                    </>
                  )}

                  {selectedAsset.description && (
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-sm font-semibold text-gray-500">Descrição</p>
                      <p className="text-sm">{selectedAsset.description}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssetDetailsModalOpen(false)}>Fechar</Button>
            <Button onClick={() => selectedAsset && handleNavigateToAsset(selectedAsset)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visitar Página
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 