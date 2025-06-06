import { Id } from "../../_generated/dataModel";

export interface Accommodation {
  _id: Id<"accommodations">;
  _creationTime: number;
  name: string;
  slug: string;
  description: string;
  description_long: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    neighborhood: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  phone: string;
  website?: string;
  type: string;
  checkInTime: string;
  checkOutTime: string;
  pricePerNight: number;
  currency: string;
  discountPercentage?: number;
  taxes?: number;
  cleaningFee?: number;
  totalRooms: bigint;
  maxGuests: bigint;
  bedrooms: bigint;
  bathrooms: bigint;
  beds: {
    single: bigint;
    double: bigint;
    queen: bigint;
    king: bigint;
  };
  area: number;
  amenities: string[];
  houseRules: string[];
  cancellationPolicy: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  eventsAllowed: boolean;
  minimumStay: bigint;
  mainImage: string;
  galleryImages: string[];
  rating: {
    overall: number;
    cleanliness: number;
    location: number;
    checkin: number;
    value: number;
    accuracy: number;
    communication: number;
    totalReviews: bigint;
  };
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  partnerId: Id<"users">;
}

export interface AccommodationWithCreator extends Accommodation {
  creator?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

export interface AccommodationBooking {
  _id: Id<"accommodationBookings">;
  _creationTime: number;
  accommodationId: Id<"accommodations">;
  userId: Id<"users">;
  checkInDate: string;
  checkOutDate: string;
  guests: bigint;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  specialRequests?: string;
  partnerNotes?: string;
  confirmationCode: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface AccommodationUpdateInput {
  id: Id<"accommodations">;
  name?: string;
  slug?: string;
  description?: string;
  description_long?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    neighborhood: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  phone?: string;
  website?: string;
  type?: string;
  checkInTime?: string;
  checkOutTime?: string;
  pricePerNight?: number;
  currency?: string;
  discountPercentage?: number;
  taxes?: number;
  cleaningFee?: number;
  totalRooms?: number;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: {
    single: number;
    double: number;
    queen: number;
    king: number;
  };
  area?: number;
  amenities?: string[];
  houseRules?: string[];
  cancellationPolicy?: string;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  eventsAllowed?: boolean;
  minimumStay?: number;
  mainImage?: string;
  galleryImages?: string[];
  rating?: {
    overall: number;
    cleanliness: number;
    location: number;
    checkin: number;
    value: number;
    accuracy: number;
    communication: number;
    totalReviews: number;
  };
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  partnerId?: Id<"users">;
} 