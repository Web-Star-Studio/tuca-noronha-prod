"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

interface CouponFiltersProps {
  filters: {
    isActive?: boolean;
    type?: string;
    validOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export default function CouponFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: CouponFiltersProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.isActive !== undefined) count++;
    if (filters.type) count++;
    if (filters.validOnly) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filtros</CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} filtro(s) ativo(s)</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              disabled={activeFiltersCount === 0}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Ativo */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.isActive?.toString() || "all"}
              onValueChange={(value) => 
                handleFilterChange("isActive", value === "all" ? undefined : value === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="true">Apenas ativos</SelectItem>
                <SelectItem value="false">Apenas inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Cupom */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => 
                handleFilterChange("type", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="first_purchase">Primeira Compra</SelectItem>
                <SelectItem value="returning_customer">Cliente Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período de Validade */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="validOnly"
                checked={filters.validOnly}
                onCheckedChange={(checked) => handleFilterChange("validOnly", checked)}
              />
              <Label htmlFor="validOnly" className="text-sm">
                Apenas válidos agora
              </Label>
            </div>
          </div>

          {/* Espaço para expansão futura */}
          <div className="space-y-2">
            {/* Placeholder para filtros adicionais */}
          </div>
        </div>

        {/* Filtros Avançados (expansível) */}
        <div className="space-y-3 pt-3 border-t">
          <div className="text-sm font-medium text-muted-foreground">
            Filtros Avançados
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Desconto Percentual */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="percentage_discount"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por tipo de desconto
                }}
              />
              <Label htmlFor="percentage_discount" className="text-sm">
                Desconto %
              </Label>
            </div>

            {/* Desconto Fixo */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fixed_discount"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por tipo de desconto
                }}
              />
              <Label htmlFor="fixed_discount" className="text-sm">
                Desconto R$
              </Label>
            </div>

            {/* Cupons Empilháveis */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stackable"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por empilhável
                }}
              />
              <Label htmlFor="stackable" className="text-sm">
                Empilháveis
              </Label>
            </div>

            {/* Aplicação Automática */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_apply"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por aplicação automática
                }}
              />
              <Label htmlFor="auto_apply" className="text-sm">
                Auto-aplicação
              </Label>
            </div>

            {/* Público Visível */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="publicly_visible"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por visibilidade pública
                }}
              />
              <Label htmlFor="publicly_visible" className="text-sm">
                Visível publicamente
              </Label>
            </div>

            {/* Com Limite de Uso */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_usage_limit"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por limite de uso
                }}
              />
              <Label htmlFor="has_usage_limit" className="text-sm">
                Com limite de uso
              </Label>
            </div>

            {/* Próximos ao Vencimento */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="expiring_soon"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por expiração próxima
                }}
              />
              <Label htmlFor="expiring_soon" className="text-sm">
                Vencendo em breve
              </Label>
            </div>

            {/* Muito Utilizados */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="highly_used"
                checked={false} // Implementar lógica se necessário
                                  onCheckedChange={() => {
                  // Implementar filtro por uso alto
                }}
              />
              <Label htmlFor="highly_used" className="text-sm">
                Muito utilizados
              </Label>
            </div>
          </div>
        </div>

        {/* Resumo dos Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="pt-3 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Filtros Ativos:
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.isActive !== undefined && (
                <Badge variant="outline" className="gap-1">
                  Status: {filters.isActive ? "Ativo" : "Inativo"}
                  <button
                    onClick={() => handleFilterChange("isActive", undefined)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.type && (
                <Badge variant="outline" className="gap-1">
                  Tipo: {filters.type === "public" ? "Público" : 
                        filters.type === "private" ? "Privado" :
                        filters.type === "first_purchase" ? "Primeira Compra" :
                        "Cliente Recorrente"}
                  <button
                    onClick={() => handleFilterChange("type", undefined)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.validOnly && (
                <Badge variant="outline" className="gap-1">
                  Apenas válidos
                  <button
                    onClick={() => handleFilterChange("validOnly", false)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}