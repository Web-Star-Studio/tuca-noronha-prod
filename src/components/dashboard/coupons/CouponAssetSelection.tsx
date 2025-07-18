"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { 
  Search, 
  Store, 
  Calendar, 
  Activity, 
  Car, 
  Bed, 
  Package,
  MapPin,
  DollarSign,
  Clock
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AssetSelection {
  assetType: string;
  assetId: string;
  isActive: boolean;
}

interface CouponAssetSelectionProps {
  selectedAssets: AssetSelection[];
  onAssetsChange: (assets: AssetSelection[]) => void;
  globalApplication: {
    isGlobal: boolean;
    assetTypes: string[];
  };
}

const ASSET_TYPE_CONFIG = {
  activities: { 
    label: "Atividades", 
    icon: Activity, 
    color: "text-blue-600",
    bgColor: "bg-blue-50" 
  },
  events: { 
    label: "Eventos", 
    icon: Calendar, 
    color: "text-purple-600",
    bgColor: "bg-purple-50" 
  },
  restaurants: { 
    label: "Restaurantes", 
    icon: Store, 
    color: "text-orange-600",
    bgColor: "bg-orange-50" 
  },
  vehicles: { 
    label: "Veículos", 
    icon: Car, 
    color: "text-green-600",
    bgColor: "bg-green-50" 
  },
  accommodations: { 
    label: "Hospedagens", 
    icon: Bed, 
    color: "text-indigo-600",
    bgColor: "bg-indigo-50" 
  },
  packages: { 
    label: "Pacotes", 
    icon: Package, 
    color: "text-pink-600",
    bgColor: "bg-pink-50" 
  },
};

export default function CouponAssetSelection({
  selectedAssets,
  onAssetsChange,
  globalApplication,
}: CouponAssetSelectionProps) {
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("activities");

  // Determinar partnerId baseado no role do usuário
  const partnerId = user?.role === "partner" ? user._id : 
                   user?.role === "employee" ? user.partnerId : 
                   undefined;

  // Buscar assets disponíveis
  const assets = useQuery(api.domains.coupons.queries.getPartnerAssets, {
    partnerId: partnerId as any,
    assetType: activeTab,
    searchTerm: searchTerm.length > 2 ? searchTerm : undefined,
    limit: 50,
  });

  const handleAssetToggle = (assetType: string, assetId: string, checked: boolean) => {
    const existing = selectedAssets.find(
      asset => asset.assetType === assetType && asset.assetId === assetId
    );

    if (existing) {
      // Atualizar existente
      onAssetsChange(
        selectedAssets.map(asset =>
          asset.assetType === assetType && asset.assetId === assetId
            ? { ...asset, isActive: checked }
            : asset
        )
      );
    } else if (checked) {
      // Adicionar novo
      onAssetsChange([
        ...selectedAssets,
        { assetType, assetId, isActive: true }
      ]);
    }
  };

  const handleRemoveAsset = (assetType: string, assetId: string) => {
    onAssetsChange(
      selectedAssets.filter(
        asset => !(asset.assetType === assetType && asset.assetId === assetId)
      )
    );
  };

  const isAssetSelected = (assetType: string, assetId: string) => {
    return selectedAssets.some(
      asset => asset.assetType === assetType && asset.assetId === assetId && asset.isActive
    );
  };

  const getSelectedCount = (assetType: string) => {
    return selectedAssets.filter(
      asset => asset.assetType === assetType && asset.isActive
    ).length;
  };

  // Filtrar assets selecionados por tipo
  const getSelectedAssetsByType = (type: string) => {
    return selectedAssets.filter(asset => asset.assetType === type && asset.isActive);
  };

  const formatPrice = (price?: number) => {
    if (!price) return "";
    return `R$ ${price.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleção de Serviços Específicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo dos assets selecionados */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => {
            const count = getSelectedCount(type);
            if (count === 0) return null;
            
            const Icon = config.icon;
            return (
              <Badge
                key={type}
                variant="secondary"
                className={`${config.bgColor} ${config.color} border-0`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {count} {config.label}
              </Badge>
            );
          })}
          {selectedAssets.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço específico selecionado
            </p>
          )}
        </div>

        {/* Tabs para diferentes tipos de assets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            {Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              const count = getSelectedCount(type);
              
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="relative"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{config.label}</span>
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Busca */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Buscar ${ASSET_TYPE_CONFIG[activeTab as keyof typeof ASSET_TYPE_CONFIG]?.label.toLowerCase() || 'items'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de assets */}
          {Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => {
            return (
              <TabsContent key={type} value={type} className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {assets === undefined ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Skeleton className="h-12 w-12 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-5 w-5" />
                        </div>
                      ))}
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum {config.label.toLowerCase()} encontrado</p>
                      {searchTerm && (
                        <p className="text-sm mt-2">
                          Tente buscar com outros termos
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((asset) => {
                        const isSelected = isAssetSelected(type, asset.id);
                        
                        return (
                          <div
                            key={asset.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isSelected 
                                ? `${config.bgColor} border-2 ${config.color.replace('text', 'border')}` 
                                : "bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            {/* Imagem do asset */}
                            {asset.image ? (
                              <img
                                src={asset.image}
                                alt={asset.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className={`h-12 w-12 rounded ${config.bgColor} flex items-center justify-center`}>
                                {React.createElement(config.icon, {
                                  className: `h-6 w-6 ${config.color}`
                                })}
                              </div>
                            )}

                            {/* Informações do asset */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{asset.name}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {asset.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {asset.location}
                                  </span>
                                )}
                                {(asset.price || asset.pricePerDay || asset.pricePerNight) && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatPrice(asset.price || asset.pricePerDay || asset.pricePerNight)}
                                    {asset.pricePerDay && "/dia"}
                                    {asset.pricePerNight && "/noite"}
                                  </span>
                                )}
                                {asset.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {asset.duration}h
                                  </span>
                                )}
                                {asset.cuisine && (
                                  <span>{asset.cuisine.join(", ")}</span>
                                )}
                              </div>
                            </div>

                            {/* Checkbox de seleção */}
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleAssetToggle(type, asset.id, checked as boolean)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
} 