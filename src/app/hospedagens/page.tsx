"use client";

import HostingCard from "@/components/cards/HostingCard";
import { Hosting, useHostingsStore } from "@/lib/store/hostingsStore";
import HostingFilter from "@/components/filters/HostingFilter";
import { useEffect, useState } from "react";

export default function HospedagensPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [guestCount, setGuestCount] = useState<number>(2);
  const { hostings } = useHostingsStore();
  const [filteredHostings, setFilteredHostings] = useState<Hosting[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extrair todos os tipos de hospedagem disponíveis (sem duplicatas)
  const types = Array.from(
    new Set(hostings.map((hosting) => hosting.type))
  ).sort();

  // Extrair todas as amenidades disponíveis (sem duplicatas)
  const amenities = Array.from(
    new Set(hostings.flatMap((hosting) => hosting.amenities))
  ).sort();

  // Encontrar o preço máximo para o slider
  const maxPrice = Math.max(...hostings.map(hosting => hosting.pricePerNight), 3000);

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const toggleAmenityFilter = (amenity: string) => {
    setSelectedAmenities((prev) => {
      if (prev.includes(amenity)) {
        return prev.filter((a) => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  const applyFilters = () => {
    const filtered = hostings.filter((hosting: Hosting) => {
      // Filtragem por tipo
      const typeMatch =
        selectedTypes.length === 0 ||
        selectedTypes.includes(hosting.type);

      // Filtragem por faixa de preço
      const priceMatch =
        hosting.pricePerNight >= priceRange[0] &&
        hosting.pricePerNight <= priceRange[1];

      // Filtragem por número de hóspedes
      const guestMatch = hosting.maxGuests >= guestCount;

      // Filtragem por amenidades
      const amenitiesMatch =
        selectedAmenities.length === 0 ||
        selectedAmenities.every(amenity => 
          hosting.amenities.includes(amenity)
        );

      return typeMatch && priceMatch && guestMatch && amenitiesMatch;
    });

    setFilteredHostings(filtered);
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setPriceRange([0, maxPrice]);
    setGuestCount(2);
    setFilteredHostings(hostings);
  };

  // Inicialização dos filteredHostings quando o componente monta
  useEffect(() => {
    if (hostings.length > 0) {
      setFilteredHostings(hostings);
      setPriceRange([0, maxPrice]);
    }
  }, [hostings, maxPrice]);

  return (
    <>
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Hospedagens em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Descubra as melhores opções de hospedagem para curtir sua estadia na ilha com todo o conforto.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
        <HostingFilter
          types={types}
          selectedTypes={selectedTypes}
          toggleTypeFilter={toggleTypeFilter}
          amenities={amenities}
          selectedAmenities={selectedAmenities}
          toggleAmenityFilter={toggleAmenityFilter}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          maxPrice={maxPrice}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />
        <div className="flex-1 md:w-3/4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHostings && filteredHostings.length > 0 ? (
              filteredHostings.map((hosting: Hosting) => (
                <div key={hosting.id} className="w-full h-full">
                  <HostingCard hosting={hosting} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-lg text-gray-500">
                  Nenhuma hospedagem encontrada
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}