import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Optimized asset management hook using selective query patterns
 * Inspired by TanStack Query performance best practices
 */
export interface AssetQueryOptions {
  assetType?: "all" | "restaurants" | "events" | "activities" | "vehicles";
  isActive?: boolean;
  partnerId?: string;
  limit?: number;
}

export interface EnrichedAsset {
  _id: string;
  _creationTime: number;
  name: string;
  title?: string;
  slug?: string;
  assetType: string;
  isActive: boolean;
  partnerId: string;
  partnerName?: string;
  partnerEmail?: string;
  imageUrl?: string;
  description?: string;
  location?: string;
  address?: string;
  category?: string;
  cuisine?: string[];
  price?: number;
  estimatedPricePerDay?: number;
  pricePerNight?: number;
  date?: string;
  time?: string;
  duration?: string;
  type?: string;
  licensePlate?: string;
  status?: string;
  bookingsCount?: number;
  rating?: number;
  maxParticipants?: number;
  [key: string]: any;
}

export interface OptimizedAssetHookResult {
  allAssets: EnrichedAsset[];
  isLoading: boolean;
  hasError: any;
  refetch: () => void;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

/**
 * Custom hook that optimizes asset queries based on selected type
 * Uses conditional query execution and memoized results
 */
export function useOptimizedAssets(options: AssetQueryOptions): OptimizedAssetHookResult {
  const { assetType = "all", isActive, partnerId } = options;

  // Asset-specific queries with conditional execution
  const restaurantsQuery = useQuery(
    api.domains.restaurants.queries.getAll,
    (assetType === "all" || assetType === "restaurants") ? {} : "skip"
  );

  const eventsQuery = useQuery(
    api.domains.events.queries.getAll,
    (assetType === "all" || assetType === "events") ? {} : "skip"
  );

  const activitiesQuery = useQuery(
    api.domains.activities.queries.getAll,
    (assetType === "all" || assetType === "activities") ? {} : "skip"
  );

  const vehiclesQuery = useQuery(
    api.domains.vehicles.queries.listVehicles,
    (assetType === "all" || assetType === "vehicles") ? {} : "skip"
  );



  // Query all users to get partner information
  const usersQuery = useQuery(api.domains.users.queries.listAllUsers);

  // Create a map of users for fast lookup
  const usersMap = useMemo(() => {
    if (!usersQuery) return new Map();
    
    const map = new Map();
    usersQuery.forEach((user: any) => {
      map.set(user._id, user);
    });
    return map;
  }, [usersQuery]);

  // Helper function to enrich asset with partner info and normalize fields
  const enrichAsset = (asset: any, assetType: string): EnrichedAsset => {
    // Get partner information
    const partnerId = asset.partnerId || asset.ownerId;
    const partner = partnerId ? usersMap.get(partnerId) : null;

    // Normalize common fields
    const name = asset.name || asset.title || 'Asset sem nome';
    const imageUrl = asset.mainImage || asset.imageUrl || asset.image;
    const isActive = asset.isActive !== undefined ? asset.isActive : true;

    // Asset-specific field mapping
    let enrichedAsset: EnrichedAsset = {
      _id: asset._id,
      _creationTime: asset._creationTime,
      name,
      title: asset.title,
      slug: asset.slug,
      assetType,
      isActive,
      partnerId: partnerId || '',
      partnerName: partner?.name || 'Usuário Master',
      partnerEmail: partner?.email || '',
      imageUrl,
      description: asset.description || asset.description_long,
      location: asset.location || (asset.address ? 
        (typeof asset.address === 'string' ? asset.address : asset.address.city || asset.address.street) 
        : undefined),
      address: typeof asset.address === 'string' ? asset.address : 
        (asset.address ? `${asset.address.street}, ${asset.address.city}` : undefined),
    };

    // Add asset-type specific fields
    switch (assetType) {
      case 'restaurants':
        enrichedAsset = {
          ...enrichedAsset,
          cuisine: asset.cuisine,
          priceRange: asset.priceRange,
          rating: asset.rating?.overall,
          acceptsReservations: asset.acceptsReservations,
          maximumPartySize: asset.maximumPartySize,
        };
        break;
      
      case 'events':
        enrichedAsset = {
          ...enrichedAsset,
          date: asset.date,
          time: asset.time,
          category: asset.category,
          speaker: asset.speaker,
          maxParticipants: asset.maxParticipants,
          price: asset.ticketPrice || asset.price,
        };
        break;
      
      case 'activities':
        enrichedAsset = {
          ...enrichedAsset,
          category: asset.category,
          duration: asset.duration,
          price: asset.price,
          maxParticipants: asset.maxParticipants,
          difficulty: asset.difficulty,
        };
        break;
      
      case 'vehicles':
        enrichedAsset = {
          ...enrichedAsset,
          category: asset.category,
          type: asset.type,
          licensePlate: asset.licensePlate,
          estimatedPricePerDay: asset.estimatedPricePerDay,
          capacity: asset.capacity,
          transmission: asset.transmission,
          fuelType: asset.fuelType,
        };
        break;
      

    }

    return enrichedAsset;
  };

  // Combine and enrich all assets
  const allAssets = useMemo(() => {
    const assets: EnrichedAsset[] = [];
    
    if (assetType === "all") {
      // Combine all asset types only when needed
      if (restaurantsQuery) {
        assets.push(...restaurantsQuery.map((asset: any) => enrichAsset(asset, 'restaurants')));
      }
      if (eventsQuery) {
        assets.push(...eventsQuery.map((asset: any) => enrichAsset(asset, 'events')));
      }
      if (activitiesQuery) {
        assets.push(...activitiesQuery.map((asset: any) => enrichAsset(asset, 'activities')));
      }
      if (vehiclesQuery?.vehicles) {
        assets.push(...vehiclesQuery.vehicles.map((asset: any) => enrichAsset(asset, 'vehicles')));
      }

    } else {
      // Return specific asset type data directly
      switch (assetType) {
        case "restaurants":
          if (restaurantsQuery) {
            return restaurantsQuery.map((asset: any) => enrichAsset(asset, 'restaurants'));
          }
          break;
        case "events":
          if (eventsQuery) {
            return eventsQuery.map((asset: any) => enrichAsset(asset, 'events'));
          }
          break;
        case "activities":
          if (activitiesQuery) {
            return activitiesQuery.map((asset: any) => enrichAsset(asset, 'activities'));
          }
          break;
        case "vehicles":
          if (vehiclesQuery?.vehicles) {
            return vehiclesQuery.vehicles.map((asset: any) => enrichAsset(asset, 'vehicles'));
          }
          break;

        default:
          return [];
      }
    }
    
    // Apply filters
    let filteredAssets = assets;
    
    if (isActive !== undefined) {
      filteredAssets = filteredAssets.filter(asset => asset.isActive === isActive);
    }
    
    if (partnerId) {
      filteredAssets = filteredAssets.filter(asset => asset.partnerId === partnerId);
    }
    
    // Sort by creation time (newest first)
    return filteredAssets.sort((a, b) => b._creationTime - a._creationTime);
  }, [
    assetType,
    isActive,
    partnerId,
    restaurantsQuery,
    eventsQuery,
    activitiesQuery,
    vehiclesQuery,
    enrichAsset,
  ]);

  // Memoized loading state
  const isLoading = useMemo(() => {
    if (!usersQuery) return true; // Always need users for partner info
    
    if (assetType === "all") {
      return restaurantsQuery === undefined || eventsQuery === undefined || 
             activitiesQuery === undefined || vehiclesQuery === undefined;
    }
    
    switch (assetType) {
      case "restaurants": return restaurantsQuery === undefined;
      case "events": return eventsQuery === undefined;
      case "activities": return activitiesQuery === undefined;
      case "vehicles": return vehiclesQuery === undefined;
      default: return false;
    }
  }, [
    assetType,
    usersQuery,
    restaurantsQuery,
    eventsQuery,
    activitiesQuery,
    vehiclesQuery,
  ]);

  // Memoized error state - Convex doesn't return errors in the same way
  const hasError = useMemo(() => {
    // In Convex, errors are typically thrown and caught by error boundaries
    // Return null for now as errors are handled differently
    return null;
  }, []);

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalCount = allAssets.length;
    const activeCount = allAssets.filter(asset => asset.isActive).length;
    const inactiveCount = totalCount - activeCount;

    return { totalCount, activeCount, inactiveCount };
  }, [allAssets]);

  // Simple refetch function - not directly supported in Convex
  const refetch = () => {
    // Convex queries auto-update, so this is mostly a no-op
    // Could potentially trigger a re-render if needed
    console.log("Convex queries auto-update, refetch not needed");
  };

  return {
    allAssets,
    isLoading,
    hasError,
    refetch,
    ...statistics,
  };
}

/**
 * Hook for asset type counts with minimal re-renders
 * Uses individual queries for each asset type
 */
export function useAssetTypeCounts() {
  // Individual queries for each asset type count
  const restaurantCount = useQuery(api.domains.restaurants.queries.getAll);
  const eventCount = useQuery(api.domains.events.queries.getAll);
  const activityCount = useQuery(api.domains.activities.queries.getAll);
  const vehicleCount = useQuery(api.domains.vehicles.queries.listVehicles);


  return useMemo(() => ({
    restaurants: restaurantCount?.length || 0,
    events: eventCount?.length || 0,
    activities: activityCount?.length || 0,
    vehicles: vehicleCount?.vehicles?.length || 0,
    total: (restaurantCount?.length || 0) + 
           (eventCount?.length || 0) + 
           (activityCount?.length || 0) + 
           (vehicleCount?.vehicles?.length || 0),
  }), [restaurantCount, eventCount, activityCount, vehicleCount]);
} 