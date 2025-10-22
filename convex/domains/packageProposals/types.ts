import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";

// Package Proposal Types
export const PackageProposalStatus = v.union(
  v.literal("draft"),
  v.literal("review"),
  v.literal("sent"),
  v.literal("viewed"),
  v.literal("under_negotiation"),
  v.literal("accepted"),
  v.literal("awaiting_participants_data"),    // Waiting for participant info
  v.literal("participants_data_completed"),   // Participant data filled
  v.literal("flight_booking_in_progress"),    // Admin booking flights
  v.literal("flight_booked"),                 // Flights confirmed by admin
  v.literal("documents_uploaded"),            // Admin uploaded documents
  v.literal("awaiting_final_confirmation"),   // Waiting customer final approval
  v.literal("payment_pending"),               // Redirected to payment
  v.literal("payment_completed"),             // Payment successful
  v.literal("contracted"),                    // Fully contracted
  v.literal("rejected"),
  v.literal("expired"),
  v.literal("withdrawn")
);

export const PackageProposalPriority = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent")
);

export const PackageProposalApprovalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
);

// Removed: PackageComponentType and PackageComponent (no longer used)

// Attachment validator
export const ProposalAttachment = v.object({
  storageId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  uploadedAt: v.number(),
  uploadedBy: v.id("users"),
  description: v.optional(v.string()),
});

// Input validators
export const CreatePackageProposalArgs = v.object({
  packageRequestId: v.id("packageRequests"),
  title: v.optional(v.string()), // Optional - will be auto-generated from customer name if not provided
  description: v.string(),
  summary: v.optional(v.string()),
  subtotal: v.number(),
  taxes: v.optional(v.number()),
  fees: v.optional(v.number()),
  discount: v.number(),
  totalPrice: v.number(),
  currency: v.string(),
  validUntil: v.number(),
  paymentTerms: v.string(),
  cancellationPolicy: v.string(),
  attachments: v.optional(v.array(ProposalAttachment)),
  requiresApproval: v.boolean(),
  priority: PackageProposalPriority,
  status: v.optional(PackageProposalStatus),
  tags: v.optional(v.array(v.string())),
  metadata: v.optional(v.any()), // Additional form metadata
});

export const UpdatePackageProposalArgs = v.object({
  id: v.id("packageProposals"),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  summary: v.optional(v.string()),
  subtotal: v.optional(v.number()),
  taxes: v.optional(v.number()),
  fees: v.optional(v.number()),
  discount: v.optional(v.number()),
  totalPrice: v.optional(v.number()),
  currency: v.optional(v.string()),
  validUntil: v.optional(v.number()),
  paymentTerms: v.optional(v.string()),
  cancellationPolicy: v.optional(v.string()),
  attachments: v.optional(v.array(ProposalAttachment)),
  status: v.optional(PackageProposalStatus),
  priority: v.optional(PackageProposalPriority),
  requiresApproval: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
  customerFeedback: v.optional(v.string()),
  adminResponse: v.optional(v.string()),
  metadata: v.optional(v.any()), // Additional form metadata
});

export const ListPackageProposalsArgs = v.object({
  packageRequestId: v.optional(v.id("packageRequests")),
  adminId: v.optional(v.id("users")),
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
  status: v.optional(PackageProposalStatus),
  approvalStatus: v.optional(PackageProposalApprovalStatus),
  priority: v.optional(PackageProposalPriority),
  convertedToBooking: v.optional(v.boolean()),
  validUntil: v.optional(v.number()),
  searchTerm: v.optional(v.string()),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
  cursor: v.optional(v.string()),
});

export const SendPackageProposalArgs = v.object({
  id: v.id("packageProposals"),
  customMessage: v.optional(v.string()),
  sendEmail: v.boolean(),
  sendNotification: v.boolean(),
  includeAttachments: v.optional(v.boolean()),
});

export const ApprovePackageProposalArgs = v.object({
  id: v.id("packageProposals"),
  approved: v.boolean(),
  notes: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),
});

export const ConvertProposalToBookingArgs = v.object({
  id: v.id("packageProposals"),
  bookingDetails: v.optional(v.any()),
  paymentMethod: v.optional(v.string()),
  notes: v.optional(v.string()),
});

// File upload args
export const UploadProposalAttachmentArgs = v.object({
  proposalId: v.id("packageProposals"),
  storageId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  description: v.optional(v.string()),
});

// Status labels and colors for UI
export const PROPOSAL_STATUS_LABELS = {
  draft: "Rascunho",
  review: "Em Revisão",
  sent: "Enviado",
  viewed: "Visualizado",
  under_negotiation: "Em Negociação",
  accepted: "Aceito",
  rejected: "Rejeitado",
  expired: "Expirado",
  withdrawn: "Retirado",
} as const;

export const PROPOSAL_STATUS_COLORS = {
  draft: "gray",
  review: "yellow",
  sent: "blue",
  viewed: "cyan",
  under_negotiation: "orange",
  accepted: "green",
  rejected: "red",
  expired: "gray",
  withdrawn: "purple",
} as const;

export const PROPOSAL_PRIORITY_LABELS = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
} as const;

export const PROPOSAL_PRIORITY_COLORS = {
  low: "gray",
  normal: "blue",
  high: "orange",
  urgent: "red",
} as const;

// Removed: COMPONENT_TYPE_LABELS and COMPONENT_TYPE_ICONS (no longer used)

// Type exports
export type PackageProposalDoc = Doc<"packageProposals">;
export type PackageProposalId = Id<"packageProposals">;
// Removed: PackageProposalComponentType (no longer used)

export type PackageProposalStatusType = 
  | "draft"
  | "review"
  | "sent"
  | "viewed"
  | "under_negotiation"
  | "accepted"
  | "rejected"
  | "expired"
  | "withdrawn";

export type PackageProposalPriorityType = 
  | "low"
  | "normal"
  | "high"
  | "urgent";