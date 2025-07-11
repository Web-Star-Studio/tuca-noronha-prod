import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";

/**
 * Type definitions for the audit logging system
 * Based on security best practices and compliance requirements
 */

// Event Types
export type AuditEventType = 
  // CRUD Operations
  | "create" | "update" | "delete"
  // Authentication Events
  | "login" | "logout" | "password_change"
  // Asset Management
  | "asset_create" | "asset_update" | "asset_delete" 
  | "asset_feature_toggle" | "asset_status_change"
  // Permission Management
  | "permission_grant" | "permission_revoke" | "permission_update" | "role_change"
  // Booking Operations
  | "booking_create" | "booking_update" | "booking_cancel" | "booking_confirm"
  // Admin Reservation Operations
  | "admin_reservation_create" | "admin_reservation_update" | "admin_reservation_cancel" 
  | "admin_reservation_confirm" | "admin_reservation_delete"
  // Package Proposal Operations
  | "package_proposal_create" | "package_proposal_update" | "package_proposal_send"
  | "package_proposal_viewed" | "package_proposal_approve" | "package_proposal_reject" 
  | "package_proposal_accept" | "package_proposal_convert" | "package_proposal_delete" 
  | "package_proposal_attachment_add" | "package_proposal_attachment_remove" 
  | "package_proposal_template_create" | "package_proposal_template_update" 
  | "package_proposal_template_delete"
  // Auto-Confirmation Operations
  | "auto_confirmation_create" | "auto_confirmation_update" | "auto_confirmation_enable"
  | "auto_confirmation_disable" | "auto_confirmation_delete"
  // Reservation Communication
  | "reservation_chat_create" | "reservation_message_send" | "reservation_comm_status_change"
  | "reservation_comm_assign"
  // Organization Management
  | "organization_create" | "organization_update" | "organization_delete"
  // System Operations
  | "system_config_change" | "bulk_operation"
  // Media Operations
  | "media_upload" | "media_delete"
  // Chat Operations
  | "chat_room_create" | "chat_message_send" | "chat_status_change"
  // Other
  | "other";

// Event Categories for grouping and analysis
export type AuditEventCategory = 
  | "authentication" | "authorization" | "data_access" | "data_modification"
  | "system_admin" | "user_management" | "asset_management" | "booking_management"
  | "admin_reservation_management" | "package_management" | "auto_confirmation_management"
  | "document_management" | "template_management"
  | "communication" | "security" | "compliance" | "other";

// Severity levels for risk assessment
export type AuditEventSeverity = "low" | "medium" | "high" | "critical";

// Platform types for source tracking
export type AuditSourcePlatform = "web" | "mobile" | "api" | "system" | "unknown";

// Operation status
export type AuditStatus = "success" | "failure" | "partial" | "pending";

// User roles for RBAC
export type UserRole = "traveler" | "partner" | "employee" | "master";

// Data classification levels
export type DataClassification = "public" | "internal" | "confidential" | "restricted";

/**
 * Core audit log structure
 */
export interface AuditLog {
  _id: Id<"auditLogs">;
  _creationTime: number;
  
  // Actor information
  actor: {
    userId: Id<"users">;
    role: UserRole;
    name: string;
    email?: string;
  };
  
  // Event details
  event: {
    type: AuditEventType;
    action: string;
    category: AuditEventCategory;
    severity: AuditEventSeverity;
  };
  
  // Resource information (optional)
  resource?: {
    type: string;
    id: string;
    name?: string;
    organizationId?: Id<"partnerOrganizations">;
    partnerId?: Id<"users">;
  };
  
  // Source information
  source: {
    ipAddress: string;
    userAgent?: string;
    platform: AuditSourcePlatform;
    location?: {
      country?: string;
      city?: string;
      region?: string;
    };
  };
  
  // Operation status
  status: AuditStatus;
  
  // Additional metadata
  metadata?: {
    before?: any;
    after?: any;
    reason?: string;
    batchId?: string;
    duration?: number;
    errorMessage?: string;
    bookingCode?: string;
    amount?: number;
    quantity?: number;
    permissions?: string[];
    sessionId?: string;
    referrer?: string;
    feature?: string;
    experiment?: string;
    archived?: boolean;
    archivedAt?: number;
  };
  
  // Risk assessment
  riskAssessment?: {
    score: number;
    factors: string[];
    isAnomalous: boolean;
    recommendation?: string;
  };
  
  // Compliance information
  compliance?: {
    regulations: string[];
    retentionPeriod: number;
    isPersonalData: boolean;
    dataClassification?: DataClassification;
  };
  
  // Timestamps
  timestamp: number;
  expiresAt?: number;
}

/**
 * Input type for creating audit logs
 */
export interface CreateAuditLogInput {
  actor: {
    userId: Id<"users">;
    role: UserRole;
    name: string;
    email?: string;
  };
  
  event: {
    type: AuditEventType;
    action: string;
    category: AuditEventCategory;
    severity: AuditEventSeverity;
  };
  
  resource?: {
    type: string;
    id: string;
    name?: string;
    organizationId?: Id<"partnerOrganizations">;
    partnerId?: Id<"users">;
  };
  
  source: {
    ipAddress: string;
    userAgent?: string;
    platform: AuditSourcePlatform;
    location?: {
      country?: string;
      city?: string;
      region?: string;
    };
  };
  
  status: AuditStatus;
  metadata?: Record<string, any>;
  riskAssessment?: {
    score: number;
    factors: string[];
    isAnomalous: boolean;
    recommendation?: string;
  };
  compliance?: {
    regulations: string[];
    retentionPeriod: number;
    isPersonalData: boolean;
    dataClassification?: DataClassification;
  };
}

/**
 * Query filters for audit logs
 */
export interface AuditLogFilters {
  // Time range
  startDate?: number;
  endDate?: number;
  
  // Actor filters
  userId?: Id<"users">;
  userRole?: UserRole;
  
  // Event filters
  eventType?: AuditEventType;
  eventCategory?: AuditEventCategory;
  severity?: AuditEventSeverity;
  
  // Resource filters
  resourceType?: string;
  resourceId?: string;
  partnerId?: Id<"users">;
  organizationId?: Id<"partnerOrganizations">;
  
  // Source filters
  ipAddress?: string;
  platform?: AuditSourcePlatform;
  country?: string;
  
  // Status filters
  status?: AuditStatus;
  
  // Risk filters
  isAnomalous?: boolean;
  riskScoreMin?: number;
  riskScoreMax?: number;
  
  // Compliance filters
  regulations?: string[];
  isPersonalData?: boolean;
  dataClassification?: DataClassification;
  
  // Search
  searchTerm?: string;
}

/**
 * Paginated audit log results
 */
export interface AuditLogPage {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  total: number;
  byEventType: Record<AuditEventType, number>;
  byCategory: Record<AuditEventCategory, number>;
  bySeverity: Record<AuditEventSeverity, number>;
  byStatus: Record<AuditStatus, number>;
  byPlatform: Record<AuditSourcePlatform, number>;
  today: number;
  thisWeek: number;
  thisMonth: number;
  errors: number;
  warnings: number;
  criticalEvents: number;
  anomalousEvents: number;
  uniqueUsers: number;
  uniqueIPs: number;
}

/**
 * Bulk operation result
 */
export interface BulkAuditResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  message: string;
}

/**
 * Export options for audit logs
 */
export interface AuditLogExportOptions {
  format: "json" | "csv" | "xlsx";
  filters?: AuditLogFilters;
  includeMetadata?: boolean;
  includeRiskAssessment?: boolean;
  includeCompliance?: boolean;
  maxRecords?: number;
}

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  defaultRetentionDays: number;
  policies: Array<{
    category: AuditEventCategory;
    severity: AuditEventSeverity;
    retentionDays: number;
    autoDelete: boolean;
  }>;
}

/**
 * Risk calculation context
 */
export interface RiskContext {
  userId: Id<"users">;
  ipAddress: string;
  userAgent?: string;
  timestamp: number;
  eventType: AuditEventType;
  resourceType?: string;
  
  // Historical context
  recentActions?: AuditEventType[];
  suspiciousPatterns?: string[];
  userBehaviorScore?: number;
  deviceFingerprint?: string;
}

/**
 * Validators for Convex functions
 */
export const auditLogValidators = {
  actor: v.object({
    userId: v.id("users"),
    role: v.union(
      v.literal("traveler"), 
      v.literal("partner"), 
      v.literal("employee"), 
      v.literal("master")
    ),
    name: v.string(),
    email: v.optional(v.string()),
  }),
  
  event: v.object({
    type: v.union(
      v.literal("create"), v.literal("update"), v.literal("delete"),
      v.literal("login"), v.literal("logout"), v.literal("password_change"),
      v.literal("asset_create"), v.literal("asset_update"), v.literal("asset_delete"),
      v.literal("asset_feature_toggle"), v.literal("asset_status_change"),
      v.literal("permission_grant"), v.literal("permission_revoke"), 
      v.literal("permission_update"), v.literal("role_change"),
      v.literal("booking_create"), v.literal("booking_update"), 
      v.literal("booking_cancel"), v.literal("booking_confirm"),
      v.literal("package_proposal_create"), v.literal("package_proposal_update"), 
      v.literal("package_proposal_send"), v.literal("package_proposal_viewed"),
      v.literal("package_proposal_approve"), v.literal("package_proposal_reject"), 
      v.literal("package_proposal_accept"), v.literal("package_proposal_convert"), 
      v.literal("package_proposal_delete"), v.literal("package_proposal_attachment_add"), 
      v.literal("package_proposal_attachment_remove"), v.literal("package_proposal_template_create"), 
      v.literal("package_proposal_template_update"), v.literal("package_proposal_template_delete"),
      v.literal("auto_confirmation_create"), v.literal("auto_confirmation_update"), 
      v.literal("auto_confirmation_enable"), v.literal("auto_confirmation_disable"),
      v.literal("auto_confirmation_delete"),
      v.literal("organization_create"), v.literal("organization_update"), 
      v.literal("organization_delete"),
      v.literal("system_config_change"), v.literal("bulk_operation"),
      v.literal("media_upload"), v.literal("media_delete"),
      v.literal("chat_room_create"), v.literal("chat_message_send"), 
      v.literal("chat_status_change"),
      v.literal("other")
    ),
    action: v.string(),
    category: v.union(
      v.literal("authentication"), v.literal("authorization"), 
      v.literal("data_access"), v.literal("data_modification"),
      v.literal("system_admin"), v.literal("user_management"), 
      v.literal("asset_management"), v.literal("booking_management"),
      v.literal("admin_reservation_management"), v.literal("package_management"),
      v.literal("auto_confirmation_management"), v.literal("document_management"),
      v.literal("template_management"), v.literal("communication"), 
      v.literal("security"), v.literal("compliance"), v.literal("other")
    ),
    severity: v.union(
      v.literal("low"), v.literal("medium"), 
      v.literal("high"), v.literal("critical")
    ),
  }),
  
  resource: v.optional(v.object({
    type: v.string(),
    id: v.string(),
    name: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
    partnerId: v.optional(v.id("users")),
  })),
  
  source: v.object({
    ipAddress: v.string(),
    userAgent: v.optional(v.string()),
    platform: v.union(
      v.literal("web"), v.literal("mobile"), v.literal("api"), 
      v.literal("system"), v.literal("unknown")
    ),
    location: v.optional(v.object({
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
  }),
  
  status: v.union(
    v.literal("success"), v.literal("failure"), 
    v.literal("partial"), v.literal("pending")
  ),
  
  filters: v.object({
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    userRole: v.optional(v.union(
      v.literal("traveler"), v.literal("partner"), 
      v.literal("employee"), v.literal("master")
    )),
    eventType: v.optional(v.string()),
    eventCategory: v.optional(v.string()),
    severity: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    ipAddress: v.optional(v.string()),
    platform: v.optional(v.string()),
    country: v.optional(v.string()),
    status: v.optional(v.string()),
    isAnomalous: v.optional(v.boolean()),
    riskScoreMin: v.optional(v.number()),
    riskScoreMax: v.optional(v.number()),
    regulations: v.optional(v.array(v.string())),
    isPersonalData: v.optional(v.boolean()),
    dataClassification: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  }),
}; 