/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";
import { hostings } from "../mocked/hostingsMockedData";

export interface Hosting {
  // Identificação 
  id: string;
  name: string;
  slug: string;
  description: string;
  description_long: string;
  
  // Localização
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    neighborhood: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Contato e Informações
  phone: string;
  website: string;
  type: string; // Pousada, Hotel, Apartamento, Casa, Villa
  checkInTime: string;
  checkOutTime: string;

  // Preços e Disponibilidade
  pricePerNight: number;
  currency: string;
  discountPercentage?: number;
  taxes?: number;
  cleaningFee?: number;
  
  // Características
  totalRooms: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: {
    single: number;
    double: number;
    queen: number;
    king: number;
  };
  area: number; // em m²
  
  // Amenidades
  amenities: string[];
  
  // Regras e Políticas
  houseRules: string[];
  cancellationPolicy: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  eventsAllowed: boolean;
  minimumStay: number; // em noites
  
  // Fotos
  mainImage: string;
  galleryImages: string[];
  
  // Avaliações
  rating: {
    overall: number;
    cleanliness: number;
    location: number;
    checkin: number;
    value: number;
    accuracy: number;
    communication: number;
    totalReviews: number;
  };
  
  // Classificação
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  
  // Meta dados
  createdAt: string;
  updatedAt: string;
}

interface HostingsState {
  hostings: Hosting[];
  filteredHostings: Hosting[];
  selectedTypes: string[];
  selectedAmenities: string[];
  priceRange: [number, number];
  guestCount: number;
  availableTypes: string[];
  availableAmenities: string[];
  
  // Ações
  setFilteredHostings: (filteredHostings: Hosting[]) => void;
  toggleTypeFilter: (type: string) => void;
  toggleAmenityFilter: (amenity: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setGuestCount: (count: number) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

export const useHostingsStore = create<HostingsState>((set, get) => ({
  hostings,
  filteredHostings: hostings,
  selectedTypes: [],
  selectedAmenities: [],
  priceRange: [0, 3000],
  guestCount: 2,
  
  // Valores disponíveis para filtro extraídos dos dados
  availableTypes: Array.from(new Set(hostings.map((hosting: Hosting) => hosting.type))),
  availableAmenities: Array.from(
    new Set(hostings.flatMap((hosting: Hosting) => hosting.amenities))
  ),
  
  // Métodos
  setFilteredHostings: (filteredHostings) => set({ filteredHostings }),
  
  toggleTypeFilter: (type) => set((state) => {
    const selectedTypes = state.selectedTypes.includes(type)
      ? state.selectedTypes.filter(t => t !== type)
      : [...state.selectedTypes, type];
    return { selectedTypes };
  }),
  
  toggleAmenityFilter: (amenity) => set((state) => {
    const selectedAmenities = state.selectedAmenities.includes(amenity)
      ? state.selectedAmenities.filter(a => a !== amenity)
      : [...state.selectedAmenities, amenity];
    return { selectedAmenities };
  }),
  
  setPriceRange: (range) => set({ priceRange: range }),
  
  setGuestCount: (count) => set({ guestCount: count }),
  
  applyFilters: () => {
    const { 
      hostings, 
      selectedTypes, 
      selectedAmenities, 
      priceRange, 
      guestCount 
    } = get();
    
    const filtered = hostings.filter(hosting => {
      // Filtro por tipo de hospedagem
      const typeMatch = selectedTypes.length === 0 || 
        selectedTypes.includes(hosting.type);
      
      // Filtro por preço
      const priceMatch = hosting.pricePerNight >= priceRange[0] && 
        hosting.pricePerNight <= priceRange[1];
      
      // Filtro por número de hóspedes
      const guestMatch = hosting.maxGuests >= guestCount;
      
      // Filtro por amenidades
      const amenitiesMatch = selectedAmenities.length === 0 || 
        selectedAmenities.every(amenity => 
          hosting.amenities.includes(amenity)
        );
      
      return typeMatch && priceMatch && guestMatch && amenitiesMatch;
    });
    
    set({ filteredHostings: filtered });
  },
  
  resetFilters: () => {
    set({
      selectedTypes: [],
      selectedAmenities: [],
      priceRange: [0, 3000],
      guestCount: 2,
      filteredHostings: get().hostings
    });
  }
}));

// Store separada para detalhe de hospedagem
interface HostingDetailState {
  hosting: Hosting | null;
  isLoading: boolean;
  setHosting: (hosting: Hosting) => void;
  setLoading: (state: boolean) => void;
}

export const useHostingDetailStore = create<HostingDetailState>((set) => ({
  hosting: null,
  isLoading: true,
  setHosting: (hosting) => set({ hosting }),
  setLoading: (state) => set({ isLoading: state }),
}));
