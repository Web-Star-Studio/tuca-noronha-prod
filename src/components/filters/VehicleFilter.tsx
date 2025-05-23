import { useState, KeyboardEvent } from "react";
import { Check, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface VehicleFilterProps {
  categories: string[];
  selectedCategories: string[];
  toggleCategoryFilter: (category: string) => void;
  
  brands: string[];
  selectedBrands: string[];
  toggleBrandFilter: (brand: string) => void;
  
  transmissions: string[];
  selectedTransmissions: string[];
  toggleTransmissionFilter: (transmission: string) => void;
  
  applyFilters: () => void;
  resetFilters: () => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (isOpen: boolean) => void;
}

export default function VehicleFilter({
  categories,
  selectedCategories,
  toggleCategoryFilter,
  brands,
  selectedBrands,
  toggleBrandFilter,
  transmissions,
  selectedTransmissions,
  toggleTransmissionFilter,
  applyFilters,
  resetFilters,
  isFilterOpen,
  setIsFilterOpen,
}: VehicleFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState(true);
  const [expandedTransmissions, setExpandedTransmissions] = useState(true);

  const totalFiltersApplied =
    selectedCategories.length + selectedBrands.length + selectedTransmissions.length;
    
  // Handle keyboard events
  const handleKeyDown = (
    callback: () => void
  ) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  return (
    <>
      {/* Mobile filter button */}
      <div className="md:hidden w-full mb-4">
        <Button
          variant="outline"
          className="w-full flex justify-between"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {totalFiltersApplied > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {totalFiltersApplied}
              </span>
            )}
          </span>
          {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filter sidebar */}
      <div
        className={cn(
          "md:w-1/4 md:min-w-[250px] md:max-w-[300px] bg-white p-4 rounded-lg border border-gray-200 transition-all",
          isFilterOpen ? "block" : "hidden md:block"
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Filtros</h2>
          {totalFiltersApplied > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-sm text-blue-600">
              Limpar todos
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Categories filter */}
          <div>
            <div
              className="flex justify-between items-center cursor-pointer mb-2"
              onClick={() => setExpandedCategories(!expandedCategories)}
              onKeyDown={handleKeyDown(() => setExpandedCategories(!expandedCategories))}
              tabIndex={0}
              role="button"
              aria-expanded={expandedCategories}
            >
              <h3 className="font-medium">Categoria</h3>
              {expandedCategories ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedCategories && (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                    onClick={() => toggleCategoryFilter(category)}
                    onKeyDown={handleKeyDown(() => toggleCategoryFilter(category))}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={selectedCategories.includes(category)}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center",
                        selectedCategories.includes(category)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedCategories.includes(category) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Brands filter */}
          <div>
            <div
              className="flex justify-between items-center cursor-pointer mb-2"
              onClick={() => setExpandedBrands(!expandedBrands)}
              onKeyDown={handleKeyDown(() => setExpandedBrands(!expandedBrands))}
              tabIndex={0}
              role="button"
              aria-expanded={expandedBrands}
            >
              <h3 className="font-medium">Marca</h3>
              {expandedBrands ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedBrands && (
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                    onClick={() => toggleBrandFilter(brand)}
                    onKeyDown={handleKeyDown(() => toggleBrandFilter(brand))}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={selectedBrands.includes(brand)}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center",
                        selectedBrands.includes(brand)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedBrands.includes(brand) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{brand}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Transmissions filter */}
          <div>
            <div
              className="flex justify-between items-center cursor-pointer mb-2"
              onClick={() => setExpandedTransmissions(!expandedTransmissions)}
              onKeyDown={handleKeyDown(() => setExpandedTransmissions(!expandedTransmissions))}
              tabIndex={0}
              role="button"
              aria-expanded={expandedTransmissions}
            >
              <h3 className="font-medium">Transmissão</h3>
              {expandedTransmissions ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedTransmissions && (
              <div className="space-y-2">
                {transmissions.map((transmission) => (
                  <div
                    key={transmission}
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                    onClick={() => toggleTransmissionFilter(transmission)}
                    onKeyDown={handleKeyDown(() => toggleTransmissionFilter(transmission))}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={selectedTransmissions.includes(transmission)}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center",
                        selectedTransmissions.includes(transmission)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedTransmissions.includes(transmission) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{transmission}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={applyFilters}>
            Aplicar filtros
          </Button>
          <Button
            variant="outline"
            className="w-full md:hidden"
            onClick={() => setIsFilterOpen(false)}
          >
            Fechar
          </Button>
        </div>
      </div>
    </>
  );
} 