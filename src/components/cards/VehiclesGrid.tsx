import VehicleCard from "@/components/cards/VehicleCard";
import { Button } from "@/components/ui/button";
import { Loader2, Car } from "lucide-react";

interface Vehicle {
  _id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  color: string;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  imageUrl?: string;
  status: string;
}

interface VehiclesGridProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  resetFilters: () => void;
}

export default function VehiclesGrid({ vehicles, isLoading, resetFilters }: VehiclesGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 text-lg">Carregando veículos...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Car className="h-20 w-20 text-gray-300 mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhum veículo encontrado
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          Não encontramos veículos que correspondam aos seus critérios de busca. 
          Tente ajustar os filtros ou limpar todas as seleções.
        </p>
        <Button 
          onClick={resetFilters}
          variant="outline"
          className="flex items-center gap-2"
        >
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
      {vehicles.map((vehicle) => (
        <div key={vehicle._id} className="w-full sm:w-full max-w-[80%] sm:max-w-none h-full">
          <VehicleCard vehicle={vehicle} />
        </div>
      ))}
    </div>
  );
} 