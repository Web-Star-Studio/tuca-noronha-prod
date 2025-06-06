"use client";

import HostingCard from "@/components/cards/HostingCard";
import HostingFilter from "@/components/filters/HostingFilter";
import { useEffect, useState } from "react";
import { useAllAccommodations } from "@/lib/services/accommodationService";
import type { Accommodation } from "@/lib/services/accommodationService";

export default function HospedagensPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Buscar dados reais do Convex
  const { data: accommodations = [], isLoading } = useAllAccommodations();

  // Extrair todos os tipos de hospedagem disponíveis (sem duplicatas)
  const types = Array.from(
    new Set(accommodations.map((accommodation) => accommodation.type))
  ).sort();

  // Extrair todas as amenidades disponíveis (sem duplicatas)
  const amenities = Array.from(
    new Set(accommodations.flatMap((accommodation) => accommodation.amenities))
  ).sort();

  // Encontrar o preço máximo para o slider
  const maxPrice = Math.max(...accommodations.map(accommodation => accommodation.pricePerNight), 3000);

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
        return [...prev, type];
    });
  };

  const toggleAmenityFilter = (amenity: string) => {
    setSelectedAmenities((prev) => {
      if (prev.includes(amenity)) {
        return prev.filter((a) => a !== amenity);
      }
        return [...prev, amenity];
    });
  };

  const applyFilters = () => {
    const filtered = accommodations.filter((accommodation: Accommodation) => {
      // Filtragem por tipo
      const typeMatch =
        selectedTypes.length === 0 ||
        selectedTypes.includes(accommodation.type);

      // Filtragem por faixa de preço
      const priceMatch =
        accommodation.pricePerNight >= priceRange[0] &&
        accommodation.pricePerNight <= priceRange[1];

      // Filtragem por número de hóspedes
      const guestMatch = accommodation.maxGuests >= guestCount;

      // Filtragem por amenidades
      const amenitiesMatch =
        selectedAmenities.length === 0 ||
        selectedAmenities.every(amenity => 
          accommodation.amenities.includes(amenity)
        );

      return typeMatch && priceMatch && guestMatch && amenitiesMatch;
    });

    setFilteredAccommodations(filtered);
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setPriceRange([0, maxPrice]);
    setGuestCount(2);
    setFilteredAccommodations(accommodations);
  };

  // Inicialização dos filteredAccommodations quando o componente monta
  useEffect(() => {
    if (accommodations.length > 0) {
      setFilteredAccommodations(accommodations);
      setPriceRange([0, maxPrice]);
    }
  }, [accommodations, maxPrice]);

  // Transformar dados do Convex para o formato esperado pelo HostingCard
  const transformAccommodationToHosting = (accommodation: Accommodation) => ({
    id: accommodation._id,
    name: accommodation.name,
    slug: accommodation.slug,
    description: accommodation.description,
    description_long: accommodation.description,
    address: {
      street: accommodation.address.street,
      city: accommodation.address.city,
      state: accommodation.address.state,
      zipCode: accommodation.address.zipCode,
      neighborhood: accommodation.address.neighborhood,
      coordinates: {
        latitude: accommodation.address.coordinates.latitude,
        longitude: accommodation.address.coordinates.longitude
      }
    },
    phone: accommodation.phone,
    website: accommodation.website,
    type: accommodation.type,
    checkInTime: accommodation.checkInTime || "14:00",
    checkOutTime: accommodation.checkOutTime || "11:00",
    pricePerNight: accommodation.pricePerNight,
    currency: "BRL",
    discountPercentage: 0,
    taxes: accommodation.taxes,
    cleaningFee: accommodation.cleaningFee,
    totalRooms: 1,
    maxGuests: accommodation.maxGuests,
    bedrooms: accommodation.bedrooms,
    bathrooms: accommodation.bathrooms,
    beds: {
      single: 0,
      double: accommodation.beds || 2,
      queen: 0,
      king: 0
    },
    area: accommodation.area || 35,
    amenities: accommodation.amenities,
    houseRules: [],
    cancellationPolicy: "Política de cancelamento padrão",
    petsAllowed: false,
    smokingAllowed: false,
    eventsAllowed: false,
    minimumStay: accommodation.minimumStay || 1,
    mainImage: accommodation.mainImage,
    galleryImages: accommodation.galleryImages || [],
    rating: {
      overall: accommodation.rating,
      cleanliness: accommodation.rating,
      location: accommodation.rating,
      checkin: accommodation.rating,
      value: accommodation.rating,
      accuracy: accommodation.rating,
      communication: accommodation.rating,
      totalReviews: accommodation.totalReviews
    },
    isActive: accommodation.isActive,
    isFeatured: accommodation.isFeatured,
    tags: [],
    createdAt: accommodation._creationTime.toString(),
    updatedAt: accommodation._creationTime.toString()
  });

  if (isLoading) {
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
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                  Hospedagens em Fernando de Noronha
                </h1>
                <p className="text-xl max-w-2xl mx-auto">
                  Carregando as melhores opções de hospedagem para sua estadia na ilha...
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-12 gap-8 items-start">
          <div className="w-full animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80" />
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

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
          />
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
            {filteredAccommodations && filteredAccommodations.length > 0 ? (
              filteredAccommodations.map((accommodation: Accommodation) => (
                <div key={accommodation._id} className="w-full h-full">
                  <HostingCard hosting={transformAccommodationToHosting(accommodation)} />
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