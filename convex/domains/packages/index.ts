/**
 * Package Domain Index
 * Exports all package-related functionality including conversion system
 */

// Core package functionality
export * from "./queries";
export * from "./mutations";
export * from "./types";
export * from "./utils";

// Request-to-Booking Conversion System (Sprint 6)
export * from "./requestAnalysis";
export * from "./matchingEngine";
export * from "./customPackageBuilder";
export * from "./pricingEngine";
export * from "./conversionApi";

// Export utility constants
export const CONVERSION_STRATEGIES = {
  AUTOMATIC: "automatic",
  ASSISTED: "assisted", 
  MANUAL: "manual",
} as const;

export const MATCHING_ALGORITHMS = {
  SIMILARITY: "similarity_score",
  PREFERENCE_WEIGHTED: "preference_weighted", 
  BUDGET_OPTIMIZED: "budget_optimized",
  ML_CLUSTERING: "ml_clustering",
  HYBRID: "hybrid",
} as const;

export const PRICING_STRATEGIES = {
  COST_PLUS: "cost_plus",
  VALUE_BASED: "value_based",
  COMPETITIVE: "competitive", 
  DYNAMIC: "dynamic",
  SEASONAL: "seasonal",
  DEMAND_BASED: "demand_based",
} as const;

export const CONVERSION_STATUSES = {
  ANALYSIS_PENDING: "analysis_pending",
  ANALYSIS_COMPLETE: "analysis_complete",
  MATCHING_IN_PROGRESS: "matching_in_progress",
  MATCHES_FOUND: "matches_found",
  CUSTOM_PACKAGE_REQUIRED: "custom_package_required",
  PRICING_CALCULATED: "pricing_calculated",
  READY_FOR_CONVERSION: "ready_for_conversion",
  CONVERSION_IN_PROGRESS: "conversion_in_progress",
  CONVERSION_COMPLETE: "conversion_complete",
  CONVERSION_FAILED: "conversion_failed",
  CUSTOMER_APPROVAL_PENDING: "customer_approval_pending",
  CUSTOMER_APPROVED: "customer_approved",
  CUSTOMER_REJECTED: "customer_rejected",
} as const;

export const PACKAGE_COMPONENT_TYPES = {
  ACCOMMODATION: "accommodation",
  ACTIVITY: "activity",
  RESTAURANT: "restaurant", 
  VEHICLE: "vehicle",
  EVENT: "event",
  TRANSFER: "transfer",
  GUIDE: "guide",
  INSURANCE: "insurance",
  CUSTOM_SERVICE: "custom_service",
} as const;

/**
 * Export ready-to-use conversion functions for the API
 */
export const ConversionAPI = {
  // Main workflow functions
  startConversion: "domains.packages.conversionApi.startConversionProcess",
  getStatus: "domains.packages.conversionApi.getConversionStatus", 
  executeMatching: "domains.packages.conversionApi.executePackageMatching",
  calculatePricing: "domains.packages.conversionApi.calculateConversionPricing",
  selectOption: "domains.packages.conversionApi.selectConversionOption",
  executeConversion: "domains.packages.conversionApi.executeConversionToBooking",
  getAnalytics: "domains.packages.conversionApi.getConversionAnalytics",

  // Analysis functions
  analyzeRequest: "domains.packages.requestAnalysis.analyzePackageRequest",
  getAnalysis: "domains.packages.requestAnalysis.getRequestAnalysis",
  markForAutoConversion: "domains.packages.requestAnalysis.markForAutoConversion",
  getConversionCandidates: "domains.packages.requestAnalysis.getConversionCandidates",

  // Matching functions
  executePackageMatching: "domains.packages.matchingEngine.executeMatching",
  getMatchingStats: "domains.packages.matchingEngine.getMatchingStatistics",

  // Pricing functions
  calculateDynamicPricing: "domains.packages.pricingEngine.calculateDynamicPricing",
  getPricingRecommendations: "domains.packages.pricingEngine.getPricingRecommendations",
  calculateSensitivity: "domains.packages.pricingEngine.calculatePricingSensitivity",
  getPricingTrends: "domains.packages.pricingEngine.getPricingTrends",

  // Package builder functions
  initializeBuilder: "domains.packages.customPackageBuilder.initializeCustomPackageBuilder",
  addComponent: "domains.packages.customPackageBuilder.addPackageComponent",
  removeComponent: "domains.packages.customPackageBuilder.removePackageComponent",
  updateComponent: "domains.packages.customPackageBuilder.updatePackageComponent",
  getComponents: "domains.packages.customPackageBuilder.getAvailableComponents",
  generatePreview: "domains.packages.customPackageBuilder.generatePackagePreview",
  convertToPackage: "domains.packages.customPackageBuilder.convertToActualPackage",
} as const; 