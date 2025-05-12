"use client";

import EventFilter from "@/components/filters/EventFilter";
import EventsGrid from "@/components/cards/EventsGrid";
import EventsSorting from "@/components/cards/EventsSorting";
import EventsPagination from "@/components/cards/EventsPagination";
import { useState, useMemo } from "react";
import { usePublicEventsQuery } from "@/lib/services/eventService";

export default function EventosPage() {
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Usar o hook de consulta do TanStack para buscar eventos ativos
  const { data: events = [], isLoading } = usePublicEventsQuery();
  
  // Extrair categorias únicas dos eventos
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    for (const event of events) {
      if (event.category) {
        uniqueCategories.add(event.category);
      }
    }
    return Array.from(uniqueCategories);
  }, [events]);

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  // Estados para ordenação e paginação
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'price-asc' | 'price-desc'>('date-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 9;
  
  // Filtrar eventos com base nos critérios selecionados
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    // Primeiro filtrar
    const filtered = events.filter((event) => {
      // Filtro por preço
      const priceRange =
        minPrice !== null && maxPrice !== null
          ? event.price >= minPrice && event.price <= maxPrice
          : true;

      // Filtro por categoria
      const categoryRange =
        selectedCategories.length === 0 ||
        selectedCategories.includes(event.category);

      // Filtro por data
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
    
    // Depois ordenar
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }if (sortBy === 'price-asc') {
        return a.price - b.price;
      }if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });
  }, [events, minPrice, maxPrice, selectedCategories, startDate, endDate, sortBy]);
  
  // Calcular páginas
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  
  // Obter eventos da página atual
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
      const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return filteredEvents.slice(startIndex, startIndex + eventsPerPage);
  }, [filteredEvents, currentPage, eventsPerPage]);

  const resetFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setStartDate("");
    setEndDate("");
    setSelectedCategories([]);
    setCurrentPage(1); // Resetar para a primeira página
  };
  
  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave para o topo da lista
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1496843916299-590492c751f4?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          />
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
      
      {/* Main Content */}
      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
        {/* Sidebar filters */}
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
          resetFilters={resetFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />
        
        {/* Main content area */}
        <div className="flex-1 md:w-2/3">
          {/* Import do módulo de ordenação */}
          <div className="hidden md:block">
            <EventsSorting 
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalEvents={filteredEvents.length}
            />
          </div>
          
          {/* Grid de eventos com paginação */}
          <EventsGrid 
            events={paginatedEvents} 
            isLoading={isLoading} 
            resetFilters={resetFilters} 
          />
          
          {/* Paginação */}
          {filteredEvents.length > 0 && (
            <EventsPagination
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
