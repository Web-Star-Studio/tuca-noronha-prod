"use client";

import { useState } from "react";
import { useAsset } from "@/lib/providers/asset-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Calendar,
  Activity,
  Car,
  Building2,
  MapPin,
  Star,
  Users,
  ChevronRight,
} from "lucide-react";
import { ui } from "@/lib/ui-config";

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

interface AssetSelectorProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function AssetSelector({ showDetails = true, compact = false }: AssetSelectorProps) {
  const { selectedAsset, setSelectedAsset, availableAssets, isLoading } = useAsset();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (availableAssets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum asset encontrado</h3>
          <p className="text-gray-600">
            Esta organização não possui assets cadastrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Select 
        value={selectedAsset?._id || ""} 
        onValueChange={(value) => {
          const asset = availableAssets.find(a => a._id === value);
          if (asset) setSelectedAsset(asset);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um asset" />
        </SelectTrigger>
        <SelectContent>
          {availableAssets.map((asset) => {
            const Icon = assetTypeIcons[asset.assetType] || Building2;
            return (
              <SelectItem key={asset._id} value={asset._id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{asset.name}</span>
                  <Badge 
                    className={`ml-2 ${assetTypeColors[asset.assetType]}`}
                    variant="secondary"
                  >
                    {assetTypeLabels[asset.assetType]}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Selected Asset */}
      {selectedAsset && showDetails && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = assetTypeIcons[selectedAsset.assetType] || Building2;
                  return <Icon className="h-5 w-5 text-blue-600" />;
                })()}
                <span className="text-blue-900">Asset Selecionado</span>
              </CardTitle>
              <Badge 
                className={assetTypeColors[selectedAsset.assetType]}
                variant="secondary"
              >
                {assetTypeLabels[selectedAsset.assetType]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-blue-900">
                {selectedAsset.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-blue-700">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${selectedAsset.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{selectedAsset.isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Filtrar por Asset (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedAsset?._id || "all"} 
            onValueChange={(value) => {
              if (value === "all") {
                setSelectedAsset(null);
              } else {
                const asset = availableAssets.find(a => a._id === value);
                if (asset) setSelectedAsset(asset);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as reservas (clique para filtrar por asset específico)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-4 w-4 bg-blue-100 rounded flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Todas as Reservas</span>
                    <span className="text-xs text-gray-500">
                      Ver reservas de todos os assets
                    </span>
                  </div>
                </div>
              </SelectItem>
              {availableAssets.map((asset) => {
                const Icon = assetTypeIcons[asset.assetType] || Building2;
                return (
                  <SelectItem key={asset._id} value={asset._id}>
                    <div className="flex items-center gap-3 py-2">
                      <Icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{asset.name}</span>
                        <span className="text-xs text-gray-500">
                          {assetTypeLabels[asset.assetType]}
                        </span>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-2 h-2 rounded-full ${asset.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
} 