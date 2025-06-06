import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccommodationsFilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  showMobileFilter: boolean;
  setShowMobileFilter: (value: boolean) => void;
}

export function AccommodationsFilter({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  showMobileFilter,
  setShowMobileFilter,
}: AccommodationsFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearch = () => {
    setSearchQuery(localSearch);
  };

  const clearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  return (
    <div className="w-full">
      {/* Desktop filters */}
      <div className="hidden md:flex justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Buscar acomodações..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-10"
          />
          {localSearch ? (
            <button
              onClick={clearSearch}
              className="absolute right-10 top-0 h-full flex items-center px-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
            <SelectItem value="featured">Destacadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile filter toggle */}
      <div className="flex md:hidden justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setShowMobileFilter(!showMobileFilter)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </Button>
        <div className="relative">
          <Input
            placeholder="Buscar..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-[150px] h-9 pr-8"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-8"
            onClick={handleSearch}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Mobile filters expanded */}
      <AnimatePresence>
        {showMobileFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden"
          >
            <div className="pt-4 space-y-4">
              <div className="relative">
                <Input
                  placeholder="Buscar acomodações..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pr-10"
                />
                {localSearch ? (
                  <button
                    onClick={clearSearch}
                    className="absolute right-10 top-0 h-full flex items-center px-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="featured">Destacadas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearSearch();
                    setFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleSearch();
                    setShowMobileFilter(false);
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 