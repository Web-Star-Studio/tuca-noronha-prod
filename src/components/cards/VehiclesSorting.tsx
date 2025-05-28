import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VehiclesSortingProps {
  sortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'year-asc' | 'year-desc';
  onSortChange: (value: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'year-asc' | 'year-desc') => void;
  totalVehicles: number;
}

export default function VehiclesSorting({ sortBy, onSortChange, totalVehicles }: VehiclesSortingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="text-sm text-gray-600">
        {totalVehicles === 0 ? (
          "Nenhum veículo encontrado"
        ) : totalVehicles === 1 ? (
          "1 veículo encontrado"
        ) : (
          `${totalVehicles} veículos encontrados`
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 whitespace-nowrap">Ordenar por:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="price-asc">Menor Preço</SelectItem>
            <SelectItem value="price-desc">Maior Preço</SelectItem>
            <SelectItem value="year-asc">Mais Antigo</SelectItem>
            <SelectItem value="year-desc">Mais Novo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 