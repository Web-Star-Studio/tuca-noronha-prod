import { Dispatch, SetStateAction } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "../ui/button";
import { Filter, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface HostingFiltersProps {
  types: string[];
  selectedTypes: string[];
  toggleTypeFilter: (type: string) => void;
  amenities: string[];
  selectedAmenities: string[];
  toggleAmenityFilter: (amenity: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  maxPrice: number;
  guestCount: number;
  setGuestCount: (count: number) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

export default function HostingFilter({
  types,
  selectedTypes,
  toggleTypeFilter,
  amenities,
  selectedAmenities,
  toggleAmenityFilter,
  priceRange,
  setPriceRange,
  maxPrice,
  guestCount,
  setGuestCount,
  applyFilters,
  resetFilters,
  isFilterOpen,
  setIsFilterOpen,
}: HostingFiltersProps) {
  // Formatação do preço para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <aside className="w-full md:w-1/4">
      {/* Mobile filter button */}
      <div className="md:hidden w-full mb-6">
        <Collapsible
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex justify-between items-center rounded-lg py-6 border-gray-200"
            >
              <span className="flex items-center">
                <Filter className="mr-2.5 h-5 w-5 text-blue-600" />
                <span className="font-medium text-base">Filtrar Hospedagens</span>
              </span>
              {isFilterOpen ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 p-6 border rounded-xl shadow-sm bg-white">
            {/* Filter content for mobile */}
            <div className="space-y-8">
              {/* Types filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Tipo de Hospedagem</h3>
                <div className="flex flex-wrap gap-2">
                  {types.map((type) => (
                    <Button
                      key={type}
                      variant={
                        selectedTypes.includes(type)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleTypeFilter(type)}
                      className={cn(
                        selectedTypes.includes(type)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-colors text-xs font-medium rounded-full"
                      )}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price range filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
                <div className="space-y-6">
                  <div className="pt-2">
                    <Slider 
                      defaultValue={priceRange} 
                      min={0}
                      max={maxPrice}
                      step={50}
                      onValueChange={(values) => setPriceRange(values as [number, number])}
                      className="mt-6"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg text-blue-700">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{formatCurrency(priceRange[0])}</span>
                    </div>
                    <span className="text-gray-500">até</span>
                    <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg text-blue-700">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{formatCurrency(priceRange[1])}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest count filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Hóspedes</h3>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="h-10 w-10 rounded-l-lg"
                    disabled={guestCount <= 1}
                  >
                    -
                  </Button>
                  <div className="h-10 px-4 flex items-center justify-center border-y border-input">
                    {guestCount} {guestCount === 1 ? 'hóspede' : 'hóspedes'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuestCount(guestCount + 1)}
                    className="h-10 w-10 rounded-r-lg"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Amenities filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Comodidades</h3>
                <div className="grid grid-cols-1 gap-2">
                  {amenities.slice(0, 10).map((amenity) => (
                    <Button
                      key={amenity}
                      variant={
                        selectedAmenities.includes(amenity)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleAmenityFilter(amenity)}
                      className={cn(
                        selectedAmenities.includes(amenity)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-colors rounded-lg w-full justify-start"
                      )}
                    >
                      {amenity}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={applyFilters}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Aplicar
                </Button>
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="flex-1 hover:bg-blue-50 hover:text-blue-600 border-gray-200"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop sidebar filter */}
      <div className="hidden md:block w-full">
        <div className="sticky top-24 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-bold mb-6 text-gray-900">Filtros</h2>

          {/* Types filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Tipo de Hospedagem</h3>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <Button
                  key={type}
                  variant={
                    selectedTypes.includes(type)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => toggleTypeFilter(type)}
                  className={cn(
                    selectedTypes.includes(type)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-colors text-xs font-medium rounded-full"
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Price range filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
            <div className="space-y-6">
              <div className="pt-2">
                <Slider 
                  defaultValue={priceRange} 
                  min={0}
                  max={maxPrice}
                  step={50}
                  onValueChange={(values) => setPriceRange(values as [number, number])}
                  className="mt-6"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg text-blue-700">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{formatCurrency(priceRange[0])}</span>
                </div>
                <span className="text-gray-500">até</span>
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg text-blue-700">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{formatCurrency(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest count filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Hóspedes</h3>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="h-10 w-10 rounded-l-lg"
                disabled={guestCount <= 1}
              >
                -
              </Button>
              <div className="h-10 px-4 flex items-center justify-center border-y border-input">
                {guestCount} {guestCount === 1 ? 'hóspede' : 'hóspedes'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuestCount(guestCount + 1)}
                className="h-10 w-10 rounded-r-lg"
              >
                +
              </Button>
            </div>
          </div>

          {/* Amenities filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Comodidades</h3>
            <div className="grid grid-cols-1 gap-2">
              {amenities.slice(0, 10).map((amenity) => (
                <Button
                  key={amenity}
                  variant={
                    selectedAmenities.includes(amenity)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => toggleAmenityFilter(amenity)}
                  className={cn(
                    selectedAmenities.includes(amenity)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-colors rounded-lg w-full justify-start"
                  )}
                >
                  {amenity}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Aplicar Filtros
            </Button>
            <Button
              onClick={resetFilters}
              variant="outline"
              className="w-full hover:bg-blue-50 hover:text-blue-600 border-gray-200"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
