"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw } from "lucide-react";

interface ReviewFilters {
  itemType?: string;
  isApproved?: boolean;
  rating?: { min?: number; max?: number };
  dateRange?: { start?: number; end?: number };
  searchTerm?: string;
  partnerId?: string;
}

interface ReviewsFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
}

export function ReviewsFilters({ filters, onFiltersChange }: ReviewsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ReviewFilters>(filters);
  const [dateRange, setDateRange] = useState<{start?: Date; end?: Date}>({
    start: filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
    end: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined,
  });
  const [ratingRange, setRatingRange] = useState<number[]>([
    filters.rating?.min || 1,
    filters.rating?.max || 5
  ]);

  const handleFilterChange = (key: keyof ReviewFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleDateRangeChange = (type: 'start' | 'end', date: Date | undefined) => {
    const newDateRange = { ...dateRange, [type]: date };
    setDateRange(newDateRange);
    
    const dateRangeFilter = {
      start: newDateRange.start?.getTime(),
      end: newDateRange.end?.getTime(),
    };
    
    handleFilterChange('dateRange', dateRangeFilter);
  };

  const handleRatingRangeChange = (values: number[]) => {
    setRatingRange(values);
    handleFilterChange('rating', { min: values[0], max: values[1] });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setDateRange({ start: undefined, end: undefined });
    setRatingRange([1, 5]);
    onFiltersChange(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.itemType) count++;
    if (filters.isApproved !== undefined) count++;
    if (filters.rating?.min !== 1 || filters.rating?.max !== 5) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.searchTerm) count++;
    if (filters.partnerId) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-6">
      {/* Filtros Rápidos */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={filters.isApproved === true ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange('isApproved', filters.isApproved === true ? undefined : true)}
        >
          Aprovadas
        </Badge>
        <Badge 
          variant={filters.isApproved === false ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange('isApproved', filters.isApproved === false ? undefined : false)}
        >
          Pendentes
        </Badge>
        <Badge 
          variant={filters.itemType === "restaurant" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange('itemType', filters.itemType === "restaurant" ? undefined : "restaurant")}
        >
          Restaurantes
        </Badge>
        <Badge 
          variant={filters.itemType === "accommodation" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange('itemType', filters.itemType === "accommodation" ? undefined : "accommodation")}
        >
          Hospedagens
        </Badge>
        <Badge 
          variant={filters.itemType === "activity" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleFilterChange('itemType', filters.itemType === "activity" ? undefined : "activity")}
        >
          Atividades
        </Badge>
      </div>

      {/* Filtros Detalhados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tipo de Asset */}
        <div className="space-y-2">
          <Label>Tipo de Asset</Label>
          <Select
            value={localFilters.itemType || ""}
            onValueChange={(value) => handleFilterChange('itemType', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              <SelectItem value="restaurant">Restaurantes</SelectItem>
              <SelectItem value="accommodation">Hospedagens</SelectItem>
              <SelectItem value="activity">Atividades</SelectItem>
              <SelectItem value="event">Eventos</SelectItem>
              <SelectItem value="vehicle">Veículos</SelectItem>
              <SelectItem value="package">Pacotes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status de Aprovação */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={localFilters.isApproved === undefined ? "" : localFilters.isApproved.toString()}
            onValueChange={(value) => {
              const newValue = value === "" ? undefined : value === "true";
              handleFilterChange('isApproved', newValue);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="true">Aprovadas</SelectItem>
              <SelectItem value="false">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data de Início */}
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <DatePicker
            date={dateRange.start}
            onDateChange={(date) => handleDateRangeChange('start', date)}
            placeholder="Selecionar data"
          />
        </div>

        {/* Data de Fim */}
        <div className="space-y-2">
          <Label>Data Final</Label>
          <DatePicker
            date={dateRange.end}
            onDateChange={(date) => handleDateRangeChange('end', date)}
            placeholder="Selecionar data"
          />
        </div>
      </div>

      {/* Filtro de Rating */}
      <div className="space-y-3">
        <Label>Faixa de Rating</Label>
        <div className="px-3">
          <Slider
            value={ratingRange}
            onValueChange={handleRatingRangeChange}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{ratingRange[0]} estrelas</span>
            <span>{ratingRange[1]} estrelas</span>
          </div>
        </div>
      </div>

      {/* Busca por Partner */}
      <div className="space-y-2">
        <Label>ID do Partner (opcional)</Label>
        <Input
          placeholder="Digite o ID do partner..."
          value={localFilters.partnerId || ""}
          onChange={(e) => handleFilterChange('partnerId', e.target.value || undefined)}
        />
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {activeFiltersCount > 0 && (
            <>
              <Badge variant="secondary">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={activeFiltersCount === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={applyFilters}>
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
} 