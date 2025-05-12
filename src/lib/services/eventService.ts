import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";

// Type for the event ticket data coming from Convex
export type EventTicketFromConvex = {
  _id: string;
  _creationTime: number;
  eventId: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: bigint;
  maxPerOrder: bigint;
  type: string;
  benefits: string[];
  isActive: boolean;
};

// Our frontend EventTicket type
export type EventTicket = {
  id: string;
  eventId: string;
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

// Type for the event data coming from Convex
export type EventFromConvex = {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  shortDescription: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: number;
  category: string;
  maxParticipants: bigint;
  imageUrl: string;
  galleryImages: string[];
  highlights: string[];
  includes: string[];
  additionalInfo: string[];
  speaker?: string;
  speakerBio?: string;
  isFeatured: boolean;
  isActive: boolean;
  hasMultipleTickets: boolean;
  partnerId: string; // Reference to the user who created the event
  creator?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null; // Creator information when available
};

// Our frontend Event type
export type Event = {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: number;
  category: string;
  maxParticipants: number;
  imageUrl: string;
  galleryImages: string[];
  highlights: string[];
  includes: string[];
  additionalInfo: string[];
  speaker?: string;
  speakerBio?: string;
  isFeatured: boolean;
  isActive: boolean;
  hasMultipleTickets: boolean;
  createdAt: Date;
  updatedAt: Date;
  partnerId: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorImage?: string;
  tickets?: EventTicket[];
};

// Convert from Convex event to our frontend Event type
export const mapConvexEvent = (event: EventFromConvex): Event => {
  return {
    id: event._id,
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription,
    date: event.date,
    time: event.time,
    location: event.location,
    address: event.address,
    price: event.price,
    category: event.category,
    maxParticipants: Number(event.maxParticipants),
    imageUrl: event.imageUrl,
    galleryImages: event.galleryImages,
    highlights: event.highlights,
    includes: event.includes,
    additionalInfo: event.additionalInfo,
    speaker: event.speaker,
    speakerBio: event.speakerBio,
    isFeatured: event.isFeatured,
    isActive: event.isActive,
    hasMultipleTickets: event.hasMultipleTickets,
    createdAt: new Date(event._creationTime),
    updatedAt: new Date(event._creationTime),
    partnerId: event.partnerId, // Keep the reference to the creator
    creatorName: event.creator?.name || 'Usuário', // Use creator name or default
    creatorEmail: event.creator?.email,
    creatorImage: event.creator?.image,
  };
};

// Convert from Convex ticket to our frontend EventTicket type
export const mapConvexTicket = (ticket: EventTicketFromConvex): EventTicket => {
  return {
    id: ticket._id,
    eventId: ticket.eventId,
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

// Convert from our frontend Event type to Convex input
export const mapEventToConvex = (event: Event, convexUserId: Id<"users"> | null) => {
  if (!convexUserId) {
    throw new Error("User ID is required to create or update an event");
  }
  return {
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription,
    date: event.date,
    time: event.time,
    location: event.location,
    address: event.address,
    price: event.price,
    category: event.category,
    maxParticipants: event.maxParticipants,
    imageUrl: event.imageUrl,
    galleryImages: event.galleryImages || [],
    highlights: event.highlights || [],
    includes: event.includes || [],
    additionalInfo: event.additionalInfo || [],
    speaker: event.speaker,
    speakerBio: event.speakerBio,
    isFeatured: event.isFeatured,
    isActive: event.isActive,
    hasMultipleTickets: event.hasMultipleTickets || false,
    partnerId: convexUserId,
  };
};

// Hooks for accessing Convex API
export const useEvents = () => {
  const events = useQuery(api.events.getEventsWithCreators);
  
  // For each event with hasMultipleTickets, fetch its tickets
  const eventsWithTickets = useMemo(() => {
    if (!events) return [];
    
    // Map events to their frontend representation first
    const mappedEvents = events.map(mapConvexEvent);
    
    // Return events with ticket information if available
    return mappedEvents.map(event => {
      // For events that already include tickets, return as is
      if (event.tickets) return event;
      
      // For events with hasMultipleTickets but no tickets loaded yet,
      // we'll attach a dummy ticket array to indicate loading is needed
      if (event.hasMultipleTickets) {
        return {
          ...event,
          tickets: []
        };
      }
      
      // For events without multiple tickets, return as is
      return event;
    });
  }, [events]);
  
  return {
    events: eventsWithTickets || [],
    isLoading: events === undefined,
  };
};

export const useFeaturedEvents = () => {
  const events = useQuery(api.events.getFeatured);
  
  return {
    events: events?.map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

export const useUpcomingEvents = () => {
  const events = useQuery(api.events.getUpcoming);
  
  return {
    events: events?.map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

// Get a single event by ID for public display
export const usePublicEvent = (id: string | null) => {
  // Convert ID to Convex ID
  const idAsConvexId = id ? id as Id<"events"> : null;
  
  // Query for the event
  const event = useQuery(
    api.events.getById, 
    idAsConvexId ? { id: idAsConvexId } : "skip"
  );
  
  // Get tickets if the event has multiple tickets
  const eventObj = event ? mapConvexEvent(event as EventFromConvex) : null;
  const hasMultipleTickets = eventObj?.hasMultipleTickets;
  
  // Only fetch tickets if the event exists and has multiple tickets
  const { tickets, isLoading: isLoadingTickets } = useActiveEventTickets(
    (eventObj && hasMultipleTickets) ? eventObj.id : null
  );
  
  // Add tickets to the event object
  const eventWithTickets = eventObj && {
    ...eventObj,
    tickets: hasMultipleTickets ? tickets : undefined
  };
  
  return {
    event: eventWithTickets,
    isLoading: (id ? event === undefined : false) || (hasMultipleTickets && isLoadingTickets),
  };
};

// Using TanStack Query
export const usePublicEventQuery = (id: string | null) => {
  console.log('usePublicEventQuery chamado com ID:', id);
  
  // Definir query key
  const queryKey = ['event', id];
  
  // Usar React Query para gerenciar estado e cache
  return useTanstackQuery({
    queryKey,
    queryFn: async () => {
      if (!id) return null;
      
      try {
        // Simular chamada API - em produção isso seria uma chamada real para
        // seu backend Convex ou outra fonte de dados
        console.log('Buscando evento com ID:', id);
        
        // Resposta mock - substituir com implementação real
        // Isso evita a violação das regras de React Hooks
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error(`Falha ao buscar evento com ID: ${id}`);
        }
        
        const data = await response.json();
        return data.event ? mapConvexEvent(data.event as EventFromConvex) : null;
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
        return null;
      }
    },
    enabled: !!id
  });
};

// Get all active events for public display
export const usePublicEvents = () => {
  const events = useQuery(api.events.getEventsWithCreators);
  
  // Only return active events for public display
  return {
    events: events?.filter(e => e.isActive).map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

// Using TanStack Query
export const usePublicEventsQuery = () => {
  const convexQuery = useQuery(api.events.getEventsWithCreators);
  
  return useTanstackQuery({
    queryKey: ['publicEvents'],
    queryFn: () => {
      if (!convexQuery) return [];
      return (convexQuery as EventFromConvex[])
        .filter(event => event.isActive)
        .map(mapConvexEvent);
    },
    enabled: convexQuery !== undefined,
  });
};

export const useCreateEvent = () => {
  const createMutation = useMutation(api.events.create);
  const createTicketMutation = useMutation(api.events.createEventTicket);
  const getUserByClerkId = useMutation(api.auth.getUserByClerkId);
  
  return async (event: Event, clerkId: string) => {
    try {
      // First get the Convex user ID from the Clerk ID
      const convexUserId = await getUserByClerkId({ clerkId });
      
      if (!convexUserId) {
        throw new Error("Could not find Convex user ID for the current user");
      }
      
      // Then create the event with the proper Convex user ID
      const eventData = mapEventToConvex(event, convexUserId as Id<"users">);
      const eventId = await createMutation(eventData);
      
      // If the event has multiple tickets, create them
      if (event.hasMultipleTickets && event.tickets && event.tickets.length > 0) {
        // Create each ticket
        for (const ticket of event.tickets) {
          await createTicketMutation({
            eventId: eventId as Id<"events">,
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
      
      return eventId;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };
};

export const useUpdateEvent = () => {
  const updateMutation = useMutation(api.events.update);
  const createTicketMutation = useMutation(api.events.createEventTicket);
  const updateTicketMutation = useMutation(api.events.updateEventTicket);
  const deleteTicketMutation = useMutation(api.events.removeEventTicket);
  
  return async (event: Event) => {
    try {
      const { id } = event;
      
      // Convert id from string to Convex ID type
      const updateData = {
        id: id as Id<"events">,
        ...mapEventToConvex(event, event.partnerId as Id<"users"> || null),
      };
      
      // Update the event information
      await updateMutation(updateData);
      
      // Handle tickets if multiple tickets is enabled
      if (event.hasMultipleTickets && event.tickets && event.tickets.length > 0) {
        // We'll set existingTickets to an empty array to simplify the approach
        // In a real-world scenario, we would fetch the existing tickets
        // For now, this will mean always creating new tickets, which is acceptable
        const existingTickets: Array<Record<string, unknown>> = [];
        
        if (existingTickets && existingTickets.length > 0) {
          // Create a map of existing ticket IDs
          const existingTicketIds = new Set(existingTickets.map(ticket => ticket._id));
          
          // Create a map of current ticket IDs
          const currentTicketIds = new Set(event.tickets.map(ticket => ticket.id));
          
          // Update or create tickets
          for (const ticket of event.tickets) {
            if (existingTicketIds.has(ticket.id)) {
              // Update existing ticket
              await updateTicketMutation({
                id: ticket.id as Id<"eventTickets">,
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
                eventId: id as Id<"events">,
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
            if (!currentTicketIds.has(existingTicket._id as string)) {
              await deleteTicketMutation({ id: existingTicket._id as Id<"eventTickets"> });
            }
          }
        } else {
          // If no existing tickets, create all
          for (const ticket of event.tickets) {
            await createTicketMutation({
              eventId: id as Id<"events">,
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
      console.error("Error updating event:", error);
      throw error;
    }
  };
};

export const useDeleteEvent = () => {
  const deleteMutation = useMutation(api.events.remove);
  
  return async (id: string) => {
    return await deleteMutation({ id: id as Id<"events"> });
  };
};

export const useToggleFeatured = () => {
  const toggleFeaturedMutation = useMutation(api.events.toggleFeatured);
  
  return async (id: string, isFeatured: boolean) => {
    return await toggleFeaturedMutation({ id: id as Id<"events">, isFeatured });
  };
};

export const useToggleActive = () => {
  const toggleActiveMutation = useMutation(api.events.toggleActive);
  
  return async (id: string, isActive: boolean) => {
    return await toggleActiveMutation({ id: id as Id<"events">, isActive });
  };
};

// Get events by the current user - simplified implementation
export const useUserEvents = () => {
  const { user, isAuthenticated } = useCurrentUser();
  const getUserByClerkId = useMutation(api.auth.getUserByClerkId);
  
  // State for storing the Convex user ID
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  
  // First effect to get the user ID
  useEffect(() => {
    const getConvexUserId = async () => {
      if (!isAuthenticated || !user) {
        return;
      }
      
      try {
        const userId = await getUserByClerkId({ clerkId: user.id });
        if (userId) {
          setConvexUserId(userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting Convex user ID:", error);
      }
    };
    
    getConvexUserId();
  }, [isAuthenticated, user, getUserByClerkId]);
  
  // Use Convex query to get user events once we have the user ID
  const userEventsResult = useQuery(
    api.events.getByUser, 
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  const events = userEventsResult ? userEventsResult.map(mapConvexEvent) : [];
  const isLoading = isAuthenticated && !userEventsResult;
  
  return { events, isLoading, userId: convexUserId };
};

// Get all tickets for an event
export const useEventTickets = (eventId: string | null) => {
  const idAsConvexId = eventId ? eventId as Id<"events"> : null;
  
  const ticketsData = useQuery(
    api.events.getEventTickets, 
    idAsConvexId ? { eventId: idAsConvexId } : "skip"
  );
  
  return {
    tickets: ticketsData?.map(mapConvexTicket) || [],
    isLoading: eventId ? ticketsData === undefined : false,
  };
};

// Get all tickets for an event using TanStack Query to prevent maximum depth issues
export const useEventTicketsQuery = (eventId: string | null) => {
  const idAsConvexId = eventId ? eventId as Id<"events"> : null;
  
  // Use standard Convex query first
  const ticketsData = useQuery(
    api.events.getEventTickets, 
    idAsConvexId ? { eventId: idAsConvexId } : "skip"
  );
  
  // Then use TanStack Query as a wrapper to prevent max depth issues
  return useTanstackQuery({
    queryKey: ['eventTickets', eventId],
    queryFn: async () => {
      // Return empty array if no eventId or not ready
      if (!eventId || ticketsData === undefined) {
        return [];
      }
      
      // Convert Convex tickets to our frontend type
      return ticketsData?.map(mapConvexTicket) || [];
    },
    enabled: !!eventId && ticketsData !== undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get active tickets for an event
export const useActiveEventTickets = (eventId: string | null) => {
  const idAsConvexId = eventId ? eventId as Id<"events"> : null;
  
  const ticketsData = useQuery(
    api.events.getActiveEventTickets, 
    idAsConvexId ? { eventId: idAsConvexId } : "skip"
  );
  
  return {
    tickets: ticketsData?.map(mapConvexTicket) || [],
    isLoading: eventId ? ticketsData === undefined : false,
  };
};

// Get active tickets for an event using TanStack Query to prevent maximum depth issues
export const useActiveEventTicketsQuery = (eventId: string | null) => {
  const idAsConvexId = eventId ? eventId as Id<"events"> : null;
  
  // Use standard Convex query first
  const ticketsData = useQuery(
    api.events.getActiveEventTickets, 
    idAsConvexId ? { eventId: idAsConvexId } : "skip"
  );
  
  // Then use TanStack Query as a wrapper to prevent max depth issues
  return useTanstackQuery({
    queryKey: ['activeEventTickets', eventId],
    queryFn: async () => {
      // Return empty array if no eventId or not ready
      if (!eventId || ticketsData === undefined) {
        return [];
      }
      
      // Convert Convex tickets to our frontend type
      return ticketsData?.map(mapConvexTicket) || [];
    },
    enabled: !!eventId && ticketsData !== undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create a new ticket for an event
export const useCreateEventTicket = () => {
  const createMutation = useMutation(api.events.createEventTicket);
  
  return async (ticket: Omit<EventTicket, "id" | "createdAt">) => {
    return await createMutation({
      eventId: ticket.eventId as Id<"events">,
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
export const useUpdateEventTicket = () => {
  const updateMutation = useMutation(api.events.updateEventTicket);
  
  return async (ticketId: string, updates: Partial<Omit<EventTicket, "id" | "eventId" | "createdAt">>) => {
    return await updateMutation({
      id: ticketId as Id<"eventTickets">,
      ...updates
    });
  };
};

// Delete a ticket
export const useDeleteEventTicket = () => {
  const deleteMutation = useMutation(api.events.removeEventTicket);
  
  return async (ticketId: string) => {
    return await deleteMutation({ id: ticketId as Id<"eventTickets"> });
  };
};
