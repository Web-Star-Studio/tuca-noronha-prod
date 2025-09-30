import { Id } from "../../_generated/dataModel";

export type RestaurantType = "internal" | "external";

export interface OperatingDays {
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
}

export interface Restaurant {
  _id: Id<"restaurants">;
  _creationTime: number;
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
    totalReviews: bigint;
  };
  acceptsReservations: boolean;
  tags: string[];
  executiveChef?: string;
  privatePartyInfo?: string;
  isActive: boolean;
  isFeatured: boolean;
  partnerId: Id<"users">;
  price?: number;
  netRate?: number;
  acceptsOnlinePayment?: boolean;
  requiresUpfrontPayment?: boolean;
  restaurantType: RestaurantType;
  operatingDays: OperatingDays;
  openingTime: string;
  closingTime: string;
}

export interface RestaurantCreator {
  id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
}

export interface RestaurantWithCreator extends Restaurant {
  creator: RestaurantCreator | null;
}

export interface RestaurantCreateInput {
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
  partnerId: Id<"users">;
  price?: number;
  netRate?: number;
  acceptsOnlinePayment?: boolean;
  requiresUpfrontPayment?: boolean;
  restaurantType: RestaurantType;
  operatingDays: OperatingDays;
  openingTime: string;
  closingTime: string;
}

export interface RestaurantUpdateInput {
  id: Id<"restaurants">;
  name?: string;
  slug?: string;
  description?: string;
  address?: {
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
  phone?: string;
  website?: string;
  cuisine?: string[];
  priceRange?: string;
  diningStyle?: string;
  features?: string[];
  dressCode?: string;
  paymentOptions?: string[];
  parkingDetails?: string;
  mainImage?: string;
  galleryImages?: string[];
  menuImages?: string[];
  rating?: {
    overall: number;
    food: number;
    service: number;
    ambience: number;
    value: number;
    noiseLevel: string;
    totalReviews: number;
  };
  acceptsReservations?: boolean;
  tags?: string[];
  executiveChef?: string;
  privatePartyInfo?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  partnerId?: Id<"users">;
  price?: number;
  netRate?: number;
  acceptsOnlinePayment?: boolean;
  requiresUpfrontPayment?: boolean;
  restaurantType?: RestaurantType;
  operatingDays?: OperatingDays;
  openingTime?: string;
  closingTime?: string;
}
