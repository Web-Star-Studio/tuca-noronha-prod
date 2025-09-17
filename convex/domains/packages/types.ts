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
  originCity?: string;
  // For specific dates
  startDate?: string;
  endDate?: string;
  // For flexible dates
  startMonth?: string;
  endMonth?: string;
  flexibleDates?: boolean;
  duration: number;
  budget: number;
  groupSize: number;
  companions: string;
  budgetFlexibility: string;
  includesAirfare?: boolean;
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

// Form option constants
export const COMPANIONS_OPTIONS = [
  { value: "1", label: "1 pessoa" },
  { value: "2", label: "2 pessoas" },
  { value: "3", label: "3 pessoas" },
  { value: "4", label: "4 pessoas" },
  { value: "5", label: "5 pessoas" },
  { value: "6+", label: "6 ou mais pessoas" },
];

export const BUDGET_FLEXIBILITY_OPTIONS = [
  { value: "rigid", label: "Rígido - não posso ultrapassar" },
  { value: "flexible", label: "Flexível - posso ultrapassar um pouco" },
  { value: "very_flexible", label: "Muito flexível - é apenas uma estimativa" },
];

export const ACCOMMODATION_TYPE_OPTIONS = [
  { value: "pousada", label: "Pousada" },
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "casa_temporada", label: "Casa de temporada" },
  { value: "apartamento", label: "Apartamento" },
  { value: "hostel", label: "Hostel" },
  { value: "camping", label: "Camping" },
  { value: "vila", label: "Vila" },
  { value: "bangalo", label: "Bangalô" },
  { value: "eco_lodge", label: "Eco Lodge" },
];



export const ACTIVITY_OPTIONS = [
  { value: "mergulho", label: "Mergulho" },
  { value: "snorkeling", label: "Snorkeling" },
  { value: "trilhas", label: "Trilhas" },
  { value: "passeio_barco", label: "Passeios de barco" },
  { value: "observacao_golfinhos", label: "Observação de golfinhos" },
  { value: "surf", label: "Surf" },
  { value: "stand_up_paddle", label: "Stand Up Paddle" },
  { value: "pesca", label: "Pesca" },
  { value: "fotografia", label: "Fotografia" },
  { value: "relaxamento", label: "Relaxamento" },
];

export const TRANSPORTATION_OPTIONS = [
  { value: "aereo", label: "Avião" },
  { value: "carro", label: "Carro alugado" },
  { value: "buggy", label: "Buggy" },
  { value: "moto", label: "Moto" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "a_pe", label: "A pé" },
  { value: "transporte_publico", label: "Transporte público" },
  { value: "transfer", label: "Transfer" },
  { value: "onibus", label: "Ônibus" },
];

export const FOOD_PREFERENCES_OPTIONS = [
  { value: "frutos_mar", label: "Frutos do mar" },
  { value: "vegetariana", label: "Vegetariana" },
  { value: "vegana", label: "Vegana" },
  { value: "sem_gluten", label: "Sem glúten" },
  { value: "brasileira", label: "Culinária brasileira" },
  { value: "internacional", label: "Culinária internacional" },
  { value: "local", label: "Pratos típicos locais" },
  { value: "sem_restricoes", label: "Sem restrições" },
];

export interface PackageRequestFormData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    age?: number;
    occupation: string;
  };
  tripDetails: {
    destination: string;
    originCity?: string;
    // For specific dates
    startDate?: string;
    endDate?: string;
    // For flexible dates
    startMonth?: string;
    endMonth?: string;
    flexibleDates?: boolean;
    duration: number;
    groupSize: number;
    companions: string;
    budget: number;
    budgetFlexibility: string;
    includesAirfare?: boolean;
  };
  preferences: {
  
    activities: string[];
    transportation: string[];
    foodPreferences: string[];
    accessibility: string[];
  };
  specialRequirements: string;
  previousExperience: string;
  expectedHighlights: string;
} 