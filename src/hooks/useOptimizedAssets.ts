import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Optimized asset management hook using selective query patterns
 * Inspired by TanStack Query performance best practices
 */
export interface AssetQueryOptions {
  assetType?: "all" | "restaurants" | "events" | "activities" | "vehicles" | "accommodations";
  isActive?: boolean;
  partnerId?: string;
  limit?: number;
}

export interface OptimizedAssetHookResult {
  allAssets: any[];
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
  const { assetType = "all", isActive, partnerId, limit = 50 } = options;

  // Asset-specific queries with conditional execution
  const restaurantsQuery = useQuery(
    assetType === "all" || assetType === "restaurants" 
      ? api.domains.users.queries.listAllRestaurants 
      : undefined,
    {
      isActive: isActive,
      partnerId: partnerId as any,
      limit,
    }
  );

  const eventsQuery = useQuery(
    assetType === "all" || assetType === "events"
      ? api.domains.users.queries.listAllEvents
      : undefined,
    {
      isActive: isActive,
      partnerId: partnerId as any,
      limit,
    }
  );

  const activitiesQuery = useQuery(
    assetType === "all" || assetType === "activities"
      ? api.domains.users.queries.listAllActivities
      : undefined,
    {
      isActive: isActive,
      partnerId: partnerId as any,
      limit,
    }
  );

  const vehiclesQuery = useQuery(
    assetType === "all" || assetType === "vehicles"
      ? api.domains.users.queries.listAllVehicles
      : undefined,
    {
      isActive: isActive,
      ownerId: partnerId as any, // vehicles use ownerId instead of partnerId
      limit,
    }
  );

  const accommodationsQuery = useQuery(
    assetType === "all" || assetType === "accommodations"
      ? api.domains.users.queries.listAllAccommodations
      : undefined,
    {
      isActive: isActive,
      partnerId: partnerId as any,
      limit,
    }
  );

  // Memoized combined results with selective updates
  const allAssets = useMemo(() => {
    const assets: any[] = [];
    
    if (assetType === "all") {
      // Combine all asset types only when needed
      if (restaurantsQuery) assets.push(...(restaurantsQuery || []));
      if (eventsQuery) assets.push(...(eventsQuery || []));
      if (activitiesQuery) assets.push(...(activitiesQuery || []));
      if (vehiclesQuery) assets.push(...(vehiclesQuery || []));
      if (accommodationsQuery) assets.push(...(accommodationsQuery || []));
    } else {
      // Return specific asset type data directly
      switch (assetType) {
        case "restaurants":
          return restaurantsQuery || [];
        case "events":
          return eventsQuery || [];
        case "activities":
          return activitiesQuery || [];
        case "vehicles":
          return vehiclesQuery || [];
        case "accommodations":
          return accommodationsQuery || [];
        default:
          return [];
      }
    }
    
    return assets.sort((a, b) => b._creationTime - a._creationTime);
  }, [
    assetType,
    restaurantsQuery,
    eventsQuery,
    activitiesQuery,
    vehiclesQuery,
    accommodationsQuery,
  ]);

  // Memoized loading state
  const isLoading = useMemo(() => {
    if (assetType === "all") {
      return restaurantsQuery === undefined || eventsQuery === undefined || 
             activitiesQuery === undefined || vehiclesQuery === undefined || 
             accommodationsQuery === undefined;
    }
    
    switch (assetType) {
      case "restaurants": return restaurantsQuery === undefined;
      case "events": return eventsQuery === undefined;
      case "activities": return activitiesQuery === undefined;
      case "vehicles": return vehiclesQuery === undefined;
      case "accommodations": return accommodationsQuery === undefined;
      default: return false;
    }
  }, [
    assetType,
    restaurantsQuery,
    eventsQuery,
    activitiesQuery,
    vehiclesQuery,
    accommodationsQuery,
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
  const restaurantCount = useQuery(
    api.domains.users.queries.listAllRestaurants,
    { limit: 1000 }
  );

  const eventCount = useQuery(
    api.domains.users.queries.listAllEvents,
    { limit: 1000 }
  );

  const activityCount = useQuery(
    api.domains.users.queries.listAllActivities,
    { limit: 1000 }
  );

  const vehicleCount = useQuery(
    api.domains.users.queries.listAllVehicles,
    { limit: 1000 }
  );

  const accommodationCount = useQuery(
    api.domains.users.queries.listAllAccommodations,
    { limit: 1000 }
  );

  return useMemo(() => ({
    restaurants: restaurantCount?.length || 0,
    events: eventCount?.length || 0,
    activities: activityCount?.length || 0,
    vehicles: vehicleCount?.length || 0,
    accommodations: accommodationCount?.length || 0,
    total: (restaurantCount?.length || 0) + 
           (eventCount?.length || 0) + 
           (activityCount?.length || 0) + 
           (vehicleCount?.length || 0) + 
           (accommodationCount?.length || 0),
    isLoading: restaurantCount === undefined || eventCount === undefined || 
               activityCount === undefined || vehicleCount === undefined || 
               accommodationCount === undefined,
  }), [
    restaurantCount,
    eventCount,
    activityCount,
    vehicleCount,
    accommodationCount,
  ]);
} 