import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import type { Activity } from "@/lib/store/activitiesStore";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// Helper function to query tickets - this will get tickets for an activity
// You should replace this with actual API calls to your backend or 
// implement an HTTP endpoint in Convex
/*
const queryTickets = async (activityId: string) => {
  // This is a mock implementation that would normally call your backend
  // For a real implementation, you would:
  // 1. Create an HTTP endpoint in Convex
  // 2. Call that endpoint from here
  // 3. Return the processed results
  try {
    // In a real app, you would do something like:
    // const response = await fetch(`/api/tickets?activityId=${activityId}`);
    // const tickets = await response.json();
    
    // For now, as a fallback, return an empty array
    // You need to implement a real solution based on your app's architecture
    console.warn("queryTickets is a mock implementation. Replace with real API call");
    return [];
  } catch (error) {
    console.error("Error querying tickets:", error);
    return [];
  }
};
*/

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
  const activities = useQuery(api.activities.getFeatured);

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

// Get a single activity by ID for public display
export const usePublicActivity = (id: string | null) => {
  // Convert ID to Convex ID
  const idAsConvexId = id ? id as Id<"activities"> : null;
  
  // Query for the activity
  const activity = useQuery(
    api.activities.getById, 
    idAsConvexId ? { id: idAsConvexId } : "skip"
  );
  
  // Get tickets if the activity has multiple tickets
  const activityObj = activity ? mapConvexActivity(activity as ActivityFromConvex) : null;
  const hasMultipleTickets = activityObj?.hasMultipleTickets;
  
  // Only fetch tickets if the activity exists and has multiple tickets
  const { tickets, isLoading: isLoadingTickets } = useActiveActivityTickets(
    (activityObj && hasMultipleTickets) ? activityObj.id : null
  );
  
  // Add tickets to the activity object
  const activityWithTickets = activityObj && {
    ...activityObj,
    tickets: hasMultipleTickets ? tickets : undefined
  };
  
  return {
    activity: activityWithTickets,
    isLoading: (id ? activity === undefined : false) || (hasMultipleTickets && isLoadingTickets),
  };
};

// Get all active activities for public display
export const usePublicActivities = () => {
  const activities = useQuery(api.activities.getActivitiesWithCreators);
  
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
  const createMutation = useMutation(api.activities.create);
  const createTicketMutation = useMutation(api.activities.createActivityTicket);
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
      const activityId = await createMutation(activityData);
      
      // If the activity has multiple tickets, create them
      if (activity.hasMultipleTickets && activity.tickets && activity.tickets.length > 0) {
        // Create each ticket
        for (const ticket of activity.tickets) {
          await createTicketMutation({
            activityId: activityId as Id<"activities">,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            availableQuantity: ticket.availableQuantity,
            maxPerOrder: ticket.maxPerOrder,
            type: ticket.type,
            benefits: ticket.benefits,
            isActive: ticket.isActive
          });
        }
      }
      
      return activityId;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  };
};

export const useUpdateActivity = () => {
  const updateMutation = useMutation(api.activities.update);
  const createTicketMutation = useMutation(api.activities.createActivityTicket);
  const updateTicketMutation = useMutation(api.activities.updateActivityTicket);
  const deleteTicketMutation = useMutation(api.activities.removeActivityTicket);
  
  return async (activity: Activity) => {
    try {
      const { id } = activity;
      
      // Convert id from string to Convex ID type
      const updateData = {
        id: id as Id<"activities">,
        ...mapActivityToConvex(activity, activity.partnerId as Id<"users"> || null),
      };
      
      // Update the activity information
      await updateMutation(updateData);
      
      // Handle tickets if multiple tickets is enabled
      if (activity.hasMultipleTickets && activity.tickets && activity.tickets.length > 0) {
        // First, fetch existing tickets for this activity
        // Implementation note: not using useConvex here as it can't be called in callbacks
        // This is a placeholder for the current implementation
        // In a production app, we'd need to restructure this to avoid using hooks in callbacks
        const existingTicketsData: Array<Record<string, unknown>> = [];
        
        const existingTickets = existingTicketsData || [];
        
        if (existingTickets && existingTickets.length > 0) {
          // Create a map of existing ticket IDs
          const existingTicketIds = new Map(existingTickets.map(ticket => [ticket._id.toString(), ticket._id]));
          
          // Create a map of current ticket IDs - store strings for comparison
          const currentTicketIds = new Set(activity.tickets.map(ticket => ticket.id.toString()));
          
          // Update or create tickets
          for (const ticket of activity.tickets) {
            const ticketIdStr = ticket.id.toString();
            if (existingTicketIds.has(ticketIdStr)) {
              // Update existing ticket
              await updateTicketMutation({
                id: existingTicketIds.get(ticketIdStr) as Id<"activityTickets">,
                name: ticket.name,
                description: ticket.description,
                price: ticket.price,
                availableQuantity: ticket.availableQuantity,
                maxPerOrder: ticket.maxPerOrder,
                type: ticket.type,
                benefits: ticket.benefits,
                isActive: ticket.isActive
              });
            } else {
              // Create new ticket
              await createTicketMutation({
                activityId: id as Id<"activities">,
                name: ticket.name,
                description: ticket.description,
                price: ticket.price,
                availableQuantity: ticket.availableQuantity,
                maxPerOrder: ticket.maxPerOrder,
                type: ticket.type,
                benefits: ticket.benefits,
                isActive: ticket.isActive
              });
            }
          }
          
          // Delete tickets that no longer exist
          for (const existingTicket of existingTickets) {
            if (!currentTicketIds.has(existingTicket._id.toString())) {
              await deleteTicketMutation({ id: existingTicket._id as Id<"activityTickets"> });
            }
          }
        } else {
          // If no existing tickets, create all
          for (const ticket of activity.tickets) {
            await createTicketMutation({
              activityId: id as Id<"activities">,
              name: ticket.name,
              description: ticket.description,
              price: ticket.price,
              availableQuantity: ticket.availableQuantity,
              maxPerOrder: ticket.maxPerOrder,
              type: ticket.type,
              benefits: ticket.benefits,
              isActive: ticket.isActive
            });
          }
        }
      }
      
      return id;
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
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
    const updateUserActivities = async () => {
      if (!userActivities) return;
      
      // Map the activities to their frontend representation
      const mappedActivities = userActivities.map(mapConvexActivity);
      
      // Process activities to add the _loadTickets function
      const processedActivities = mappedActivities.map(activity => {
        if (activity.hasMultipleTickets) {
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
      
      setActivities(processedActivities);
      setIsLoading(false);
    };
    
    updateUserActivities();
  }, [userActivities]);
  
  return { activities, isLoading };
};

// Get all tickets for an activity
export const useActivityTickets = (activityId: string | null) => {
  const idAsConvexId = activityId ? activityId as Id<"activities"> : null;
  
  const ticketsData = useQuery(
    api.activities.getActivityTickets, 
    idAsConvexId ? { activityId: idAsConvexId } : "skip"
  );
  
  return {
    tickets: ticketsData?.map(mapConvexTicket) || [],
    isLoading: activityId ? ticketsData === undefined : false,
  };
};

// Get active tickets for an activity
export const useActiveActivityTickets = (activityId: string | null) => {
  const idAsConvexId = activityId ? activityId as Id<"activities"> : null;
  
  const ticketsData = useQuery(
    api.activities.getActiveActivityTickets, 
    idAsConvexId ? { activityId: idAsConvexId } : "skip"
  );
  
  return {
    tickets: ticketsData?.map(mapConvexTicket) || [],
    isLoading: activityId ? ticketsData === undefined : false,
  };
};

// Create a new ticket for an activity
export const useCreateActivityTicket = () => {
  const createMutation = useMutation(api.activities.createActivityTicket);
  
  return async (ticket: Omit<ActivityTicket, "id" | "createdAt">) => {
    return await createMutation({
      activityId: ticket.activityId as Id<"activities">,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      availableQuantity: ticket.availableQuantity,
      maxPerOrder: ticket.maxPerOrder,
      type: ticket.type,
      benefits: ticket.benefits,
      isActive: ticket.isActive
    });
  };
};

// Update an existing ticket
export const useUpdateActivityTicket = () => {
  const updateMutation = useMutation(api.activities.updateActivityTicket);
  
  return async (ticketId: string, updates: Partial<Omit<ActivityTicket, "id" | "activityId" | "createdAt">>) => {
    return await updateMutation({
      id: ticketId as Id<"activityTickets">,
      ...updates
    });
  };
};

// Delete a ticket
export const useDeleteActivityTicket = () => {
  const deleteMutation = useMutation(api.activities.removeActivityTicket);
  
  return async (ticketId: string) => {
    return await deleteMutation({ id: ticketId as Id<"activityTickets"> });
  };
};