"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Search, X, Plus, Building, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CouponAssetAssignmentProps {
  couponId: string;
  currentAssets: Array<{
    assetType: string;
    assetId: string;
    isActive: boolean;
  }>;
  onUpdate: () => void;
}

export default function CouponAssetAssignment({
  couponId,
  currentAssets,
  onUpdate,
}: CouponAssetAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [selectedAssets, setSelectedAssets] = useState<Array<{
    id: string;
    name: string;
    type: string;
    image?: string;
    price?: number;
    location?: string;
  }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Queries
  const availableAssets = useQuery(
    api.domains.coupons.queries.getPartnerAssets,
    {
      assetType: selectedAssetType !== "all" ? selectedAssetType : undefined,
      searchTerm: searchTerm.length > 2 ? searchTerm : undefined,
      limit: 20,
    }
  );

  // Mutations
  const updateAssets = useMutation(api.domains.coupons.mutations.updateCouponAssets);

  const assetTypes = [
    { value: "all", label: "Todos os tipos" },
    { value: "activities", label: "Atividades" },
    { value: "events", label: "Eventos" },
    { value: "restaurants", label: "Restaurantes" },
    { value: "vehicles", label: "Veículos" },
    { value: "accommodations", label: "Acomodações" },
    { value: "packages", label: "Pacotes" },
  ];

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case "activities": return "🎯";
      case "events": return "🎉";
      case "restaurants": return "🍽️";
      case "vehicles": return "🚗";
      case "accommodations": return "🏨";
      case "packages": return "📦";
      default: return "📍";
    }
  };

  const getAssetTypeLabel = (type: string) => {
    const typeMap = {
      activities: "Atividade",
      events: "Evento",
      restaurants: "Restaurante",
      vehicles: "Veículo",
      accommodations: "Acomodação",
      packages: "Pacote",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const handleUpdateAssets = async () => {
    if (selectedAssets.length === 0) return;

    try {
      const assetsToUpdate = [
        ...currentAssets,
        ...selectedAssets.map(asset => ({
          assetType: asset.type as any,
          assetId: asset.id,
          isActive: true,
        }))
      ];

      await updateAssets({
        couponId: couponId as any,
        applicableAssets: assetsToUpdate,
      });
      
      setSelectedAssets([]);
      setSearchTerm("");
      setShowSearchResults(false);
      onUpdate();
      
      toast({
        title: "Assets atualizados",
        description: `${selectedAssets.length} asset(s) adicionado(s) ao cupom com sucesso.`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os assets do cupom.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAsset = async (assetType: string, assetId: string) => {
    try {
      const updatedAssets = currentAssets.filter(
        asset => !(asset.assetType === assetType && asset.assetId === assetId)
      );

      await updateAssets({
        couponId: couponId as any,
        applicableAssets: updatedAssets,
      });
      
      onUpdate();
      
      toast({
        title: "Asset removido",
        description: "Asset removido do cupom com sucesso.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover o asset do cupom.",
        variant: "destructive",
      });
    }
  };

  const handleAssetSelect = (asset: any) => {
    setSelectedAssets(prev => {
      const exists = prev.find(a => a.id === asset.id && a.type === asset.type);
      if (exists) {
        return prev.filter(a => !(a.id === asset.id && a.type === asset.type));
      } else {
        return [...prev, asset];
      }
    });
  };

  const isAssetSelected = (assetId: string, assetType: string) => {
    return selectedAssets.some(a => a.id === assetId && a.type === assetType);
  };

  const isAssetAlreadyAdded = (assetId: string, assetType: string) => {
    return currentAssets.some(a => a.assetId === assetId && a.assetType === assetType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Atribuição de Assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assets Atualmente Atribuídos */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Assets Atribuídos ({currentAssets.length})
          </Label>
          
          {currentAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum asset específico atribuído</p>
              <p className="text-sm">Este cupom pode ser aplicado globalmente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentAssets.map((asset, index) => (
                <div
                  key={`${asset.assetType}-${asset.assetId}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getAssetTypeIcon(asset.assetType)}</span>
                      <div>
                        <p className="font-medium">
                          {getAssetTypeLabel(asset.assetType)} #{asset.assetId.slice(-6)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {asset.isActive ? "Ativo" : "Inativo"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAsset(asset.assetType, asset.assetId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Buscar e Atribuir Novos Assets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Adicionar Novos Assets</Label>
          
          {/* Filtro por tipo */}
          <div className="space-y-2">
            <Label className="text-xs">Filtrar por tipo</Label>
            <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar assets por nome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(e.target.value.length > 2);
              }}
              className="pl-10"
            />
          </div>

          {/* Assets Selecionados */}
          {selectedAssets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Assets Selecionados ({selectedAssets.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <Badge key={`${asset.type}-${asset.id}`} variant="secondary" className="gap-1">
                    <span className="text-xs">{getAssetTypeIcon(asset.type)}</span>
                    {asset.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssetSelect(asset)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Button
                onClick={handleUpdateAssets}
                className="w-full"
                disabled={selectedAssets.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar {selectedAssets.length} Asset(s)
              </Button>
            </div>
          )}

          {/* Resultados da Busca */}
          {showSearchResults && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resultados da Busca</Label>
              
              {availableAssets === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : availableAssets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum asset encontrado</p>
                  {searchTerm.length <= 2 && (
                    <p className="text-sm">Digite pelo menos 3 caracteres para buscar</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableAssets.map((asset) => {
                    const alreadyAdded = isAssetAlreadyAdded(asset.id, asset.type);
                    const selected = isAssetSelected(asset.id, asset.type);
                    
                    return (
                      <div
                        key={`${asset.type}-${asset.id}`}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          alreadyAdded
                            ? "bg-gray-100 opacity-50 cursor-not-allowed"
                            : selected
                            ? "bg-primary/10 border-primary/20 border"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                        onClick={() => !alreadyAdded && handleAssetSelect(asset)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getAssetTypeIcon(asset.type)}</span>
                          {asset.image && (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={asset.image} />
                              <AvatarFallback>
                                {asset.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{asset.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getAssetTypeLabel(asset.type)}
                            </Badge>
                            {asset.price && (
                              <span>R$ {asset.price.toFixed(2)}</span>
                            )}
                            {asset.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {asset.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {alreadyAdded ? (
                          <Badge variant="secondary" className="text-xs">
                            Já adicionado
                          </Badge>
                        ) : selected ? (
                          <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                            <Plus className="h-3 w-3 text-primary-foreground rotate-45" />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}