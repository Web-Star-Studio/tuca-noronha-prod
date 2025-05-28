"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Header from "@/components/header/Header";
import VehicleFilter from "@/components/filters/VehicleFilter";
import VehiclesGrid from "@/components/cards/VehiclesGrid";
import VehiclesSorting from "@/components/cards/VehiclesSorting";
import VehiclesPagination from "@/components/cards/VehiclesPagination";

// Define a type for vehicle data
interface Vehicle {
  _id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  color: string;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  imageUrl?: string;
  status: string;
}

// Define interface for Convex response
interface VehiclesResponse {
  vehicles: Vehicle[];
  continueCursor: string | null;
}

export default function VeiculosPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Estados para ordenação e paginação
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'year-asc' | 'year-desc'>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 9;
  
  // Fetch vehicles data from Convex
  const vehiclesData = useQuery(api.domains.vehicles.queries.listVehicles, {
    paginationOpts: { limit: 100 }, // Fetch more to enable client-side filtering
    status: "available" // Only show available vehicles
  }) as VehiclesResponse | undefined;

  const vehicles = vehiclesData?.vehicles || [];
  const isLoading = vehiclesData === undefined;
  
  // Extract all available categories, brands, and transmissions (without duplicates)
  const categories: string[] = useMemo(() => {
    return Array.from(new Set(vehicles
      .map((vehicle: Vehicle) => vehicle.category)
      .filter((category): category is string => typeof category === 'string')
    )).sort();
  }, [vehicles]);
  
  const brands: string[] = useMemo(() => {
    return Array.from(new Set(vehicles
      .map((vehicle: Vehicle) => vehicle.brand)
      .filter((brand): brand is string => typeof brand === 'string')
    )).sort();
  }, [vehicles]);
  
  const transmissions: string[] = useMemo(() => {
    return Array.from(new Set(vehicles
      .map((vehicle: Vehicle) => vehicle.transmission)
      .filter((transmission): transmission is string => typeof transmission === 'string')
    )).sort();
  }, [vehicles]);

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands((prev) => {
      if (prev.includes(brand)) {
        return prev.filter((b) => b !== brand);
      }
      return [...prev, brand];
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const toggleTransmissionFilter = (transmission: string) => {
    setSelectedTransmissions((prev) => {
      if (prev.includes(transmission)) {
        return prev.filter((t) => t !== transmission);
      }
      return [...prev, transmission];
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Filtrar e ordenar veículos
  const filteredAndSortedVehicles = useMemo(() => {
    // Primeiro filtrar
    const filtered = vehicles.filter((vehicle: Vehicle) => {
      // Filtering by category
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(vehicle.category);

      // Filtering by brand
      const brandMatch =
        selectedBrands.length === 0 ||
        selectedBrands.includes(vehicle.brand);

      // Filtering by transmission
      const transmissionMatch =
        selectedTransmissions.length === 0 ||
        selectedTransmissions.includes(vehicle.transmission);

      return categoryMatch && brandMatch && transmissionMatch;
    });

    // Depois ordenar
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
      }
      if (sortBy === 'name-desc') {
        return `${b.brand} ${b.model}`.localeCompare(`${a.brand} ${a.model}`);
      }
      if (sortBy === 'price-asc') {
        return a.pricePerDay - b.pricePerDay;
      }
      if (sortBy === 'price-desc') {
        return b.pricePerDay - a.pricePerDay;
      }
      if (sortBy === 'year-asc') {
        return a.year - b.year;
      }
      if (sortBy === 'year-desc') {
        return b.year - a.year;
      }
      return 0;
    });
  }, [vehicles, selectedCategories, selectedBrands, selectedTransmissions, sortBy]);

  // Calcular páginas
  const totalPages = Math.ceil(filteredAndSortedVehicles.length / vehiclesPerPage);
  
  // Obter veículos da página atual
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * vehiclesPerPage;
    return filteredAndSortedVehicles.slice(startIndex, startIndex + vehiclesPerPage);
  }, [filteredAndSortedVehicles, currentPage]);

  const applyFilters = () => {
    // Filters are applied automatically through useMemo
    setIsFilterOpen(false); // Close mobile filter on apply
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedTransmissions([]);
    setCurrentPage(1); // Reset to first page
  };

  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave para o topo da lista
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      
      {/* Hero Banner */}
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1498887983185-44bfeb64b956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Veículos em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Descubra a liberdade de explorar a ilha com nossa frota de veículos confortáveis e confiáveis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
        {/* Sidebar filters */}
        <VehicleFilter
          categories={categories}
          selectedCategories={selectedCategories}
          toggleCategoryFilter={toggleCategoryFilter}
          brands={brands}
          selectedBrands={selectedBrands}
          toggleBrandFilter={toggleBrandFilter}
          transmissions={transmissions}
          selectedTransmissions={selectedTransmissions}
          toggleTransmissionFilter={toggleTransmissionFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />

        {/* Main content area */}
        <div className="flex-1 md:w-2/3">
          {/* Sorting component */}
          <div className="hidden md:block">
            <VehiclesSorting 
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalVehicles={filteredAndSortedVehicles.length}
            />
          </div>
          
          {/* Grid de veículos com paginação */}
          <VehiclesGrid 
            vehicles={paginatedVehicles} 
            isLoading={isLoading} 
            resetFilters={resetFilters} 
          />
          
          {/* Paginação */}
          {filteredAndSortedVehicles.length > 0 && (
            <VehiclesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </section>
    </>
  );
} 