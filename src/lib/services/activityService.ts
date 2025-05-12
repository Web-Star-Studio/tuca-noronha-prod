import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import type { Activity } from "@/lib/store/activitiesStore";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

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
  partnerId: string; // Reference to the user who created the activity
  creator?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null; // Creator information when available
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
    partnerId: activity.partnerId, // Keep the reference to the creator
    creatorName: activity.creator?.name || 'Usuário', // Use creator name or default
    creatorEmail: activity.creator?.email,
    creatorImage: activity.creator?.image,
  };
};

// Convert from our frontend Activity type to Convex input
export const mapActivityToConvex = (activity: Activity, convexUserId: Id<"users"> | null) => {
  if (!convexUserId) {
    throw new Error("User ID is required to create or update an activity");
  }
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
  const activities = useQuery(api.activities.getActivitiesWithCreators);
  
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

// Get a single activity by ID for public display
export const usePublicActivity = (id: string | null) => {
  const idAsConvexId = id ? id as Id<"activities"> : null;
  const activity = useQuery(
    api.activities.getById, 
    idAsConvexId ? { id: idAsConvexId } : "skip"
  );
  
  return {
    activity: activity ? mapConvexActivity(activity) : null,
    isLoading: id ? activity === undefined : false,
  };
};

// Get all active activities for public display
export const usePublicActivities = () => {
  const activities = useQuery(api.activities.getActivitiesWithCreators);
  
  // Only return active activities for public display
  return {
    activities: activities?.filter(a => a.isActive).map(mapConvexActivity) || [],
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

// Get activities by the current user
export const useUserActivities = () => {
  const getUserByClerkId = useMutation(api.auth.getUserByClerkId);
  const { user } = useCurrentUser();
  
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // First get the Convex user ID from Clerk ID
  useEffect(() => {
    const getConvexId = async () => {
      if (!user?.id) return;
      
      try {
        const userId = await getUserByClerkId({ clerkId: user.id });
        if (userId) {
          setConvexUserId(userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error fetching Convex user ID:", error);
      }
    };
    
    getConvexId();
  }, [user?.id, getUserByClerkId]);
  
  // Then use the Convex user ID to fetch user activities
  const userActivities = useQuery(
    api.activities.getByUser, 
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  // Update activities when the query result changes
  useEffect(() => {
    if (userActivities) {
      setActivities(userActivities.map(mapConvexActivity));
      setIsLoading(false);
    }
  }, [userActivities]);
  
  return { activities, isLoading };
};