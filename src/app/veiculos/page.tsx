"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import VehicleCard from "@/components/cards/VehicleCard";
import VehicleFilter from "@/components/filters/VehicleFilter";

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
  hasMore: boolean;
  cursor?: string;
}

export default function VeiculosPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Fetch vehicles data from Convex
  const vehiclesData = useQuery(api.vehicles.queries.listVehicles, {
    paginationOpts: { limit: 50, cursor: null },
    status: "available" // Only show available vehicles
  }) as VehiclesResponse | undefined;

  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  
  // Extract all available categories, brands, and transmissions (without duplicates)
  const categories: string[] = vehiclesData ? 
    Array.from(new Set(vehiclesData.vehicles
      .map((vehicle: Vehicle) => vehicle.category)
      .filter((category): category is string => typeof category === 'string')
    )).sort() : [];
  
  const brands: string[] = vehiclesData ? 
    Array.from(new Set(vehiclesData.vehicles
      .map((vehicle: Vehicle) => vehicle.brand)
      .filter((brand): brand is string => typeof brand === 'string')
    )).sort() : [];
  
  const transmissions: string[] = vehiclesData ? 
    Array.from(new Set(vehiclesData.vehicles
      .map((vehicle: Vehicle) => vehicle.transmission)
      .filter((transmission): transmission is string => typeof transmission === 'string')
    )).sort() : [];

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands((prev) => {
      if (prev.includes(brand)) {
        return prev.filter((b) => b !== brand);
      }
      return [...prev, brand];
    });
  };

  const toggleTransmissionFilter = (transmission: string) => {
    setSelectedTransmissions((prev) => {
      if (prev.includes(transmission)) {
        return prev.filter((t) => t !== transmission);
      }
      return [...prev, transmission];
    });
  };

  const applyFilters = () => {
    if (!vehiclesData) return;
    
    const filtered = vehiclesData.vehicles.filter((vehicle: Vehicle) => {
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

    setFilteredVehicles(filtered);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedTransmissions([]);
    setFilteredVehicles(vehiclesData?.vehicles || []);
  };

  // Initialize filteredVehicles when data is loaded
  useEffect(() => {
    if (vehiclesData?.vehicles && vehiclesData.vehicles.length > 0) {
      setFilteredVehicles(vehiclesData.vehicles);
    }
  }, [vehiclesData]);

  return (
    <>
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

      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
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

        <div className="flex-1 md:w-2/3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVehicles && filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <div key={vehicle._id} className="w-full h-full">
                  <VehicleCard vehicle={vehicle} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                {vehiclesData?.vehicles === undefined ? (
                  <p className="text-lg text-gray-500">Carregando veículos...</p>
                ) : (
                  <p className="text-lg text-gray-500">
                    Nenhum veículo encontrado
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
} 