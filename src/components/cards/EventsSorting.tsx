"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, CalendarDays, ArrowDown, ArrowUp, DollarSign } from "lucide-react";

interface EventsSortingProps {
  sortBy: 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';
  onSortChange: (sort: 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc') => void;
  totalEvents: number;
}

export default function EventsSorting({
  sortBy,
  onSortChange,
  totalEvents
}: EventsSortingProps) {
  return (
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      <p className="text-gray-600 flex items-center">
        <span className="font-medium text-gray-900">{totalEvents}</span>
        <span className="ml-1.5">{totalEvents === 1 ? "evento encontrado" : "eventos encontrados"}</span>
      </p>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-200 text-gray-700 flex items-center gap-1.5"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <span>
              {sortBy === 'date-asc' && "Data (mais recente)"}
              {sortBy === 'date-desc' && "Data (mais antiga)"}
              {sortBy === 'price-asc' && "Preço (menor)"}
              {sortBy === 'price-desc' && "Preço (maior)"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="bg-white shadow-lg border-gray-100">
          <DropdownMenuItem 
            onClick={() => onSortChange('date-asc')}
            className="flex items-center cursor-pointer hover:bg-blue-50 hover:text-blue-600"
          >
            <CalendarDays className="h-4 w-4 mr-2" /> 
            <ArrowDown className="h-3.5 w-3.5 mr-2 text-gray-500" />
            Data (mais recente)
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onSortChange('date-desc')}
            className="flex items-center cursor-pointer hover:bg-blue-50 hover:text-blue-600"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            <ArrowUp className="h-3.5 w-3.5 mr-2 text-gray-500" />
            Data (mais antiga)
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onSortChange('price-asc')}
            className="flex items-center cursor-pointer hover:bg-blue-50 hover:text-blue-600"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            <ArrowDown className="h-3.5 w-3.5 mr-2 text-gray-500" />
            Preço (menor)
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onSortChange('price-desc')}
            className="flex items-center cursor-pointer hover:bg-blue-50 hover:text-blue-600"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            <ArrowUp className="h-3.5 w-3.5 mr-2 text-gray-500" />
            Preço (maior)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}