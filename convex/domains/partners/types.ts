import { Id } from "../../_generated/dataModel";

// Partner Types
export type PartnerOnboardingStatus = "pending" | "in_progress" | "completed" | "rejected";
export type PartnerTransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface Partner {
  _id: Id<"partners">;
  _creationTime: number;
  userId: Id<"users">;
  stripeAccountId: string;
  onboardingStatus: PartnerOnboardingStatus;
  feePercentage: number;
  isActive: boolean;
  capabilities: {
    cardPayments: boolean;
    transfers: boolean;
  };
  metadata: {
    businessName?: string;
    businessType?: string;
    country: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface PartnerFee {
  _id: Id<"partnerFees">;
  _creationTime: number;
  partnerId: Id<"partners">;
  feePercentage: number;
  effectiveDate: number;
  createdBy: Id<"users">;
  reason?: string;
  previousFee?: number;
}

// Union type para os diferentes tipos de bookings
export type BookingId = 
  | Id<"activityBookings">
  | Id<"eventBookings">
  | Id<"vehicleBookings">
  | Id<"accommodationBookings">
  | Id<"packageBookings">;

export interface PartnerTransaction {
  _id: Id<"partnerTransactions">;
  _creationTime: number;
  partnerId: Id<"partners">;
  bookingId: string; // ID genérico da reserva (pode ser de qualquer tipo)
  bookingType: "activity" | "event" | "vehicle" | "accommodation" | "package";
  stripePaymentIntentId: string;
  stripeTransferId?: string;
  amount: number; // em centavos
  platformFee: number; // em centavos
  partnerAmount: number; // em centavos
  currency: string;
  status: PartnerTransactionStatus;
  metadata: any;
  createdAt: number;
}

// Helper types for Stripe Connect
export interface StripeConnectAccountParams {
  email: string;
  country: string;
  businessType?: "individual" | "company";
  businessName?: string;
  controller: {
    fees: {
      payer: "application" | "account";
    };
    losses: {
      payments: "application" | "stripe";
    };
    stripe_dashboard: {
      type: "none" | "express" | "full";
    };
    requirement_collection: "application" | "stripe";
  };
  capabilities: {
    card_payments?: {
      requested: boolean;
    };
    transfers?: {
      requested: boolean;
    };
  };
}

export interface ApplicationFeeCalculation {
  totalAmount: number; // em centavos
  feePercentage: number; // 0-100
  platformFee: number; // em centavos
  partnerAmount: number; // em centavos
  stripeFee: number; // em centavos (estimado)
} 