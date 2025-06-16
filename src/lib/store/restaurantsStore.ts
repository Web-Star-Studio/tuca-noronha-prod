/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";

export interface Restaurant {
  // Basic Information
  id: string; // Using string for database ID compatibility
  name: string; // Restaurant name
  description: string; // Detailed description
  slug: string; // URL-friendly version of name
  maxGuests?: number;

  // Contact & Location
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    neighborhood: string; // Area/district in the city
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  phone: string;
  website: string;

  // Dining Information
  cuisine: string[]; // Types of cuisine (Italian, American, etc.)
  priceRange: string; // $, $$, $$$, $$$$
  diningStyle: string; // Casual, Fine Dining, etc.
  hours: {
    [day: string]: string[]; // Format: ["11:30 AM-3:00 PM", "5:00 PM-10:00 PM"]
  };
  averagePrice?: number;

  // Features & Amenities
  features: string[]; // Bar Dining, Private Dining, etc.
  dressCode: string;
  paymentOptions: string[];
  parkingDetails: string;

  // Media
  mainImage: string; // Cover/featured image URL
  galleryImages: string[]; // Collection of images URLs
  menuImages: string[]; // Images of the actual menus

  // Ratings & Reviews
  rating: {
    overall: number; // Overall rating (e.g., 4.5 out of 5)
    food: number; // Food rating
    service: number; // Service rating
    ambience: number; // Ambience rating
    value: number; // Value rating
    noiseLevel: string; // Quiet, Moderate, Energetic
    totalReviews: number; // Number of reviews
  };

  // Reservation Information
  acceptsReservations: boolean;
  maximumPartySize: number;

  // Additional Information
  tags: string[]; // Special tags (Gluten-free, Vegan options, etc.)
  description_long: string; // Longer description/about section
  executiveChef: string; // Name of the chef
  privatePartyInfo: string; // Details on private events

  // Administrative
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

interface RestaurantFilters {
  cuisine?: string;
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  tag?: string;
  neighborhood?: string;
}

type RestaurantsStoreState = {
  restaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  setRestaurants: (restaurants: Restaurant[]) => void;
  setFilteredRestaurants: (restaurants: Restaurant[]) => void;
  featuredRestaurants: Restaurant[];
};

export const useRestaurantsStore = create<RestaurantsStoreState>((set, get) => ({
  restaurants: [],
  filteredRestaurants: [],
  setRestaurants: (restaurants: Restaurant[]) => set({ 
    restaurants,
    filteredRestaurants: restaurants,
    featuredRestaurants: restaurants.filter(restaurant => restaurant.isFeatured)
  }),
  setFilteredRestaurants: (filteredRestaurants: Restaurant[]) => set({ filteredRestaurants }),
  featuredRestaurants: [],
}));
