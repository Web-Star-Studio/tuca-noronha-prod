import { Id } from "../../_generated/dataModel";

export interface Restaurant {
  _id: Id<"restaurants">;
  _creationTime: number;
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
    totalReviews: bigint;
  };
  acceptsReservations: boolean;
  maximumPartySize: bigint;
  tags: string[];
  executiveChef?: string;
  privatePartyInfo?: string;
  isActive: boolean;
  isFeatured: boolean;
  partnerId: Id<"users">;
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
  partnerId: Id<"users">;
}

export interface RestaurantUpdateInput {
  id: Id<"restaurants">;
  name?: string;
  slug?: string;
  description?: string;
  description_long?: string;
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
  hours?: {
    Monday: string[];
    Tuesday: string[];
    Wednesday: string[];
    Thursday: string[];
    Friday: string[];
    Saturday: string[];
    Sunday: string[];
  };
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
  maximumPartySize?: number;
  tags?: string[];
  executiveChef?: string;
  privatePartyInfo?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  partnerId?: Id<"users">;
} 