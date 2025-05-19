import { Id } from "../../_generated/dataModel";

export interface Event {
  _id: Id<"events">;
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
  partnerId: Id<"users">;
}

export interface EventTicket {
  _id: Id<"eventTickets">;
  _creationTime: number;
  eventId: Id<"events">;
  name: string;
  description: string;
  price: number;
  availableQuantity: bigint;
  maxPerOrder: bigint;
  type: string;
  benefits: string[];
  isActive: boolean;
}

export interface EventCreator {
  id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
}

export interface EventWithCreator extends Event {
  creator: EventCreator | null;
}

export interface EventCreateInput {
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
  hasMultipleTickets?: boolean;
  partnerId: Id<"users">;
}

export interface EventUpdateInput {
  id: Id<"events">;
  title?: string;
  description?: string;
  shortDescription?: string;
  date?: string;
  time?: string;
  location?: string;
  address?: string;
  price?: number;
  category?: string;
  maxParticipants?: number;
  imageUrl?: string;
  galleryImages?: string[];
  highlights?: string[];
  includes?: string[];
  additionalInfo?: string[];
  speaker?: string;
  speakerBio?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  hasMultipleTickets?: boolean;
  partnerId?: Id<"users">;
}

export interface EventTicketCreateInput {
  eventId: Id<"events">;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  maxPerOrder: number;
  type: string;
  benefits: string[];
  isActive: boolean;
}

export interface EventTicketUpdateInput {
  id: Id<"eventTickets">;
  name?: string;
  description?: string;
  price?: number;
  availableQuantity?: number;
  maxPerOrder?: number;
  type?: string;
  benefits?: string[];
  isActive?: boolean;
}

export type EventTicketUpdates = {
  name?: string;
  description?: string;
  price?: number;
  availableQuantity?: bigint;
  maxPerOrder?: bigint;
  type?: string;
  benefits?: string[];
  isActive?: boolean;
}; 