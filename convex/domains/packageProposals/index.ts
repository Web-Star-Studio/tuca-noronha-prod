// Package Proposals Domain
// This module handles the creation, management, and delivery of package proposals

export * from "./types";
export * from "./mutations";
export * from "./queries";
export * from "./actions";

// Re-export key types for convenience
export type {
  PackageProposalDoc,
  PackageProposalId,
  PackageProposalStatusType,
  PackageProposalPriorityType,
} from "./types";

// Export status and priority constants
export {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
  PROPOSAL_PRIORITY_LABELS,
  PROPOSAL_PRIORITY_COLORS,
} from "./types";