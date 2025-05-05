"use client";

import ActivitiesCard from "@/components/cards/ActivitiesCard";
import activitiesStore from "@/lib/store/activitiesStore";
import ActivitiesFilter from "@/components/filters/ActivitiesFilter";
import { Activity } from "@/lib/store/activitiesStore";
import { useEffect, useState } from "react";

export default function AtividadesPage() {
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [durationFilter, setDurationFilter] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { categories, activities, filteredActivities, setFilteredActivities } =
    activitiesStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const toggleDurationFilter = (duration: string) => {
    setDurationFilter((prev) => {
      if (prev.includes(duration)) {
        return prev.filter((d) => d !== duration);
      } else {
        return [...prev, duration];
      }
    });
  };

  // Função auxiliar para converter duração em minutos
  const getDurationInMinutes = (duration: string): number => {
    // Extrair números da string de duração
    const match = duration.match(/(\d+)(?:\s*-\s*(\d+))?/);
    if (!match) return 0;
    
    // Se tiver formato "X-Y horas", pega o valor médio
    if (match[2]) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2 * 60;
    }
    
    // Se tiver formato "X horas" ou "X hora"
    if (duration.includes("hora")) {
      return parseInt(match[1]) * 60;
    }
    
    // Se tiver formato "X minutos" ou "X minuto"
    if (duration.includes("minuto")) {
      return parseInt(match[1]);
    }
    
    return parseInt(match[1]) * 60; // Assume horas como padrão
  };

  const applyFilters = () => {
    const filtered = activities.filter((activity: Activity) => {
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
        const activityDurationInMinutes = getDurationInMinutes(activity.duration);
        
        durationRange = durationFilter.some(filterOption => {
          if (filterOption === "1-2 horas") {
            return activityDurationInMinutes >= 60 && activityDurationInMinutes <= 120;
          } else if (filterOption === "2-4 horas") {
            return activityDurationInMinutes > 120 && activityDurationInMinutes <= 240;
          } else if (filterOption === "4+ horas") {
            return activityDurationInMinutes > 240;
          }
          return false;
        });
      }
      
      return priceRange && categoryRange && durationRange;
    });
    
    setFilteredActivities(filtered);
  };

  const resetFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setDurationFilter([]);
    setSelectedCategories([]);
    setFilteredActivities(activities);
  };

  // Inicialização dos filteredActivities quando o componente monta
  useEffect(() => {
    if (activities.length > 0) {
      setFilteredActivities(activities);
    }
  }, [activities, setFilteredActivities]);

  return (
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
  );
}
