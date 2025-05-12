"use client";

import ActivitiesCard from "@/components/cards/ActivitiesCard";
import ActivitiesFilter from "@/components/filters/ActivitiesFilter";
import type { Activity } from "@/lib/store/activitiesStore";
import { useState, useMemo } from "react";
import { usePublicActivitiesQuery } from "@/lib/hooks/useActivityQueries";

export default function AtividadesPage() {
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [durationFilter, setDurationFilter] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Get activities using TanStack Query
  const { data: activities = [], isLoading } = usePublicActivitiesQuery();
  
  // Calculate categories only when activities change - memoized
  const categories = useMemo(() => {
    if (activities.length === 0) return [];
    return [...new Set(activities.map(activity => activity.category))];
  }, [activities]);

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
        return [...prev, category];
    });
  };

  const toggleDurationFilter = (duration: string) => {
    setDurationFilter((prev) => {
      if (prev.includes(duration)) {
        return prev.filter((d) => d !== duration);
      }
        return [...prev, duration];
    });
  };

  // Função auxiliar para converter duração em minutos
  const getDurationInMinutes = (duration: string): number => {
    // Extrair números da string de duração
    const match = duration.match(/(\d+)(?:\s*-\s*(\d+))?/);
    if (!match) return 0;

    // Se tiver formato "X-Y horas", pega o valor médio
    if (match[2]) {
      return ((Number.parseInt(match[1]) + Number.parseInt(match[2])) / 2) * 60;
    }

    // Se tiver formato "X horas" ou "X hora"
    if (duration.includes("hora")) {
      return Number.parseInt(match[1]) * 60;
    }

    // Se tiver formato "X minutos" ou "X minuto"
    if (duration.includes("minuto")) {
      return Number.parseInt(match[1]);
    }

    return Number.parseInt(match[1]) * 60; // Assume horas como padrão
  };

  // Filter activities - memoized to prevent unnecessary calculations
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const filteredActivities = useMemo(() => {
    if (isLoading || activities.length === 0) return [];
    
    return activities.filter((activity: Activity) => {
      // Filtragem por preço
      const priceRange =
        minPrice !== null && maxPrice !== null
          ? activity.price >= minPrice && activity.price <= maxPrice
          : true;

      // Filtragem por categoria
      const categoryRange =
        selectedCategories.length === 0 ||
        selectedCategories.includes(activity.category);

      // Filtragem por duração - lógica melhorada
      let durationRange = true;
      if (durationFilter.length > 0) {
        const activityDurationInMinutes = getDurationInMinutes(
          activity.duration
        );

        durationRange = durationFilter.some((filterOption) => {
          if (filterOption === "1-2 horas") {
            return (
              activityDurationInMinutes >= 60 &&
              activityDurationInMinutes <= 120
            );
          }if (filterOption === "2-4 horas") {
            return (
              activityDurationInMinutes > 120 &&
              activityDurationInMinutes <= 240
            );
          }if (filterOption === "4+ horas") {
            return activityDurationInMinutes > 240;
          }
          return false;
        });
      }

      return priceRange && categoryRange && durationRange;
    });
  }, [activities, minPrice, maxPrice, selectedCategories, durationFilter, isLoading]);

  const resetFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setDurationFilter([]);
    setSelectedCategories([]);
    setIsFilterOpen(false); // Fechar o filtro após aplicar
  };

  // Handler for applying filters - now just closes the filter UI
  const applyFilters = () => {
    setIsFilterOpen(false);
  };

  // No need for the useEffect to set initial filtered activities anymore
  // as we're now using useMemo for filteredActivities

  return (
    <>
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1559357711-e442ab604fdc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZlcm5hbmRvJTIwZGUlMjBub3JvbmhhfGVufDB8fDB8fHww')",
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Atividades em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Descubra experiências incríveis na ilha com nossas atividades
                guiadas por especialistas locais.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
        <ActivitiesFilter
          categories={categories}
          selectedCategories={selectedCategories}
          toggleCategoryFilter={toggleCategoryFilter}
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          durationFilter={durationFilter}
          toggleDurationFilter={toggleDurationFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />
        <div className="flex-1 md:w-2/3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredActivities && filteredActivities.length > 0 ? (
              filteredActivities.map((activity: Activity) => (
                <div key={activity.id} className="w-full h-full">
                  <ActivitiesCard activity={activity} />
                </div>
              ))
            ) : activities && activities.length > 0 ? (
              activities.map((activity: Activity) => (
                <div key={activity.id} className="w-full h-full">
                  <ActivitiesCard activity={activity} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-lg text-gray-500">
                  Nenhuma atividade encontrada
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
