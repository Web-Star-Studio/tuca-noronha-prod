import { Dispatch, SetStateAction } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "../ui/button";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
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
}

export default function RestaurantFilter({
  cuisines,
  selectedCuisines,
  toggleCuisineFilter,
  priceRanges,
  selectedPriceRanges,
  togglePriceFilter,
  neighborhoods,
  selectedNeighborhoods,
  toggleNeighborhoodFilter,
  applyFilters,
  resetFilters,
  isFilterOpen,
  setIsFilterOpen,
}: RestaurantFiltersProps) {
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
              className="w-full flex justify-between items-center rounded-lg py-6 border-gray-200"
            >
              <span className="flex items-center">
                <Filter className="mr-2.5 h-5 w-5 text-blue-600" />
                <span className="font-medium text-base">Filtrar Restaurantes</span>
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
                        "transition-colors text-xs font-medium rounded-full"
                      )}
                    >
                      {cuisine}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price range filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((price) => (
                    <Button
                      key={price}
                      variant={
                        selectedPriceRanges.includes(price)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => togglePriceFilter(price)}
                      className={cn(
                        selectedPriceRanges.includes(price)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-colors text-sm font-medium rounded-full"
                      )}
                    >
                      {price}
                    </Button>
                  ))}
                </div>
              </div>

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
                        "transition-colors rounded-lg w-full justify-start"
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
                    "transition-colors text-xs font-medium rounded-full"
                  )}
                >
                  {cuisine}
                </Button>
              ))}
            </div>
          </div>

          {/* Price range filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((price) => (
                <Button
                  key={price}
                  variant={
                    selectedPriceRanges.includes(price)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => togglePriceFilter(price)}
                  className={cn(
                    selectedPriceRanges.includes(price)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-colors text-sm font-medium rounded-full"
                  )}
                >
                  {price}
                </Button>
              ))}
            </div>
          </div>

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
                    "transition-colors rounded-lg w-full justify-start"
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
      </div>
    </aside>
  );
}
