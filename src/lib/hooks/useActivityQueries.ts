import { useQuery } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { mapConvexActivity, type ActivityFromConvex } from "@/lib/services/activityService";
import { Id } from "@/../convex/_generated/dataModel";

// A wrapper hook that combines TanStack Query with Convex
export function useActivitiesQuery() {
  // Use Convex's own query hook directly
  const convexQuery = useConvexQuery(api.domains.activities.queries.getActivitiesWithCreators);
  
  // Then wrap it with TanStack Query for better cache management
  return useQuery({
    queryKey: ['activities'],
    queryFn: () => {
      if (!convexQuery) return [];
      return (convexQuery as ActivityFromConvex[]).map(mapConvexActivity);
    },
    // Only run the query when the Convex data is available
    enabled: convexQuery !== undefined,
  });
}

export function usePublicActivitiesQuery() {
  // Use Convex's own query hook directly
  const convexQuery = useConvexQuery(api.domains.activities.queries.getActivitiesWithCreators);
  
  // Then wrap it with TanStack Query for better cache management
  return useQuery({
    queryKey: ['publicActivities'],
    queryFn: () => {
      if (!convexQuery) return [];
      return (convexQuery as ActivityFromConvex[])
        .filter(activity => activity.isActive)
        .map(mapConvexActivity);
    },
    enabled: convexQuery !== undefined,
  });
}

export function useActivityQuery(id: string | null) {
  // Use Convex's own query hook directly, with skip if no ID
  const convexQuery = useConvexQuery(
    api.domains.activities.queries.getById, 
    id ? { id: id as Id<"activities"> } : "skip"
  );
  
  // Then wrap it with TanStack Query for better cache management
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => {
      if (!convexQuery) return null;
      return mapConvexActivity(convexQuery as ActivityFromConvex);
    },
    enabled: id !== null && convexQuery !== undefined,
  });
}

export function useFeaturedActivitiesQuery() {
  // Use Convex's own query hook directly
  const convexQuery = useConvexQuery(api.domains.activities.queries.getFeatured);
  
  // Then wrap it with TanStack Query for better cache management
  return useQuery({
    queryKey: ['featuredActivities'],
    queryFn: () => {
      if (!convexQuery) return [];
      return (convexQuery as ActivityFromConvex[]).map(mapConvexActivity);
    },
    enabled: convexQuery !== undefined,
  });
}
