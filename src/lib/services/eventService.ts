import { api } from "../../../convex/_generated/api";
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
  symplaUrl?: string; // Link para o evento no Sympla
  symplaId?: string; // ID do evento no Sympla
  symplaHost?: {
    name: string;
    description: string;
  }; // Informações do organizador do evento no Sympla
  sympla_private_event?: boolean; // Se o evento é privado no Sympla
  sympla_published?: boolean; // Se o evento está publicado no Sympla
  sympla_cancelled?: boolean; // Se o evento foi cancelado no Sympla
  external_id?: string; // ID externo do evento (reference_id do Sympla)
  sympla_categories?: {
    primary?: string;
    secondary?: string;
  }; // Categorias do evento no Sympla
  whatsappContact?: string; // Contato de WhatsApp para reservas
  acceptsOnlinePayment?: boolean;
  requiresUpfrontPayment?: boolean;
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
  symplaUrl?: string; // Link para o evento no Sympla
  symplaId?: string; // ID do evento no Sympla
  symplaHost?: {
    name: string;
    description: string;
  }; // Informações do organizador do evento no Sympla
  sympla_private_event?: boolean; // Se o evento é privado no Sympla
  sympla_published?: boolean; // Se o evento está publicado no Sympla
  sympla_cancelled?: boolean; // Se o evento foi cancelado no Sympla
  external_id?: string; // ID externo do evento (reference_id do Sympla)
  sympla_categories?: {
    primary?: string;
    secondary?: string;
  }; // Categorias do evento no Sympla
  whatsappContact?: string; // Contato de WhatsApp para reservas
  acceptsOnlinePayment?: boolean;
  requiresUpfrontPayment?: boolean;
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
    symplaUrl: event.symplaUrl,
    symplaId: event.symplaId,
    symplaHost: event.symplaHost,
    sympla_private_event: event.sympla_private_event,
    sympla_published: event.sympla_published,
    sympla_cancelled: event.sympla_cancelled,
    external_id: event.external_id,
    sympla_categories: event.sympla_categories,
    whatsappContact: event.whatsappContact,
    acceptsOnlinePayment: event.acceptsOnlinePayment,
    requiresUpfrontPayment: event.requiresUpfrontPayment,
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
    symplaUrl: event.symplaUrl,
    symplaId: event.symplaId,
    symplaHost: event.symplaHost,
    sympla_private_event: event.sympla_private_event,
    sympla_published: event.sympla_published,
    sympla_cancelled: event.sympla_cancelled,
    external_id: event.external_id,
    sympla_categories: event.sympla_categories,
    whatsappContact: event.whatsappContact,
  };
};

// Hooks for accessing Convex API
export const useEvents = () => {
  const events = useQuery(api.domains.events.queries.getPublicEventsWithCreators);
  
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
    events: eventsWithTickets,
    isLoading: events === undefined,
  };
};

// Admin access to all events regardless of state
export const useAdminEvents = () => {
  const events = useQuery(api.domains.events.queries.getAll);
  
  return {
    events: events?.map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

export const useFeaturedEvents = () => {
  const events = useQuery(api.domains.events.queries.getFeaturedEvents);
  
  return {
    events: events?.map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

export const useUpcomingEvents = () => {
  const events = useQuery(api.domains.events.queries.getUpcoming);
  
  return {
    events: events?.map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

// For getting a single event with creator info
export const usePublicEvent = (id: string | null) => {
  const event = useQuery(
    api.domains.events.queries.getById, 
    id ? { id: id as Id<"events"> } : "skip"
  );
  
  const isLoading = id !== null && event === undefined;
  
  return {
    event: event ? mapConvexEvent(event as EventFromConvex) : null,
    isLoading,
  };
};

// TanStack Query version for better caching
export const usePublicEventQuery = (id: string | null) => {
  const eventQuery = useQuery(
    api.domains.events.queries.getById,
    id ? { id: id as Id<"events"> } : "skip"
  );
  
  // Then wrap it with TanStack Query for better cache management
  return useTanstackQuery({
    queryKey: ['event', id],
    queryFn: () => {
      if (!eventQuery) return null;
      return mapConvexEvent(eventQuery as EventFromConvex);
    },
    enabled: id !== null && eventQuery !== undefined,
  });
};

// Get all active events for public display
export const usePublicEvents = () => {
  const events = useQuery(api.domains.events.queries.getPublicEventsWithCreators);
  
  // Only return active events for public display
  return {
    events: events?.filter(e => e.isActive).map(mapConvexEvent) || [],
    isLoading: events === undefined,
  };
};

// TanStack Query version for better caching
export const usePublicEventsQuery = () => {
  const events = useQuery(api.domains.events.queries.getPublicEventsWithCreators);
  
  return useTanstackQuery({
    queryKey: ['public-events'],
    queryFn: () => {
      if (!events) return [];
      return events.filter(e => e.isActive).map(mapConvexEvent);
    },
    enabled: events !== undefined,
  });
};

export const useCreateEvent = () => {
  const createEventMutation = useMutation(api.domains.events.mutations.create);
  const getCurrentUser = useCurrentUser();
  
  return async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!getCurrentUser.user) {
      throw new Error("You must be logged in to create events");
    }
    
    // Get the current Convex user ID
    const userInfo = getCurrentUser.user;
    
    // Ensure we have a valid Convex user ID
    if (!userInfo._id) {
      throw new Error("User has no Convex ID. Please try again later.");
    }
    
    // Map event data to Convex input
    const convexData = mapEventToConvex({
      ...eventData,
      id: '', // Will be generated by Convex
      createdAt: new Date(),
      updatedAt: new Date(),
    }, userInfo._id as Id<"users">);
    
    try {
      // Create the event in Convex
      const eventId = await createEventMutation(convexData);
      return eventId;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };
};

export const useUpdateEvent = () => {
  const updateEventMutation = useMutation(api.domains.events.mutations.update);
  const getCurrentUser = useCurrentUser();
  
  return async (eventData: Event) => {
    if (!getCurrentUser.user) {
      throw new Error("You must be logged in to update events");
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
      } = eventData;
      
      // Update the event in Convex
      const result = await updateEventMutation({
        id: id as Id<"events">,
        ...updateData,
        // Convert numbers to bigints as expected by the backend
        maxParticipants: updateData.maxParticipants,
      });
      
      return result;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  };
};

export const useDeleteEvent = () => {
  const deleteEventMutation = useMutation(api.domains.events.mutations.remove);
  
  return async (id: string) => {
    return await deleteEventMutation({ id: id as Id<"events"> });
  };
};

export const useToggleFeatured = () => {
  const toggleFeaturedMutation = useMutation(api.domains.events.mutations.toggleFeatured);
  
  return async (id: string, isFeatured: boolean) => {
    return await toggleFeaturedMutation({ id: id as Id<"events">, isFeatured });
  };
};

export const useToggleActive = () => {
  const toggleActiveMutation = useMutation(api.domains.events.mutations.toggleActive);
  
  return async (id: string, isActive: boolean) => {
    return await toggleActiveMutation({ id: id as Id<"events">, isActive });
  };
};

export const useUserEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useCurrentUser();
  
  useEffect(() => {
    const getConvexUserId = async () => {
      if (!user || !user._id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const convexUserId = user._id as Id<"users">;
        
        // Query events for this user
        const userEventsQuery = api.domains.events.queries.getEventsForAdmin;
        const userEvents = await userEventsQuery({});
        
        // Map to frontend events
        const mappedEvents = userEvents.map(mapConvexEvent);
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching user events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getConvexUserId();
  }, [user]);
  
  return { events, isLoading };
};

// Helper for getting tickets for an event
export const useEventTickets = (eventId: string | null) => {
  const tickets = useQuery(
    api.domains.events.queries.getTicketsByEvent,
    eventId ? { eventId: eventId as Id<"events"> } : "skip"
  );
  
  return {
    tickets: tickets?.map(mapConvexTicket) || [],
    isLoading: eventId !== null && tickets === undefined,
  };
};

// TanStack Query version
export const useEventTicketsQuery = (eventId: string | null) => {
  const ticketsQuery = useQuery(
    api.domains.events.queries.getTicketsByEvent,
    eventId ? { eventId: eventId as Id<"events"> } : "skip"
  );
  
  return useTanstackQuery({
    queryKey: ['event-tickets', eventId],
    queryFn: () => {
      if (!ticketsQuery) return [];
      return ticketsQuery.map(mapConvexTicket);
    },
    enabled: eventId !== null && ticketsQuery !== undefined,
  });
};

// Helper for getting active tickets for an event
export const useActiveEventTickets = (eventId: string | null) => {
  const tickets = useQuery(
    api.domains.events.queries.getActiveTicketsByEvent,
    eventId ? { eventId: eventId as Id<"events"> } : "skip"
  );
  
  return {
    tickets: tickets?.map(mapConvexTicket) || [],
    isLoading: eventId !== null && tickets === undefined,
  };
};

// TanStack Query version
export const useActiveEventTicketsQuery = (eventId: string | null) => {
  const ticketsQuery = useQuery(
    api.domains.events.queries.getActiveTicketsByEvent,
    eventId ? { eventId: eventId as Id<"events"> } : "skip"
  );
  
  return useTanstackQuery({
    queryKey: ['active-event-tickets', eventId],
    queryFn: () => {
      if (!ticketsQuery) return [];
      return ticketsQuery.map(mapConvexTicket);
    },
    enabled: eventId !== null && ticketsQuery !== undefined,
  });
};

export const useCreateEventTicket = () => {
  const createTicketMutation = useMutation(api.domains.events.mutations.createEventTicket);
  
  return async (ticketData: Omit<EventTicket, 'id' | 'createdAt'>) => {
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

export const useUpdateEventTicket = () => {
  const updateTicketMutation = useMutation(api.domains.events.mutations.updateEventTicket);
  
  return async (ticketData: EventTicket) => {
    const { id, createdAt, ...updateData } = ticketData;
    
    return await updateTicketMutation({
      id: id as Id<"eventTickets">,
      ...updateData,
    } as any);
  };
};

export const useDeleteEventTicket = () => {
  const deleteTicketMutation = useMutation(api.domains.events.mutations.removeEventTicket);
  
  return async (id: string) => {
    return await deleteTicketMutation({ id: id as Id<"eventTickets"> });
  };
};
