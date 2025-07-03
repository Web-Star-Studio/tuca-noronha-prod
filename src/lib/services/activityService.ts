import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import type { Activity } from "@/lib/store/activitiesStore";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// Helper function to query tickets - this will get tickets for an activity
function queryTickets(id: string): Promise<ActivityTicket[]> {
  return new Promise((resolve) => {
    // This is just a placeholder implementation
    // In a real app, you'd fetch the tickets from your backend
    console.warn("Implement real ticket fetching for activities");
    resolve([]);
  });
}

// Type for ticket data coming from Convex
export type ActivityTicketFromConvex = {
  _id: string;
  _creationTime: number;
  activityId: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: bigint;
  maxPerOrder: bigint;
  type: string;
  benefits: string[];
  isActive: boolean;
};

// Our frontend ActivityTicket type
export type ActivityTicket = {
  id: string;
  activityId: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  maxPerOrder: number;
  type: string;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
};

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
  hasMultipleTickets?: boolean;
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
    hasMultipleTickets: activity.hasMultipleTickets || false,
    createdAt: new Date(activity._creationTime),
    updatedAt: new Date(activity._creationTime),
    partnerId: activity.partnerId, // Keep the reference to the creator
    creatorName: activity.creator?.name || 'Usuário', // Use creator name or default
    creatorEmail: activity.creator?.email,
    creatorImage: activity.creator?.image,
  };
};

// Convert from Convex ticket to our frontend ActivityTicket type
export const mapConvexTicket = (ticket: ActivityTicketFromConvex): ActivityTicket => {
  return {
    id: ticket._id,
    activityId: ticket.activityId,
    name: ticket.name,
    description: ticket.description,
    price: ticket.price,
    availableQuantity: Number(ticket.availableQuantity),
    maxPerOrder: Number(ticket.maxPerOrder),
    type: ticket.type,
    benefits: ticket.benefits,
    isActive: ticket.isActive,
    createdAt: new Date(ticket._creationTime),
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
    hasMultipleTickets: activity.hasMultipleTickets,
    partnerId: convexUserId,
  };
};

// Get Convex user ID from Clerk ID
export const useGetConvexUserId = () => {
  const getUserByClerkId = useMutation(api.domains.users.queries.getUserByClerkId);
  
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
  const activities = useQuery(api.domains.activities.queries.getAll);

  // Process activities to include ticket data for those with hasMultipleTickets
  const activitiesWithTickets = useMemo(() => {
    if (!activities) return [];
    
    // First map all activities to their frontend representation
    const mappedActivities = activities.map(mapConvexActivity);
    
    // Return processed activities with ticket information where needed
    return mappedActivities.map(activity => {
      if (activity.hasMultipleTickets) {
        // For activities with tickets, we need to add the tickets property
        // This will be populated when the activity is used in UI components
        return {
          ...activity,
          // Add a function to load tickets when needed
          _loadTickets: async () => {
            try {
              // Instead of directly calling the API, use the queryTickets utility
              const activityTickets = await queryTickets(activity.id);
              return activityTickets;
            } catch (error) {
              console.error("Error loading tickets for activity:", error);
              return [];
            }
          }
        };
      }
      return activity;
    });
  }, [activities]);
  
  return {
    activities: activitiesWithTickets || [],
    isLoading: activities === undefined,
  };
};

export const useFeaturedActivities = () => {
  const activities = useQuery(api.domains.activities.queries.getPublicFeaturedActivities);

  // Process activities to include ticket data for those with hasMultipleTickets
  const activitiesWithTickets = useMemo(() => {
    if (!activities) return [];
    
    // First map all activities to their frontend representation
    const mappedActivities = activities.map(mapConvexActivity);
    
    // Return processed activities with ticket information where needed
    return mappedActivities.map(activity => {
      if (activity.hasMultipleTickets) {
        // For activities with tickets, we need to add the tickets property
        // This will be populated when the activity is used in UI components
        return {
          ...activity,
          // Add a function to load tickets when needed
          _loadTickets: async () => {
            try {
              // Use the queryTickets utility
              const activityTickets = await queryTickets(activity.id);
              return activityTickets;
            } catch (error) {
              console.error("Error loading tickets for activity:", error);
              return [];
            }
          }
        };
      }
      return activity;
    });
  }, [activities]);
  
  return {
    activities: activitiesWithTickets || [],
    isLoading: activities === undefined,
  };
};

// For getting a single activity with creator info
export const usePublicActivity = (id: string | null) => {
  const activity = useQuery(
    api.domains.activities.queries.getPublicActivityById, 
    id ? { id: id as Id<"activities"> } : "skip"
  );
  
  const isLoading = id !== null && activity === undefined;
  
  return {
    activity: activity ? mapConvexActivity(activity as ActivityFromConvex) : null,
    isLoading,
  };
};

// Get all active activities for public display
export const usePublicActivities = () => {
  const activities = useQuery(api.domains.activities.queries.getPublicActivitiesWithCreators);
  
  // Process activities to include ticket data for those with hasMultipleTickets
  const activitiesWithTickets = useMemo(() => {
    if (!activities) return [];
    
    // First filter for active activities and map to frontend representation
    const mappedActivities = activities
      .filter(a => a.isActive)
      .map(mapConvexActivity);
    
    // Return processed activities with ticket information where needed
    return mappedActivities.map(activity => {
      if (activity.hasMultipleTickets) {
        // For activities with tickets, we need to add the tickets property
        // This will be populated when the activity is used in UI components
        return {
          ...activity,
          // Add a function to load tickets when needed
          _loadTickets: async () => {
            try {
              // Use the queryTickets utility
              const activityTickets = await queryTickets(activity.id);
              return activityTickets;
            } catch (error) {
              console.error("Error loading tickets for activity:", error);
              return [];
            }
          }
        };
      }
      return activity;
    });
  }, [activities]);
  
  return {
    activities: activitiesWithTickets || [],
    isLoading: activities === undefined,
  };
};

export const useCreateActivity = () => {
  const createActivityMutation = useMutation(api.domains.activities.mutations.create);
  const getCurrentUser = useCurrentUser();
  
  return async (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!getCurrentUser.user) {
      throw new Error("You must be logged in to create activities");
    }
    
    // Get the current Convex user ID
    const userInfo = getCurrentUser.user;
    
    // Ensure we have a valid Convex user ID
    if (!userInfo._id) {
      throw new Error("User has no Convex ID. Please try again later.");
    }
    
    // Map activity data to Convex input
    const convexData = mapActivityToConvex({
      ...activityData,
      id: '', // Will be generated by Convex
      createdAt: new Date(),
      updatedAt: new Date(),
    }, userInfo._id as Id<"users">);
    
    try {
      // Create the activity in Convex
      const activityId = await createActivityMutation(convexData);
      return activityId;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  };
};

export const useUpdateActivity = () => {
  const updateActivityMutation = useMutation(api.domains.activities.mutations.update);
  const getCurrentUser = useCurrentUser();
  
  return async (activityData: Activity) => {
    if (!getCurrentUser.user) {
      throw new Error("You must be logged in to update activities");
    }
    
    // Get the current Convex user ID
    const userInfo = getCurrentUser.user;
    
    // Ensure we have a valid Convex user ID
    if (!userInfo._id) {
      throw new Error("User has no Convex ID. Please try again later.");
    }
    
    try {
      // We need to exclude some fields that are not in the update input
      const { 
        id,
        createdAt,
        updatedAt,
        creatorName,
        creatorEmail,
        creatorImage,
        tickets,
        ...updateData
      } = activityData;
      
      // Update the activity in Convex
      const result = await updateActivityMutation({
        id: id as Id<"activities">,
        ...updateData,
        // Convert numbers to bigints as expected by the backend
        maxParticipants: updateData.maxParticipants,
        minParticipants: updateData.minParticipants,
      });
      
      return result;
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  };
};

export const useDeleteActivity = () => {
  const deleteActivityMutation = useMutation(api.domains.activities.mutations.remove);
  
  return async (id: string) => {
    return await deleteActivityMutation({ id: id as Id<"activities"> });
  };
};

export const useToggleFeatured = () => {
  const toggleFeaturedMutation = useMutation(api.domains.activities.mutations.toggleFeatured);
  
  return async (id: string, isFeatured: boolean) => {
    return await toggleFeaturedMutation({ id: id as Id<"activities">, isFeatured });
  };
};

export const useToggleActive = () => {
  const toggleActiveMutation = useMutation(api.domains.activities.mutations.toggleActive);
  
  return async (id: string, isActive: boolean) => {
    return await toggleActiveMutation({ id: id as Id<"activities">, isActive });
  };
};

export const useUserActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useCurrentUser();
  
  useEffect(() => {
    const getConvexId = async () => {
      if (!user || !user._id) return;
      
      const updateUserActivities = async () => {
        try {
          const userId = user._id as Id<"users">;
          
          // Query activities by partner ID
          const activities = await api.domains.activities.queries.getByPartnerId({ partnerId: userId });
          
          // Map activities to frontend format
          setActivities(activities.map(mapConvexActivity));
        } catch (error) {
          console.error("Error fetching user activities:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      updateUserActivities();
    };
    
    getConvexId();
    
    if (!user) {
      setIsLoading(false);
    }
  }, [user]);
  
  return { activities, isLoading };
};

// Helper for getting tickets for an activity
export const useActivityTickets = (activityId: string | null) => {
  const tickets = useQuery(
    api.domains.activities.queries.getTicketsByActivity,
    activityId ? { activityId: activityId as Id<"activities"> } : "skip"
  );
  
  return {
    tickets: tickets?.map(mapConvexTicket) || [],
    isLoading: activityId !== null && tickets === undefined,
  };
};

// Helper for getting active tickets for an activity
export const useActiveActivityTickets = (activityId: string | null) => {
  const tickets = useQuery(
    api.domains.activities.queries.getActiveTicketsByActivity,
    activityId ? { activityId: activityId as Id<"activities"> } : "skip"
  );
  
  return {
    tickets: tickets?.map(mapConvexTicket) || [],
    isLoading: activityId !== null && tickets === undefined,
  };
};

export const useCreateActivityTicket = () => {
  const createTicketMutation = useMutation(api.domains.activities.mutations.createTicket);
  
  return async (ticketData: Omit<ActivityTicket, 'id' | 'createdAt'>) => {
    // Convert number fields to bigint for Convex
    const convexData = {
      ...ticketData,
      availableQuantity: ticketData.availableQuantity,
      maxPerOrder: ticketData.maxPerOrder,
    };
    
    try {
      const ticketId = await createTicketMutation(convexData as any);
      return ticketId;
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  };
};

export const useUpdateActivityTicket = () => {
  const updateTicketMutation = useMutation(api.domains.activities.mutations.updateTicket);
  
  return async (ticketData: ActivityTicket) => {
    const { id, createdAt, ...updateData } = ticketData;
    
    return await updateTicketMutation({
      id: id as Id<"activityTickets">,
      ...updateData,
    } as any);
  };
};

export const useDeleteActivityTicket = () => {
  const deleteTicketMutation = useMutation(api.domains.activities.mutations.removeTicket);
  
  return async (id: string) => {
    return await deleteTicketMutation({ id: id as Id<"activityTickets"> });
  };
};
