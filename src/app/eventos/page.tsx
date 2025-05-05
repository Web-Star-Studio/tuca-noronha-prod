"use client";

import EventCard from "@/components/cards/EventCard";
import { Event } from "@/lib/store/eventsStore";
import EventFilter from "@/components/filters/EventFilter";
import { useEffect, useState } from "react";
import { useEventsStore } from "@/lib/store/eventsStore";
// Create a simple events store for demo since there's no full implementation yet

// Update the featuredEvents after initialization
useEventsStore.setState((state) => ({
  featuredEvents: state.events.filter((event) => event.featured),
  filteredEvents: state.events,
}));

export default function EventosPage() {
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { categories, events, filteredEvents, setFilteredEvents } =
    useEventsStore();
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

  const applyFilters = () => {
    const filtered = events.filter((event: Event) => {
      // Preço
      const priceRange =
        minPrice !== null && maxPrice !== null
          ? event.price >= minPrice && event.price <= maxPrice
          : true;

      // Categoria
      const categoryRange =
        selectedCategories.length === 0 ||
        selectedCategories.includes(event.category);

      // Data
      let dateRange = true;
      if (startDate && endDate) {
        const eventDate = new Date(event.date);
        const filterStartDate = new Date(startDate);
        const filterEndDate = new Date(endDate);
        dateRange = eventDate >= filterStartDate && eventDate <= filterEndDate;
      } else if (startDate) {
        const eventDate = new Date(event.date);
        const filterStartDate = new Date(startDate);
        dateRange = eventDate >= filterStartDate;
      } else if (endDate) {
        const eventDate = new Date(event.date);
        const filterEndDate = new Date(endDate);
        dateRange = eventDate <= filterEndDate;
      }

      return priceRange && categoryRange && dateRange;
    });

    setFilteredEvents(filtered);
  };

  const resetFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setStartDate("");
    setEndDate("");
    setSelectedCategories([]);
    setFilteredEvents(events);
  };

  // Inicialização dos filteredEvents quando o componente monta
  useEffect(() => {
    if (events.length > 0) {
      setFilteredEvents(events);
    }
  }, [events, setFilteredEvents]);

  return (
    <>
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1496843916299-590492c751f4?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Eventos em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Participe de eventos exclusivos e celebrações especiais na ilha
                paradisíaca.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
        <EventFilter
          categories={categories}
          selectedCategories={selectedCategories}
          toggleCategoryFilter={toggleCategoryFilter}
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />
        <div className="flex-1 md:w-2/3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents && filteredEvents.length > 0 ? (
              filteredEvents.map((event: Event) => (
                <div key={event.id} className="w-full h-full">
                  <EventCard event={event} />
                </div>
              ))
            ) : events && events.length > 0 ? (
              events.map((event: Event) => (
                <div key={event.id} className="w-full h-full">
                  <EventCard event={event} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-lg text-gray-500">
                  Nenhum evento encontrado
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
