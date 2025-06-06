/**
 * Packages domain exports
 */

// Re-export all queries from the queries file
export * from "./queries";

// Re-export all mutations from the mutations file
export * from "./mutations";

// Re-export utility functions
export {
  generateRequestNumber,
  validateEmailFormat,
  validateDateRange,
  validateBudgetOption,
  validateGroupSize,
  validatePackageRequestStatus,
  formatPackageRequest,
  getStatusColor,
  getStatusLabel,
  calculateRequestPriority
} from "./utils";

// Re-export types and constants
export type {
  Package,
  PackageWithDetails,
  PackageFilters,
  PackageBookingWithDetails,
  PackageCreateInput,
  PackageUpdateInput,
  PackageRequestCustomerInfo,
  PackageRequestTripDetails,
  PackageRequestPreferences,
  PackageRequestAdditionalInfo,
  PackageRequestAdminNote,
  PackageRequest,
  PackageRequestWithDetails,
  PackageRequestStatus,
  PackageRequestSummary
} from "./types";

// Re-export constants
export {
  STATUS_LABELS,
  STATUS_COLORS
} from "./types"; 