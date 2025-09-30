import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export type RestaurantType = "internal" | "external";

export type OperatingDays = {
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
};

// Tipos para representar um restaurante
export type Restaurant = {
  id?: string;
  _id?: Id<"restaurants">;
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
  cuisine: string[];
  priceRange: string;
  diningStyle: string;
  features: string[];
  dressCode?: string;
  paymentOptions?: string[];
  parkingDetails?: string;
  mainImage: string;
  galleryImages: string[];
  menuImages?: string[];
  rating: {
    overall: number;
    food: number;
    service: number;
    ambience: number;
    value: number;
    noiseLevel: string;
    totalReviews: number;
  };
  acceptsReservations: boolean;
  tags: string[];
  executiveChef?: string;
  privatePartyInfo?: string;
  isActive: boolean;
  isFeatured: boolean;
  isFree?: boolean; // Asset gratuito (sem pagamento)
  partnerId?: Id<"users">;
  price?: number;
  netRate?: number;
  acceptsOnlinePayment?: boolean;
  requiresUpfrontPayment?: boolean;
  restaurantType: RestaurantType;
  operatingDays: OperatingDays;
  openingTime: string;
  closingTime: string;
  creator?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
};

// Hook para obter todos os restaurantes (ADMIN/PARTNER)
export function useAllRestaurants() {
  const restaurants = useQuery(api.domains.restaurants.queries.getAll);
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Hook para obter restaurantes destacados
export function useFeaturedRestaurants() {
  const restaurants = useQuery(api.domains.restaurants.queries.getFeaturedRestaurants);
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Hook para obter restaurantes ativos
export function useActiveRestaurants() {
  const restaurants = useQuery(api.domains.restaurants.queries.getActive);
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Hook para obter restaurante por ID
export function useRestaurantById(id: string) {
  const restaurant = useQuery(api.domains.restaurants.queries.getById, { id: id as Id<"restaurants"> });
  return {
    restaurant: restaurant as Restaurant | undefined,
    isLoading: restaurant === undefined
  };
}

// Hook para obter restaurante por slug (OLD - será removido)
export function useRestaurantBySlugOld(slug: string) {
  const restaurant = useQuery(api.domains.restaurants.queries.getBySlug, { slug });
  return {
    restaurant: restaurant as Restaurant | undefined,
    isLoading: restaurant === undefined
  };
}

// Hook para criar um novo restaurante
export function useCreateRestaurant() {
  const createMutation = useMutation(api.domains.restaurants.mutations.create);
  
  return async (restaurantData: Restaurant, partnerId: Id<"users">) => {
    // Remove internal Convex fields that shouldn't be sent to the mutation
    const { _id: _id_field, _creationTime: _creationTime_field, id: _id_alt, creator: _creator_field, ...cleanData } = restaurantData;
    void _id_field; void _creationTime_field; void _id_alt; void _creator_field; // Avoid unused variable warnings
    
    // Garantir que o restaurante tenha o partnerId
    const dataWithPartner = {
      ...cleanData,
      partnerId
    };
    
    console.log("Creating restaurant with data:", dataWithPartner);
    console.log("PartnerId type:", typeof partnerId, "Value:", partnerId);
    
    try {
      const restaurantId = await createMutation(dataWithPartner as any);
      console.log("Restaurant created successfully with ID:", restaurantId);
      return restaurantId;
    } catch {
      console.error("Error in createMutation:", error);
      throw error;
    }
  };
}

// Hook para atualizar um restaurante existente
export function useUpdateRestaurant() {
  const updateMutation = useMutation(api.domains.restaurants.mutations.update);
  
  return async (restaurantData: Restaurant) => {
    if (!restaurantData._id) {
      throw new Error("Restaurant ID is required for update");
    }
    
    // Remove internal Convex fields that shouldn't be sent to the mutation
    const { _id: _id_field, _creationTime: _creationTime_field, id: _id_alt, creator: _creator_field, ...cleanData } = restaurantData;
    void _id_field; void _creationTime_field; void _id_alt; void _creator_field; // Avoid unused variable warnings
    
    const restaurantId = await updateMutation({
      id: restaurantData._id,
      ...cleanData
    } as any);
    
    return restaurantId;
  };
}

// Hook para excluir um restaurante
export function useDeleteRestaurant() {
  const deleteMutation = useMutation(api.domains.restaurants.mutations.remove);
  
  return async (id: string) => {
    await deleteMutation({ id: id as Id<"restaurants"> });
  };
}

// Hook para alternar o status de destaque de um restaurante
export function useToggleFeatured() {
  const toggleFeaturedMutation = useMutation(api.domains.restaurants.mutations.toggleFeatured);
  
  return async (id: string, isFeatured: boolean) => {
    await toggleFeaturedMutation({ 
      id: id as Id<"restaurants">, 
      isFeatured 
    });
  };
}

// Hook para alternar o status ativo de um restaurante
export function useToggleActive() {
  const toggleActiveMutation = useMutation(api.domains.restaurants.mutations.toggleActive);
  
  return async (id: string, isActive: boolean) => {
    await toggleActiveMutation({ 
      id: id as Id<"restaurants">, 
      isActive 
    });
  };
}

// Hook para obter todos os restaurantes ativos (páginas públicas)
export function useRestaurants() {
  const restaurants = useQuery(api.domains.restaurants.queries.getActive);
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Hook para obter restaurante por slug (páginas públicas)
export function useRestaurantBySlug(slug: string) {
  const restaurant = useQuery(api.domains.restaurants.queries.getBySlug, { slug });
  return {
    restaurant: restaurant as Restaurant | undefined,
    isLoading: restaurant === undefined
  };
}

// Hook para obter restaurantes de um usuário específico
export function useRestaurantsByUser(userId: Id<"users">) {
  const restaurants = useQuery(api.domains.restaurants.queries.getByPartnerId, { partnerId: userId });
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Hook para obter restaurantes com informações do criador (ADMIN/PARTNER)
export function useRestaurantsWithCreators() {
  const restaurants = useQuery(api.domains.restaurants.queries.getAll);
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Tipo para reserva de restaurante
export type RestaurantReservation = {
  id?: string;
  _id?: Id<"restaurantReservations">;
  _creationTime?: number;
  restaurantId: Id<"restaurants">;
  userId: Id<"users">;
  date: string;
  time: string;
  partySize: number;
  name: string;
  email: string;
  phone: string;
  specialRequests?: string;
  status: string;
  confirmationCode: string;
  restaurant?: {
    id: string;
    name: string;
    address: any;
    mainImage: string;
  };
};

// Hook para criar uma nova reserva
export function useCreateReservation() {
  const createReservationMutation = useMutation(api.domains.restaurants.mutations.createReservation);
  
  return async (reservationData: Omit<RestaurantReservation, "status" | "confirmationCode">) => {
    const reservationId = await createReservationMutation(reservationData as any);
    return reservationId;
  };
}

// Hook para atualizar o status de uma reserva
export function useUpdateReservationStatus() {
  const updateStatusMutation = useMutation(api.domains.restaurants.mutations.updateReservationStatus);
  
  return async (id: string, status: string) => {
    await updateStatusMutation({ 
      id: id as Id<"restaurantReservations">, 
      status 
    });
  };
}

// Hook para obter reservas de um restaurante
export function useReservationsByRestaurant(restaurantId: Id<"restaurants">) {
  const reservations = useQuery(api.domains.restaurants.queries.getReservationsByRestaurant, { restaurantId });
  return {
    reservations: reservations as RestaurantReservation[] | undefined,
    isLoading: reservations === undefined
  };
}

// Hook para obter reservas de um usuário
export function useReservationsByUser(userId: Id<"users">) {
  const reservations = useQuery(api.domains.restaurants.queries.getReservationsByUser, { userId });
  return {
    reservations: reservations as RestaurantReservation[] | undefined,
    isLoading: reservations === undefined
  };
}

// Hook para obter reservas de um restaurante por data
export function useReservationsByDate(restaurantId: Id<"restaurants">, date: string) {
  const reservations = useQuery(api.domains.restaurants.queries.getReservationsByDate, { restaurantId, date });
  return {
    reservations: reservations as RestaurantReservation[] | undefined,
    isLoading: reservations === undefined
  };
}
