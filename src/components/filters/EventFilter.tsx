import { Dispatch, SetStateAction, ChangeEvent } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Filter, ChevronDown, ChevronUp, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventFiltersProps {
  categories: string[];
  selectedCategories: string[];
  toggleCategoryFilter: (category: string) => void;
  minPrice: number | null;
  maxPrice: number | null;
  setMinPrice: Dispatch<SetStateAction<number | null>>;
  setMaxPrice: Dispatch<SetStateAction<number | null>>;
  startDate: string;
  endDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;
  resetFilters: () => void;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

export default function EventFilter({
  categories,
  selectedCategories,
  toggleCategoryFilter,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  resetFilters,
  isFilterOpen,
  setIsFilterOpen,
}: EventFiltersProps) {
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
                <span className="font-medium text-base">Filtrar Eventos</span>
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

              {/* Date range filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-gray-800">Período</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">De</label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                        className="w-full border-gray-200 pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">Até</label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                        className="w-full border-gray-200 pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Aplicar filtros
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

          {/* Date range filter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Período</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">De</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                    className="w-full border-gray-200 pr-10"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Até</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                    className="w-full border-gray-200 pr-10"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Aplicar filtros
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