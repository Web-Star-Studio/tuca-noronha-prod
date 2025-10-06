import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Generate unique request number for package requests
 */
export function generateRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKG-${timestamp}-${random}`;
}

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to parse date strings without timezone issues
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Validate date range for package requests
 */
export function validateDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to midnight for accurate comparison
  
  if (start < today) {
    return { isValid: false, error: "Start date cannot be in the past" };
  }
  
  if (end <= start) {
    return { isValid: false, error: "End date must be after start date" };
  }
  
  return { isValid: true };
}

/**
 * Validate budget option
 */
export function validateBudgetOption(budget: string): boolean {
  const budgetOptions = ["up_to_1000", "1000_to_3000", "3000_to_5000", "5000_to_10000", "above_10000"];
  return budgetOptions.includes(budget);
}

/**
 * Validate group size option
 */
export function validateGroupSize(groupSize: string): boolean {
  const groupSizeOptions = ["1", "2", "3-5", "6-10", "more_than_10"];
  return groupSizeOptions.includes(groupSize);
}

/**
 * Validate package request status
 */
export function validatePackageRequestStatus(status: string): boolean {
  const validStatuses = ["pending", "in_review", "approved", "rejected", "completed"];
  return validStatuses.includes(status);
}

/**
 * Format package request for display
 */
export function formatPackageRequest(request: any) {
  return {
    ...request,
    formattedCreatedAt: new Date(request.createdAt).toLocaleDateString(),
    formattedUpdatedAt: new Date(request.updatedAt).toLocaleDateString(),
  };
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: string): string {
  const statusColors: { [key: string]: string } = {
    pending: "yellow",
    in_review: "blue", 
    approved: "green",
    rejected: "red",
    completed: "purple",
  };
  
  return statusColors[status] || "gray";
}

/**
 * Get status label for UI display
 */
export function getStatusLabel(status: string): string {
  const statusLabels: { [key: string]: string } = {
    pending: "Pendente",
    in_review: "Em Análise",
    approved: "Aprovado",
    rejected: "Rejeitado", 
    completed: "Concluído",
  };
  
  return statusLabels[status] || status;
}

/**
 * Calculate package request priority based on creation date and budget
 */
export function calculateRequestPriority(request: any): "high" | "medium" | "low" {
  const daysSinceCreation = (Date.now() - request.createdAt) / (1000 * 60 * 60 * 24);
  const isHighBudget = ["5000_to_10000", "above_10000"].includes(request.tripDetails.budget);
  
  if (daysSinceCreation > 7 || isHighBudget) {
    return "high";
  } else if (daysSinceCreation > 3) {
    return "medium";
  } else {
    return "low";
  }
} 