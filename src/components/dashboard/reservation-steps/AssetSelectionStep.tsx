"use client";

import React, { useState, useEffect } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, MapPin, Calendar, Users, Car, Hotel, UtensilsCrossed, Building, Wind } from "lucide-react";
import { AdminReservationData } from "../AdminReservationCreationForm";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AssetSelectionStepProps {
  data: Partial<AdminReservationData>;
  onComplete: (data: Partial<AdminReservationData>) => void;
}

const ASSET_TYPES = [
  { value: "accommodations", label: "Hospedagens", icon: Hotel },
  { value: "activities", label: "Passeios", icon: Wind },
  { value: "vehicles", label: "Veículos", icon: Car },
  { value: "restaurants", label: "Restaurantes", icon: UtensilsCrossed },
  { value: "events", label: "Eventos", icon: Calendar },
] as const;

type AssetType = typeof ASSET_TYPES[number]['value'];

function AssetCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded-md bg-muted" />
        <div className="h-3 w-1/2 rounded-md bg-muted" />
      </div>
      <div className="flex items-center space-x-4">
        <div className="h-4 w-1/4 rounded-md bg-muted" />
        <div className="h-4 w-1/4 rounded-md bg-muted" />
      </div>
    </div>
  );
}

export function AssetSelectionStep({ data, onComplete }: AssetSelectionStepProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | undefined>(data.assetType);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(
    data.assetId ? { _id: data.assetId, title: data.assetTitle } : null
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    results: assets,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.domains.adminReservations.queries.listAssetsForAdminReservation,
    selectedAssetType ? { 
      assetType: selectedAssetType,
      searchTerm: debouncedSearchTerm,
    } : undefined,
    { initialNumItems: 10 }
  );
  
  const handleContinue = () => {
    if (selectedAsset && selectedAssetType) {
      onComplete({
        assetId: selectedAsset._id,
        assetType: selectedAssetType,
        assetTitle: selectedAsset.title || selectedAsset.name,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Selection */}
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold">Tipo de Serviço</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Escolha a categoria do serviço que deseja reservar.
          </p>
          <RadioGroup
            value={selectedAssetType}
            onValueChange={(value) => {
              setSelectedAssetType(value as AssetType);
              setSelectedAsset(null); // Reset selection when type changes
            }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {ASSET_TYPES.map((type) => (
              <Label
                key={type.value}
                htmlFor={type.value}
                className={cn(
                  "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  selectedAssetType === type.value && "border-primary ring-2 ring-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                <type.icon className="w-8 h-8 mb-2" />
                <span className="text-center font-medium">{type.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {selectedAssetType && (
          <div>
            <Label htmlFor="search" className="text-base font-semibold">
              Buscar {ASSET_TYPES.find((t) => t.value === selectedAssetType)?.label}
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Filtre por nome ou palavra-chave.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Ex: Passeio de barco, Pousada do Sol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Results */}
      <div className="h-full flex flex-col">
        {selectedAssetType ? (
          <Card className="h-full flex flex-col flex-grow">
            <CardHeader>
              <CardTitle>Resultados da Busca</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione um dos itens abaixo para continuar.
              </p>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-4">
                  {status === 'loading' && Array.from({ length: 5 }).map((_, i) => <AssetCardSkeleton key={i} />)}
                  
                  {status !== 'loading' && assets.length === 0 && (
                    <div className="text-center py-10">
                      <p className="font-semibold">Nenhum resultado encontrado.</p>
                      <p className="text-sm text-muted-foreground">Tente um termo de busca diferente.</p>
                    </div>
                  )}

                  {assets.map((asset) => (
                    <Card
                      key={asset._id}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedAsset?._id === asset._id && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="p-4">
                        <p className="font-bold text-lg">{asset.title || asset.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{asset.shortDescription || asset.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                           {asset.price && <Badge variant="secondary">R$ {asset.price.toFixed(2)}</Badge>}
                           {asset.location && <Badge variant="outline" className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {asset.location}</Badge>}
                           {asset.capacity && <Badge variant="outline" className="flex items-center gap-1"><Users className="w-3 h-3"/> {asset.capacity}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {status === 'canLoadMore' && (
                    <Button onClick={() => loadMore(5)} className="w-full mt-4">
                      Carregar Mais
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full border rounded-lg bg-muted/20">
             <div className="text-center text-muted-foreground">
                <Building className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">Selecione um tipo de serviço</h3>
                <p className="mt-1 text-sm">
                   Para começar, escolha uma categoria de serviço para ver os itens disponíveis.
                </p>
             </div>
          </div>
        )}
        
        {selectedAsset && (
            <div className="mt-4 p-4 border rounded-lg bg-background shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Selecionado:</p>
                        <p className="text-primary font-bold text-lg">{selectedAsset.title || selectedAsset.name}</p>
                    </div>
                    <Button onClick={handleContinue} size="lg">
                        Continuar
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}