import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Activity } from "@/lib/store/activitiesStore";
import type { Id } from "@/../convex/_generated/dataModel";

// Type for the activity data coming from Convex
export type ActivityFromConvex = {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  category: string;
  duration: string;
  maxParticipants: bigint;
  minParticipants: bigint;
  difficulty: string;
  rating: number;
  imageUrl: string;
  galleryImages: string[];
  highlights: string[];
  includes: string[];
  itineraries: string[];
  excludes: string[];
  additionalInfo: string[];
  cancelationPolicy: string[];
  isFeatured: boolean;
  isActive: boolean;
  partnerId: string;
};

// Convert from Convex activity to our frontend Activity type
export const mapConvexActivity = (activity: ActivityFromConvex): Activity => {
  return {
    id: activity._id,
    title: activity.title,
    description: activity.description,
    shortDescription: activity.shortDescription,
    price: activity.price,
    category: activity.category,
    duration: activity.duration,
    maxParticipants: Number(activity.maxParticipants),
    minParticipants: Number(activity.minParticipants),
    difficulty: activity.difficulty,
    rating: activity.rating,
    imageUrl: activity.imageUrl,
    galleryImages: activity.galleryImages,
    highlights: activity.highlights,
    includes: activity.includes,
    itineraries: activity.itineraries,
    excludes: activity.excludes,
    additionalInfo: activity.additionalInfo,
    cancelationPolicy: activity.cancelationPolicy,
    isFeatured: activity.isFeatured,
    isActive: activity.isActive,
    createdAt: new Date(activity._creationTime),
    updatedAt: new Date(activity._creationTime),
  };
};

// Convert from our frontend Activity type to Convex input
export const mapActivityToConvex = (activity: Activity, convexUserId: Id<"users">) => {
  return {
    title: activity.title,
    description: activity.description,
    shortDescription: activity.shortDescription,
    price: activity.price,
    category: activity.category,
    duration: activity.duration,
    maxParticipants: activity.maxParticipants,
    minParticipants: activity.minParticipants,
    difficulty: activity.difficulty,
    rating: activity.rating,
    imageUrl: activity.imageUrl,
    galleryImages: activity.galleryImages || [],
    highlights: activity.highlights || [],
    includes: activity.includes || [],
    itineraries: activity.itineraries || [],
    excludes: activity.excludes || [],
    additionalInfo: activity.additionalInfo || [],
    cancelationPolicy: activity.cancelationPolicy || [],
    isFeatured: activity.isFeatured,
    isActive: activity.isActive,
    partnerId: convexUserId,
  };
};

// Get Convex user ID from Clerk ID
export const useGetConvexUserId = () => {
  const getUserByClerkId = useMutation(api.auth.getUserByClerkId);
  
  return async (clerkId: string): Promise<Id<"users"> | null> => {
    try {
      const convexUserId = await getUserByClerkId({ clerkId });
      return convexUserId as Id<"users">;
    } catch (error) {
      console.error("Error getting Convex user ID:", error);
      return null;
    }
  };
};

// Hooks for accessing Convex API
export const useActivities = () => {
  const activities = useQuery(api.activities.getAll);
  
  return {
    activities: activities?.map(mapConvexActivity) || [],
    isLoading: activities === undefined,
  };
};

export const useFeaturedActivities = () => {
  const activities = useQuery(api.activities.getFeatured);
  
  return {
    activities: activities?.map(mapConvexActivity) || [],
    isLoading: activities === undefined,
  };
};

export const useCreateActivity = () => {
  const createMutation = useMutation(api.activities.create);
  const getUserByClerkId = useMutation(api.auth.getUserByClerkId);
  
  return async (activity: Activity, clerkId: string) => {
    try {
      // First get the Convex user ID from the Clerk ID
      const convexUserId = await getUserByClerkId({ clerkId });
      
      if (!convexUserId) {
        throw new Error("Could not find Convex user ID for the current user");
      }
      
      // Then create the activity with the proper Convex user ID
      const activityData = mapActivityToConvex(activity, convexUserId as Id<"users">);
      return await createMutation(activityData);
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  };
};

export const useUpdateActivity = () => {
  const updateMutation = useMutation(api.activities.update);
  
  return async (activity: Activity) => {
    const { id, ...data } = activity;
    // Convert id from string to Convex ID type
    const updateData = {
      id: id as Id<"activities">, // Convertendo para o tipo Id<"activities">
      ...mapActivityToConvex(activity, activity.partnerId as Id<"users"> || null),
    };
    
    return await updateMutation(updateData);
  };
};

export const useDeleteActivity = () => {
  const deleteMutation = useMutation(api.activities.remove);
  
  return async (id: string) => {
    return await deleteMutation({ id: id as Id<"activities"> });
  };
};

export const useToggleFeatured = () => {
  const toggleFeaturedMutation = useMutation(api.activities.toggleFeatured);
  
  return async (id: string, isFeatured: boolean) => {
    return await toggleFeaturedMutation({ id: id as Id<"activities">, isFeatured });
  };
};

export const useToggleActive = () => {
  const toggleActiveMutation = useMutation(api.activities.toggleActive);
  
  return async (id: string, isActive: boolean) => {
    return await toggleActiveMutation({ id: id as Id<"activities">, isActive });
  };
}; 