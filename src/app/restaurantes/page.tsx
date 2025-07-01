"use client";

import RestaurantCard from "@/components/cards/RestaurantCard";
import { useRestaurants, type Restaurant } from "@/lib/services/restaurantService";
import RestaurantFilter from "@/components/filters/RestaurantFilter";
import { useEffect, useState, useMemo } from "react";

export default function RestaurantesPage() {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(
    []
  );
  const [minPrice, setMinPrice] = useState<number | null>(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(400);
  const { restaurants, isLoading } = useRestaurants();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extrair todas as culinárias disponíveis (sem duplicatas)
  const cuisines = useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    return Array.from(
      new Set((restaurants || []).flatMap((restaurant) => restaurant.cuisine))
    ).sort();
  }, [restaurants]);

  // Extrair todas as faixas de preço disponíveis
  const priceRanges = ["$", "$$", "$$$", "$$$$"];

  // Extrair todos os bairros disponíveis (sem duplicatas)
  const neighborhoods = useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    return Array.from(
      new Set((restaurants || []).map((restaurant) => restaurant.address.neighborhood))
    ).sort();
  }, [restaurants]);

  const toggleCuisineFilter = (cuisine: string) => {
    setSelectedCuisines((prev) => {
      if (prev.includes(cuisine)) {
        return prev.filter((c) => c !== cuisine);
      } else {
        return [...prev, cuisine];
      }
    });
  };

  const togglePriceFilter = (price: string) => {
    setSelectedPriceRanges((prev) => {
      if (prev.includes(price)) {
        return prev.filter((p) => p !== price);
      } else {
        return [...prev, price];
      }
    });
  };

  const toggleNeighborhoodFilter = (neighborhood: string) => {
    setSelectedNeighborhoods((prev) => {
      if (prev.includes(neighborhood)) {
        return prev.filter((n) => n !== neighborhood);
      } else {
        return [...prev, neighborhood];
      }
    });
  };

  // Converter símbolo de preço para valor numérico aproximado
  const getPriceValue = (priceRange: string): number => {
    switch (priceRange) {
      case "$": return 25;
      case "$$": return 75;
      case "$$$": return 150;
      case "$$$$": return 300;
      default: return 0;
    }
  };

  // Filtrar restaurantes automaticamente quando qualquer filtro mudar
  const filteredRestaurants = useMemo(() => {
    if (!restaurants || isLoading) return [];
    
    return restaurants.filter((restaurant: Restaurant) => {
      // Filtragem por culinária
      const cuisineMatch =
        selectedCuisines.length === 0 ||
        restaurant.cuisine.some((cuisine) =>
          selectedCuisines.includes(cuisine)
        );

      // Filtragem por faixa de preço usando o slider
      const priceValue = getPriceValue(restaurant.priceRange);
      const priceMatch =
        minPrice !== null && maxPrice !== null
          ? priceValue >= minPrice && priceValue <= maxPrice
          : true;

      // Filtragem por bairro
      const neighborhoodMatch =
        selectedNeighborhoods.length === 0 ||
        selectedNeighborhoods.includes(restaurant.address.neighborhood);

      return cuisineMatch && priceMatch && neighborhoodMatch;
    });
  }, [restaurants, selectedCuisines, minPrice, maxPrice, selectedNeighborhoods, isLoading]);

  const resetFilters = () => {
    setSelectedCuisines([]);
    setSelectedPriceRanges([]);
    setSelectedNeighborhoods([]);
    setMinPrice(0);
    setMaxPrice(400);
    setIsFilterOpen(false);
  };

  // Fechar filtros no mobile após aplicar
  useEffect(() => {
    if (isFilterOpen && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        setIsFilterOpen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedCuisines, selectedNeighborhoods, minPrice, maxPrice]);

  return (
    <>
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1515669097368-22e68427d265?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Restaurantes em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Descubra os sabores da ilha com nossa seleção de restaurantes
                exclusivos e gastronomia local.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
        <RestaurantFilter
          cuisines={cuisines}
          selectedCuisines={selectedCuisines}
          toggleCuisineFilter={toggleCuisineFilter}
          priceRanges={priceRanges}
          selectedPriceRanges={selectedPriceRanges}
          togglePriceFilter={togglePriceFilter}
          neighborhoods={neighborhoods}
          selectedNeighborhoods={selectedNeighborhoods}
          toggleNeighborhoodFilter={toggleNeighborhoodFilter}
          applyFilters={() => {}} // Mantém por compatibilidade mas não é mais usado
          resetFilters={resetFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          totalResults={filteredRestaurants.length}
          isLoading={isLoading}
        />
        <div className="flex-1 md:w-2/3">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRestaurants && filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant: Restaurant) => (
                  <div key={restaurant.id} className="w-full h-full">
                    <RestaurantCard restaurant={restaurant} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-lg text-gray-500">
                    Nenhum restaurante encontrado com os filtros selecionados
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
