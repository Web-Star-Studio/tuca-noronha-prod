import { Id } from "../../_generated/dataModel";

export interface Activity {
  _id: Id<"activities">;
  _creationTime: number;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  netRate?: number;
  availableTimes?: string[];
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
  isFree?: boolean;
  hasMultipleTickets?: boolean;
  partnerId: Id<"users">;
}

export interface ActivityTicket {
  _id: Id<"activityTickets">;
  _creationTime: number;
  activityId: Id<"activities">;
  name: string;
  description: string;
  price: number;
  availableQuantity: bigint;
  maxPerOrder: bigint;
  type: string;
  benefits: string[];
  isActive: boolean;
}

export interface ActivityCreator {
  id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
}

export interface ActivityWithCreator extends Activity {
  creator: ActivityCreator | null;
}

export interface ActivityCreateInput {
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  netRate?: number;
  availableTimes?: string[];
  category: string;
  duration: string;
  maxParticipants: number;
  minParticipants: number;
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
  isFree?: boolean;
  hasMultipleTickets?: boolean;
  partnerId: Id<"users">;
}

export interface ActivityUpdateInput {
  id: Id<"activities">;
  title?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  netRate?: number;
  availableTimes?: string[];
  category?: string;
  duration?: string;
  maxParticipants?: number;
  minParticipants?: number;
  difficulty?: string;
  rating?: number;
  imageUrl?: string;
  galleryImages?: string[];
  highlights?: string[];
  includes?: string[];
  itineraries?: string[];
  excludes?: string[];
  additionalInfo?: string[];
  cancelationPolicy?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  isFree?: boolean;
  hasMultipleTickets?: boolean;
  partnerId?: Id<"users">;
}

export interface ActivityTicketCreateInput {
  activityId: Id<"activities">;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  maxPerOrder: number;
  type: string;
  benefits: string[];
  isActive: boolean;
}

export interface ActivityTicketUpdateInput {
  id: Id<"activityTickets">;
  name?: string;
  description?: string;
  price?: number;
  availableQuantity?: number;
  maxPerOrder?: number;
  type?: string;
  benefits?: string[];
  isActive?: boolean;
}

export type ActivityTicketUpdates = {
  name?: string;
  description?: string;
  price?: number;
  availableQuantity?: bigint;
  maxPerOrder?: bigint;
  type?: string;
  benefits?: string[];
  isActive?: boolean;
}; 
