import { Dispatch, SetStateAction } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";
import { Filter, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestaurantFiltersProps {
  cuisines: string[];
  selectedCuisines: string[];
  toggleCuisineFilter: (cuisine: string) => void;
  priceRanges: string[];
  selectedPriceRanges: string[];
  togglePriceFilter: (price: string) => void;
  neighborhoods: string[];
  selectedNeighborhoods: string[];
  toggleNeighborhoodFilter: (neighborhood: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  minPrice?: number | null;
  maxPrice?: number | null;
  setMinPrice?: Dispatch<SetStateAction<number | null>>;
  setMaxPrice?: Dispatch<SetStateAction<number | null>>;
  totalResults?: number;
  isLoading?: boolean;
}

// Mapeamento de preços para valores numéricos
const priceRangeValues = {
  "$": { min: 0, max: 50 },
  "$$": { min: 50, max: 100 },
  "$$$": { min: 100, max: 200 },
  "$$$$": { min: 200, max: 400 }
};

export default function RestaurantFilter({
  cuisines,
  selectedCuisines,
  toggleCuisineFilter,
  priceRanges,

  neighborhoods,
  selectedNeighborhoods,
  toggleNeighborhoodFilter,

  resetFilters,
  isFilterOpen,
  setIsFilterOpen,
  minPrice = 0,
  maxPrice = 400,
  setMinPrice,
  setMaxPrice,
  totalResults = 0,
  isLoading = false,
}: RestaurantFiltersProps) {
  
  // Calcular se há filtros ativos
  const hasActiveFilters = 
    selectedCuisines.length > 0 || 
    selectedNeighborhoods.length > 0 || 
    (minPrice !== null && minPrice > 0) || 
    (maxPrice !== null && maxPrice < 400);

  const handleSliderChange = (value: number[]) => {
    if (setMinPrice) setMinPrice(value[0]);
    if (setMaxPrice) setMaxPrice(value[1]);
  };

  // Função para converter valor do slider para símbolo de preço
  const getPriceSymbol = (value: number): string => {
    if (value < 50) return "$";
    if (value < 100) return "$$";
    if (value < 200) return "$$$";
    return "$$$$";
  };

  return (
    <aside className="w-full md:w-1/5">
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
              className="w-full flex justify-between items-center rounded-lg py-6 border-gray-200 hover:border-blue-300 transition-all duration-200"
            >
              <span className="flex items-center">
                <Filter className="mr-2.5 h-5 w-5 text-blue-600" />
                <span className="font-medium text-base">Filtrar Restaurantes</span>
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {selectedCuisines.length + selectedNeighborhoods.length + ((minPrice !== null && minPrice > 0) || (maxPrice !== null && maxPrice < 400) ? 1 : 0)}
                  </span>
                )}
              </span>
              {isFilterOpen ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 p-6 border rounded-xl shadow-sm bg-white animate-in slide-in-from-top-1 duration-200">
            {/* Results counter */}
            {!isLoading && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  {totalResults} {totalResults === 1 ? 'restaurante encontrado' : 'restaurantes encontrados'}
                </p>
              </div>
            )}

            {/* Filter content for mobile */}
            <div className="space-y-8">
              {/* Cuisines filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Tipo de Culinária</h3>
                <div className="flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => (
                    <Button
                      key={cuisine}
                      variant={
                        selectedCuisines.includes(cuisine)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleCuisineFilter(cuisine)}
                      className={cn(
                        selectedCuisines.includes(cuisine)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-all duration-200 text-xs font-medium rounded-full"
                      )}
                    >
                      {cuisine}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price range filter with slider */}
              {setMinPrice && setMaxPrice && (
                <div>
                  <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
                  <div className="mb-4">
                    <Slider
                      defaultValue={[0, 400]}
                      value={[minPrice ?? 0, maxPrice ?? 400]}
                      max={400}
                      step={25}
                      onValueChange={handleSliderChange}
                      className="my-6 w-full"
                    />
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Mínimo</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {getPriceSymbol(minPrice ?? 0)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (R$ {minPrice ?? 0})
                          </span>
                        </div>
                      </div>
                      <div className="h-px flex-1 bg-gray-200 mx-3" />
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-500">Máximo</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {getPriceSymbol(maxPrice ?? 400)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (R$ {maxPrice ?? 400})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Neighborhoods filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Região</h3>
                <div className="flex flex-col gap-2">
                  {neighborhoods.map((neighborhood) => (
                    <Button
                      key={neighborhood}
                      variant={
                        selectedNeighborhoods.includes(neighborhood)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleNeighborhoodFilter(neighborhood)}
                      className={cn(
                        selectedNeighborhoods.includes(neighborhood)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-all duration-200 rounded-lg w-full justify-start"
                      )}
                    >
                      {neighborhood}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="flex-1 hover:bg-blue-50 hover:text-blue-600 border-gray-200 transition-all duration-200"
                  disabled={!hasActiveFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop sidebar filter */}
      <div className="hidden md:block w-full">
        <div className="sticky top-24 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-gray-900">Filtros</h2>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                Limpar tudo
              </button>
            )}
          </div>

          {/* Results counter */}
          {!isLoading && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                {totalResults} {totalResults === 1 ? 'restaurante' : 'restaurantes'}
              </p>
            </div>
          )}

          {/* Cuisines filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Tipo de Culinária</h3>
            <div className="flex flex-wrap gap-2">
              {cuisines.map((cuisine) => (
                <Button
                  key={cuisine}
                  variant={
                    selectedCuisines.includes(cuisine)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => toggleCuisineFilter(cuisine)}
                  className={cn(
                    selectedCuisines.includes(cuisine)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-all duration-200 text-xs font-medium rounded-full"
                  )}
                >
                  {cuisine}
                </Button>
              ))}
            </div>
          </div>

          {/* Price range filter with slider */}
          {setMinPrice && setMaxPrice && (
            <div className="mb-8">
              <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
              <Slider
                defaultValue={[0, 400]}
                value={[minPrice ?? 0, maxPrice ?? 400]}
                max={400}
                step={25}
                onValueChange={handleSliderChange}
                className="my-6"
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Mínimo</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {getPriceSymbol(minPrice ?? 0)}
                    </span>
                    <span className="text-xs text-gray-500">
                      (R$ {minPrice ?? 0})
                    </span>
                  </div>
                </div>
                <div className="h-px flex-1 bg-gray-200 mx-3" />
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-500">Máximo</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {getPriceSymbol(maxPrice ?? 400)}
                    </span>
                    <span className="text-xs text-gray-500">
                      (R$ {maxPrice ?? 400})
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick price range buttons */}
              <div className="flex gap-2 mt-4">
                {priceRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      const values = priceRangeValues[range as keyof typeof priceRangeValues];
                      if (values) {
                        setMinPrice(values.min);
                        setMaxPrice(values.max);
                      }
                    }}
                    className="flex-1 py-1.5 px-2 text-xs border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Neighborhoods filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Região</h3>
            <div className="flex flex-col gap-2">
              {neighborhoods.map((neighborhood) => (
                <Button
                  key={neighborhood}
                  variant={
                    selectedNeighborhoods.includes(neighborhood)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => toggleNeighborhoodFilter(neighborhood)}
                  className={cn(
                    selectedNeighborhoods.includes(neighborhood)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-all duration-200 rounded-lg w-full justify-start"
                  )}
                >
                  {neighborhood}
                </Button>
              ))}
            </div>
          </div>

          {/* Info section */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                Os filtros são aplicados automaticamente ao serem selecionados
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
