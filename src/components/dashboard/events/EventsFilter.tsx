"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";

type EventsFilterProps = {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
  showMobileFilter: boolean;
  setShowMobileFilter: Dispatch<SetStateAction<boolean>>;
};

export function EventsFilter({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  showMobileFilter,
  setShowMobileFilter
}: EventsFilterProps) {
  return (
    <>
      {/* Desktop filter */}
      <div className="hidden md:flex items-center gap-4 w-full">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm"
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="featured">Destaques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile filter button */}
      <div className="md:hidden w-full">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="shrink-0 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <AnimatePresence>
          {showMobileFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-2"
            >
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                        <SelectItem value="featured">Destaques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}