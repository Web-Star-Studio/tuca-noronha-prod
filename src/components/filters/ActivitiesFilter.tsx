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
import { ui } from "@/lib/ui-config";

interface TourFiltersProps {
  categories: string[];
  selectedCategories: string[];
  toggleCategoryFilter: (category: string) => void;
  minPrice: number | null;
  maxPrice: number | null;
  setMinPrice: Dispatch<SetStateAction<number | null>>;
  setMaxPrice: Dispatch<SetStateAction<number | null>>;
  durationFilter: string[];
  toggleDurationFilter: (duration: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  totalResults?: number;
  isLoading?: boolean;
}

const durations = ["1-2 horas", "2-4 horas", "4+ horas"];

export default function ActivitiesFilter({
  categories,
  selectedCategories,
  toggleCategoryFilter,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  durationFilter,
  toggleDurationFilter,
  applyFilters,
  resetFilters,
  isFilterOpen,
  setIsFilterOpen,
  totalResults = 0,
  isLoading = false,
}: TourFiltersProps) {
  // Calcular se há filtros ativos
  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    durationFilter.length > 0 || 
    (minPrice !== null && minPrice > 0) || 
    (maxPrice !== null && maxPrice < 700);

  const handleSliderChange = (value: number[]) => {
    setMinPrice(value[0]);
    setMaxPrice(value[1]);
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
                <span className="font-medium text-base">Filtrar Atividades</span>
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {selectedCategories.length + durationFilter.length + (minPrice !== null || maxPrice !== null ? 1 : 0)}
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
                  {totalResults} {totalResults === 1 ? 'atividade encontrada' : 'atividades encontradas'}
                </p>
              </div>
            )}

            {/* Filter content for mobile */}
            <div className="space-y-8">
              {/* Categories filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Categorias</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategories.includes(category)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleCategoryFilter(category)}
                      className={cn(
                        selectedCategories.includes(category)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-all duration-200 text-xs font-medium rounded-full"
                      )}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price range filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
                <div className="mb-4">
                  <Slider
                    defaultValue={[0, 700]}
                    value={[minPrice ?? 0, maxPrice ?? 700]}
                    max={700}
                    step={50}
                    onValueChange={handleSliderChange}
                    className="my-6 w-full"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Mínimo</span>
                      <span className="text-sm font-semibold text-gray-900">
                        R$ {minPrice !== null ? minPrice.toLocaleString("pt-BR") : '0'}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gray-200 mx-3" />
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-gray-500">Máximo</span>
                      <span className="text-sm font-semibold text-gray-900">
                        R$ {maxPrice !== null ? maxPrice.toLocaleString("pt-BR") : '700'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Duração</h3>
                <div className="flex flex-col gap-2">
                  {durations.map((duration) => (
                    <Button
                      key={duration}
                      variant={
                        durationFilter.includes(duration)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleDurationFilter(duration)}
                      className={cn(
                        durationFilter.includes(duration)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                        "transition-all duration-200 rounded-full w-full justify-start"
                      )}
                    >
                      {duration}
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
                {totalResults} {totalResults === 1 ? 'atividade' : 'atividades'}
              </p>
            </div>
          )}

          {/* Categories filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategories.includes(category)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => toggleCategoryFilter(category)}
                  className={cn(
                    selectedCategories.includes(category)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-all duration-200 text-xs font-medium rounded-full"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Price range filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Faixa de Preço</h3>
            <Slider
              defaultValue={[0, 700]}
              value={[minPrice ?? 0, maxPrice ?? 700]}
              max={700}
              step={50}
              onValueChange={handleSliderChange}
              className="my-6"
            />
            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Mínimo</span>
                <span className="text-sm font-semibold text-gray-900">
                  R$ {minPrice !== null ? minPrice.toLocaleString("pt-BR") : '0'}
                </span>
              </div>
              <div className="h-px flex-1 bg-gray-200 mx-3" />
              <div className="flex flex-col text-right">
                <span className="text-xs text-gray-500">Máximo</span>
                <span className="text-sm font-semibold text-gray-900">
                  R$ {maxPrice !== null ? maxPrice.toLocaleString("pt-BR") : '700'}
                </span>
              </div>
            </div>
          </div>

          {/* Duration filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Duração</h3>
            <div className="flex flex-col gap-2">
              {durations.map((duration) => (
                <Button
                  key={duration}
                  variant={
                    durationFilter.includes(duration) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleDurationFilter(duration)}
                  className={cn(
                    durationFilter.includes(duration)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50 hover:text-blue-600 border-gray-200",
                    "transition-all duration-200 rounded-full w-full justify-start"
                  )}
                >
                  {duration}
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
