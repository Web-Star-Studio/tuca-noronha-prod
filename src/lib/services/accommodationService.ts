import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

// Tipos para representar uma acomodação
export type Accommodation = {
  id?: string;
  _id?: Id<"accommodations">;
  _creationTime?: number;
  name: string;
  slug: string;
  description: string;
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
  phone: string;
  website?: string;
  type: string; // "hotel", "apartment", "house", "room", etc.
  pricing: {
    pricePerNight: number;
    taxes: number;
    cleaningFee: number;
  };
  rooms: {
    bedrooms: number;
    bathrooms: number;
    beds: number;
  };
  amenities: string[];
  houseRules: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
  mainImage: string;
  galleryImages: string[];
  rating: {
    overall: number;
    cleanliness: number;
    communication: number;
    checkIn: number;
    accuracy: number;
    location: number;
    value: number;
    totalReviews: number;
  };
  instantBooking: boolean;
  minimumStay: number;
  maximumGuests: number;
  isActive: boolean;
  isFeatured: boolean;
  partnerId?: Id<"users">;
  creator?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
};

// Hook para obter todas as acomodações (ADMIN/PARTNER)
export function useAllAccommodations() {
  const accommodations = useQuery(api.domains.accommodations.queries.list, {
    paginationOpts: { numItems: 100, cursor: null }
  });
  return {
    accommodations: accommodations?.page as Accommodation[] | undefined,
    isLoading: accommodations === undefined,
    hasMore: accommodations?.isDone === false,
    cursor: accommodations?.continueCursor
  };
}

// Hook para obter acomodações destacadas
export function useFeaturedAccommodations() {
  const accommodations = useQuery(api.domains.accommodations.queries.getFeatured);
  return {
    accommodations: accommodations as Accommodation[] | undefined,
    isLoading: accommodations === undefined
  };
}

// Hook para obter acomodação por ID
export function useAccommodationById(id: string) {
  const accommodation = useQuery(api.domains.accommodations.queries.getById, { 
    id: id as Id<"accommodations"> 
  });
  return {
    accommodation: accommodation as Accommodation | undefined,
    isLoading: accommodation === undefined
  };
}

// Hook para obter acomodação por slug (páginas públicas)
export function useAccommodationBySlug(slug: string) {
  const accommodation = useQuery(api.domains.accommodations.queries.getBySlug, { slug });
  return {
    accommodation: accommodation as Accommodation | undefined,
    isLoading: accommodation === undefined
  };
}

// Hook para criar uma nova acomodação
export function useCreateAccommodation() {
  const createMutation = useMutation(api.domains.accommodations.mutations.create);
  
  return async (accommodationData: Accommodation, partnerId: Id<"users">) => {
    // Garantir que a acomodação tenha o partnerId
    const dataWithPartner = {
      ...accommodationData,
      partnerId
    };
    
    const accommodationId = await createMutation(dataWithPartner as any);
    return accommodationId;
  };
}

// Hook para atualizar uma acomodação existente
export function useUpdateAccommodation() {
  const updateMutation = useMutation(api.domains.accommodations.mutations.update);
  
  return async (accommodationData: Accommodation) => {
    if (!accommodationData._id) {
      throw new Error("Accommodation ID is required for update");
    }
    
    const accommodationId = await updateMutation({
      id: accommodationData._id,
      ...accommodationData
    } as any);
    
    return accommodationId;
  };
}

// Hook para excluir uma acomodação
export function useDeleteAccommodation() {
  const deleteMutation = useMutation(api.domains.accommodations.mutations.remove);
  
  return async (id: string) => {
    await deleteMutation({ id: id as Id<"accommodations"> });
  };
}

// Hook para alternar o status de destaque de uma acomodação
export function useToggleFeatured() {
  const toggleFeaturedMutation = useMutation(api.domains.accommodations.mutations.toggleFeatured);
  
  return async (id: string, isFeatured: boolean) => {
    await toggleFeaturedMutation({ 
      id: id as Id<"accommodations">, 
      isFeatured 
    });
  };
}

// Hook para alternar o status ativo de uma acomodação
export function useToggleActive() {
  const toggleActiveMutation = useMutation(api.domains.accommodations.mutations.toggleActive);
  
  return async (id: string, isActive: boolean) => {
    await toggleActiveMutation({ 
      id: id as Id<"accommodations">, 
      isActive 
    });
  };
}

// Hook para obter acomodações por usuário
export function useAccommodationsByUser(userId: Id<"users">) {
  const accommodations = useQuery(api.domains.accommodations.queries.list, {
    paginationOpts: { numItems: 100, cursor: null }
  });
  return {
    accommodations: accommodations?.page?.filter(acc => acc.partnerId === userId) as Accommodation[] | undefined,
    isLoading: accommodations === undefined
  };
}

// Tipos para reservas de acomodações
export type AccommodationBooking = {
  id?: string;
  _id?: Id<"accommodationBookings">;
  _creationTime?: number;
  accommodationId: Id<"accommodations">;
  userId: Id<"users">;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalAmount: number;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  paymentStatus: string;
  bookingStatus: string;
  confirmationCode: string;
  accommodation?: {
    id: string;
    name: string;
    address: any;
    mainImage: string;
  };
};

// Hook para criar uma nova reserva
export function useCreateBooking() {
  const createMutation = useMutation(api.domains.accommodations.mutations.createBooking);
  
  return async (bookingData: AccommodationBooking) => {
    const bookingId = await createMutation(bookingData as any);
    return bookingId;
  };
}

// Hook para atualizar status da reserva
export function useUpdateBookingStatus() {
  const updateMutation = useMutation(api.domains.accommodations.mutations.updateBookingStatus);
  
  return async (bookingId: string, status: string) => {
    await updateMutation({ 
      id: bookingId as Id<"accommodationBookings">, 
      status 
    });
  };
}

// Hook para obter reservas por acomodação
export function useBookingsByAccommodation(accommodationId: Id<"accommodations">) {
  const bookings = useQuery(api.domains.accommodations.queries.getBookingsByAccommodation, {
    accommodationId
  });
  return {
    bookings: bookings as AccommodationBooking[] | undefined,
    isLoading: bookings === undefined
  };
}

// Hook para obter reservas por usuário
export function useBookingsByUser(userId: Id<"users">) {
  const bookings = useQuery(api.domains.accommodations.queries.getBookingsByUser, { userId });
  return {
    bookings: bookings as AccommodationBooking[] | undefined,
    isLoading: bookings === undefined
  };
}

// Hook para obter reservas por período
export function useBookingsByDateRange(accommodationId: Id<"accommodations">, startDate: string, endDate: string) {
  const bookings = useQuery(api.domains.accommodations.queries.getBookingsByDateRange, {
    accommodationId,
    startDate,
    endDate
  });
  return {
    bookings: bookings as AccommodationBooking[] | undefined,
    isLoading: bookings === undefined
  };
} 