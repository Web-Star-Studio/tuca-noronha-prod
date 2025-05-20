import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

// Tipos para representar um restaurante
export type Restaurant = {
  id?: string;
  _id?: Id<"restaurants">;
  _creationTime?: number;
  name: string;
  slug: string;
  description: string;
  description_long: string;
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
  hours: {
    Monday: string[];
    Tuesday: string[];
    Wednesday: string[];
    Thursday: string[];
    Friday: string[];
    Saturday: string[];
    Sunday: string[];
  };
  features: string[];
  dressCode?: string;
  paymentOptions: string[];
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
  maximumPartySize: number;
  tags: string[];
  executiveChef?: string;
  privatePartyInfo?: string;
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

// Hook para obter todos os restaurantes
export function useRestaurants() {
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

// Hook para obter restaurante por slug
export function useRestaurantBySlug(slug: string) {
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
    // Garantir que o restaurante tenha o partnerId
    const dataWithPartner = {
      ...restaurantData,
      partnerId
    };
    
    const restaurantId = await createMutation(dataWithPartner as any);
    return restaurantId;
  };
}

// Hook para atualizar um restaurante existente
export function useUpdateRestaurant() {
  const updateMutation = useMutation(api.domains.restaurants.mutations.update);
  
  return async (restaurantData: Restaurant) => {
    if (!restaurantData._id) {
      throw new Error("Restaurant ID is required for update");
    }
    
    const restaurantId = await updateMutation({
      id: restaurantData._id,
      ...restaurantData
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

// Hook para obter restaurantes de um usuário específico
export function useRestaurantsByUser(userId: Id<"users">) {
  const restaurants = useQuery(api.domains.restaurants.queries.getByPartnerId, { partnerId: userId });
  return {
    restaurants: restaurants as Restaurant[] | undefined,
    isLoading: restaurants === undefined
  };
}

// Hook para obter restaurantes com informações do criador
export function useRestaurantsWithCreators() {
  const restaurants = useQuery(api.domains.restaurants.queries.getWithCreator);
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