import { Id } from "../../_generated/dataModel";

export interface Package {
  _id: Id<"packages">;
  _creationTime: number;
  name: string;
  slug: string;
  description: string;
  description_long: string;
  duration: number;
  maxGuests: number;
  basePrice: number;
  discountPercentage?: number;
  currency: string;
  accommodationId?: Id<"accommodations">;
  vehicleId?: Id<"vehicles">;
  includedActivityIds: Id<"activities">[];
  includedRestaurantIds: Id<"restaurants">[];
  includedEventIds: Id<"events">[];
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: {
    day: number;
    title: string;
    description: string;
    activities: string[];
  }[];
  mainImage: string;
  galleryImages: string[];
  cancellationPolicy: string;
  terms: string[];
  availableFromDate: string;
  availableToDate: string;
  blackoutDates: string[];
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  category: string;
  partnerId: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

export interface PackageWithDetails extends Package {
  accommodation?: {
    id: string;
    name: string;
    type: string;
    mainImage: string;
    pricePerNight: number;
  } | null;
  vehicle?: {
    id: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    pricePerDay: number;
    imageUrl?: string;
  } | null;
  includedActivities?: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    category: string;
  }[];
  includedRestaurants?: {
    id: string;
    name: string;
    cuisine: string[];
    priceRange: string;
    mainImage: string;
  }[];
  includedEvents?: {
    id: string;
    title: string;
    date: string;
    price: number;
    imageUrl: string;
    category: string;
  }[];
  creator?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

export interface PackageBooking {
  _id: Id<"packageBookings">;
  _creationTime: number;
  packageId: Id<"packages">;
  userId: Id<"users">;
  startDate: string;
  endDate: string;
  guests: number;
  totalPrice: number;
  breakdown: {
    accommodationPrice: number;
    vehiclePrice?: number;
    activitiesPrice: number;
    restaurantsPrice: number;
    eventsPrice: number;
    discount: number;
  };
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  relatedBookings: {
    accommodationBookingId?: Id<"accommodationBookings">;
    vehicleBookingId?: Id<"vehicleBookings">;
    activityBookingIds: Id<"activityBookings">[];
    restaurantReservationIds: Id<"restaurantReservations">[];
    eventBookingIds: Id<"eventBookings">[];
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  partnerNotes?: string;
  confirmationCode: string;
  createdAt: number;
  updatedAt: number;
}

export interface PackageBookingWithDetails extends PackageBooking {
  package?: {
    id: string;
    name: string;
    mainImage: string;
    category: string;
  } | null;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

export interface PackageCreateInput {
  name: string;
  slug: string;
  description: string;
  description_long: string;
  duration: number;
  maxGuests: number;
  basePrice: number;
  discountPercentage?: number;
  currency: string;
  accommodationId?: Id<"accommodations">;
  vehicleId?: Id<"vehicles">;
  includedActivityIds: Id<"activities">[];
  includedRestaurantIds: Id<"restaurants">[];
  includedEventIds: Id<"events">[];
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: {
    day: number;
    title: string;
    description: string;
    activities: string[];
  }[];
  mainImage: string;
  galleryImages: string[];
  cancellationPolicy: string;
  terms: string[];
  availableFromDate: string;
  availableToDate: string;
  blackoutDates: string[];
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  category: string;
  partnerId: Id<"users">;
}

export interface PackageUpdateInput {
  id: Id<"packages">;
  name?: string;
  slug?: string;
  description?: string;
  description_long?: string;
  duration?: number;
  maxGuests?: number;
  basePrice?: number;
  discountPercentage?: number;
  currency?: string;
  accommodationId?: Id<"accommodations">;
  vehicleId?: Id<"vehicles">;
  includedActivityIds?: Id<"activities">[];
  includedRestaurantIds?: Id<"restaurants">[];
  includedEventIds?: Id<"events">[];
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  itinerary?: {
    day: number;
    title: string;
    description: string;
    activities: string[];
  }[];
  mainImage?: string;
  galleryImages?: string[];
  cancellationPolicy?: string;
  terms?: string[];
  availableFromDate?: string;
  availableToDate?: string;
  blackoutDates?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  category?: string;
}

export interface PackageFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  duration?: number;
  maxGuests?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  partnerId?: Id<"users">;
  searchTerm?: string;
  tags?: string[];
}

// Package Request Types
export interface PackageRequestCustomerInfo {
  name: string;
  email: string;
  phone: string;
  age?: number;
  occupation?: string;
}

export interface PackageRequestTripDetails {
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  budget: string;
  groupSize: string;
}

export interface PackageRequestPreferences {
  accommodationType?: string;
  activities?: string;
  transportPreference?: string;
  foodPreference?: string;
  specialRequirements?: string;
}

export interface PackageRequestAdditionalInfo {
  hasSpecialNeeds?: boolean;
  accessibilityRequirements?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  additionalNotes?: string;
}

export interface PackageRequestAdminNote {
  note: string;
  timestamp: number;
  status: string;
}

export interface PackageRequest {
  _id: Id<"packageRequests">;
  _creationTime: number;
  requestNumber: string;
  customerInfo: PackageRequestCustomerInfo;
  tripDetails: PackageRequestTripDetails;
  preferences: PackageRequestPreferences;
  additionalInfo: PackageRequestAdditionalInfo;
  status: PackageRequestStatus;
  assignedTo?: Id<"users">;
  adminNotes?: PackageRequestAdminNote[];
  createdAt: number;
  updatedAt: number;
}

export type PackageRequestStatus = 
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "completed";

export interface PackageRequestWithDetails extends PackageRequest {
  assignedUser?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

// Package Request Summary for dashboard stats
export interface PackageRequestSummary {
  total: number;
  pending: number;
  inReview: number;
  proposalSent: number;
  confirmed: number;
  cancelled: number;
}

// Status labels for package requests
export const STATUS_LABELS = {
  pending: "Pendente",
  in_review: "Em Análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  proposal_sent: "Proposta Enviada",
  confirmed: "Confirmado",
  cancelled: "Cancelado"
} as const;

// Status colors for package requests
export const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  proposal_sent: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
} as const; 