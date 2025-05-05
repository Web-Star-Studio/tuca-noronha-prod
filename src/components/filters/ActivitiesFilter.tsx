import { Dispatch, SetStateAction } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: TourFiltersProps) {
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
                <span className="font-medium text-base">Filtrar Atividades</span>
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
                        "transition-colors text-xs font-medium rounded-full"
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
                    onValueChange={(value) => {
                      setMinPrice(value[0]);
                      setMaxPrice(value[1]);
                    }}
                    className="my-6 w-full text-blue-600"
                  />
                  <div className="flex justify-between text-sm font-medium mt-2">
                    <span className="text-gray-700">R$ {minPrice !== null ? minPrice.toLocaleString("pt-BR") : '0'}</span>
                    <span className="text-gray-700">R$ {maxPrice !== null ? maxPrice.toLocaleString("pt-BR") : '0'}</span>
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
                        "transition-colors rounded-full w-full justify-start"
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
                    "transition-colors text-xs font-medium rounded-full"
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
              onValueChange={(value) => {
                setMinPrice(value[0]);
                setMaxPrice(value[1]);
              }}
              className="my-6"
            />
            <div className="flex justify-between text-sm font-medium mt-2">
              <span className="text-gray-700">R$ {minPrice !== null ? minPrice.toLocaleString("pt-BR") : '0'}</span>
              <span className="text-gray-700">R$ {maxPrice !== null ? maxPrice.toLocaleString("pt-BR") : '0'}</span>
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
                    "transition-colors rounded-full w-full justify-start"
                  )}
                >
                  {duration}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter actions */}
          <div className="space-y-3">
            <Button
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors py-2.5"
            >
              Aplicar Filtros
            </Button>
            <Button 
              onClick={resetFilters} 
              variant="outline" 
              className="w-full hover:bg-blue-50 hover:text-blue-600 border-gray-200 py-2.5"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
