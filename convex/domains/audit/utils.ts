import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { 
  CreateAuditLogInput, 
  AuditEventType, 
  AuditEventCategory,
  AuditEventSeverity,
  AuditSourcePlatform,
  AuditStatus,
  UserRole,
  RiskContext
} from "./types";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";

/**
 * Utility functions for audit logging system
 * Follows security best practices and provides automatic context extraction
 */

/**
 * Extract request context from headers and environment
 */
export function extractRequestContext(request?: any): {
  ipAddress: string;
  userAgent?: string;
  platform: AuditSourcePlatform;
} {
  let ipAddress = "127.0.0.1";
  let userAgent: string | undefined;
  let platform: AuditSourcePlatform = "system";

  if (request?.headers) {
    ipAddress = 
      request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      request.headers["x-real-ip"] ||
      request.connection?.remoteAddress ||
      "127.0.0.1";

    userAgent = request.headers["user-agent"];

    if (userAgent) {
      if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
        platform = "mobile";
      } else if (userAgent.includes("Mozilla") || userAgent.includes("Chrome")) {
        platform = "web";
      } else if (userAgent.includes("API") || userAgent.includes("curl")) {
        platform = "api";
      } else {
        platform = "unknown";
      }
    }
  }

  return { ipAddress, userAgent, platform };
}

/**
 * Calculate risk score based on context and historical patterns
 */
export async function calculateRiskScore(
  ctx: QueryCtx | MutationCtx,
  riskContext: RiskContext
): Promise<{
  score: number;
  factors: string[];
  isAnomalous: boolean;
  recommendation?: string;
}> {
  const factors: string[] = [];
  let score = 0;

  try {
    // Base risk factors
    const riskFactors = {
      // Time-based factors
      offHours: isOffHours(riskContext.timestamp),
      weekend: isWeekend(riskContext.timestamp),
      
      // Event-based factors
      highRiskEvent: isHighRiskEvent(riskContext.eventType),
      adminEvent: isAdminEvent(riskContext.eventType),
      
      // Context-based factors
      newDevice: await isNewDevice(ctx, riskContext),
      suspiciousIP: await isSuspiciousIP(ctx, riskContext.ipAddress),
      rapidActions: await hasRapidActions(ctx, riskContext),
      geoAnomaly: await hasGeoAnomaly(ctx, riskContext),
    };

    // Calculate score based on factors
    if (riskFactors.offHours) {
      score += 10;
      factors.push("Ação fora do horário comercial");
    }

    if (riskFactors.weekend) {
      score += 5;
      factors.push("Ação durante final de semana");
    }

    if (riskFactors.highRiskEvent) {
      score += 25;
      factors.push("Operação de alto risco");
    }

    if (riskFactors.adminEvent) {
      score += 15;
      factors.push("Operação administrativa");
    }

    if (riskFactors.newDevice) {
      score += 20;
      factors.push("Novo dispositivo detectado");
    }

    if (riskFactors.suspiciousIP) {
      score += 30;
      factors.push("IP suspeito ou blacklistado");
    }

    if (riskFactors.rapidActions) {
      score += 25;
      factors.push("Múltiplas ações em sequência rápida");
    }

    if (riskFactors.geoAnomaly) {
      score += 35;
      factors.push("Localização geográfica anômala");
    }

    // Additional pattern-based risk factors
    if (riskContext.recentActions) {
      const suspiciousPatterns = detectSuspiciousPatterns(riskContext.recentActions);
      score += suspiciousPatterns.length * 10;
      factors.push(...suspiciousPatterns);
    }

    // User behavior score adjustment
    if (riskContext.userBehaviorScore !== undefined) {
      if (riskContext.userBehaviorScore < 30) {
        score += 20;
        factors.push("Comportamento do usuário atípico");
      }
    }

    // Cap the score at 100
    score = Math.min(score, 100);

    // Determine if anomalous (score > 60 is considered anomalous)
    const isAnomalous = score > 60;

    // Generate recommendation
    let recommendation: string | undefined;
    if (score >= 80) {
      recommendation = "Investigação imediata recomendada - risco crítico";
    } else if (score >= 60) {
      recommendation = "Monitoramento adicional recomendado - risco alto";
    } else if (score >= 40) {
      recommendation = "Revisão recomendada - risco médio";
    }

    return {
      score,
      factors,
      isAnomalous,
      recommendation,
    };

  } catch (error) {
    console.error("Erro ao calcular risk score:", error);
    return {
      score: 0,
      factors: ["Erro na avaliação de risco"],
      isAnomalous: false,
    };
  }
}

/**
 * Create audit log entry with automatic context extraction
 */
export async function createAuditLog(
  ctx: MutationCtx,
  input: Partial<CreateAuditLogInput> & {
    event: {
      type: AuditEventType;
      action: string;
      category?: AuditEventCategory;
      severity?: AuditEventSeverity;
    };
    resource?: {
      type: string;
      id: string;
      name?: string;
    };
    metadata?: Record<string, any>;
    status?: AuditStatus;
    request?: any;
  }
): Promise<Id<"auditLogs">> {
  try {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado para auditoria");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("Usuário não encontrado para auditoria");
    }

    const requestContext = extractRequestContext(input.request);
    const eventCategory = input.event.category || categorizeEvent(input.event.type);
    const eventSeverity = input.event.severity || assessEventSeverity(input.event.type);

    const auditLogData = {
      actor: {
        userId: currentUserId,
        role: currentUserRole as UserRole,
        name: currentUser.name || "Unknown",
        email: currentUser.email,
      },
      
      event: {
        type: input.event.type,
        action: input.event.action,
        category: eventCategory,
        severity: eventSeverity,
      },
      
      resource: input.resource,
      
      source: {
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        platform: requestContext.platform,
      },
      
      status: input.status || "success",
      metadata: input.metadata,
      
      compliance: {
        regulations: ["LGPD", "ISO27001"],
        retentionPeriod: 180, // Default 6 months
        isPersonalData: isPersonalDataEvent(input.event.type, input.resource?.type),
      },
      
      timestamp: Date.now(),
      expiresAt: Date.now() + (180 * 24 * 60 * 60 * 1000), // 6 months
    };

    return await ctx.db.insert("auditLogs", auditLogData);

  } catch (error) {
    console.error("Erro ao criar audit log:", error);
    throw error;
  }
}

/**
 * Helper function to log asset operations
 */
export async function logAssetOperation(
  ctx: MutationCtx,
  operation: "create" | "update" | "delete" | "feature_toggle" | "status_change",
  assetType: string,
  assetId: string,
  assetName?: string,
  metadata?: Record<string, any>
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    create: "asset_create" as AuditEventType,
    update: "asset_update" as AuditEventType,
    delete: "asset_delete" as AuditEventType,
    feature_toggle: "asset_feature_toggle" as AuditEventType,
    status_change: "asset_status_change" as AuditEventType,
  };

  const actionMap = {
    create: "criou",
    update: "atualizou",
    delete: "excluiu",
    feature_toggle: "alterou destaque de",
    status_change: "alterou status de",
  };

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} ${assetType} "${assetName || assetId}"`,
      category: "asset_management",
      severity: operation === "delete" ? "high" : "medium",
    },
    resource: {
      type: assetType,
      id: assetId,
      name: assetName,
    },
    metadata,
  });
}

/**
 * Helper function to log permission operations
 */
export async function logPermissionOperation(
  ctx: MutationCtx,
  operation: "grant" | "revoke" | "update",
  targetUserId: Id<"users">,
  targetUserName: string,
  permissions: string[],
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    grant: "permission_grant" as AuditEventType,
    revoke: "permission_revoke" as AuditEventType,
    update: "permission_update" as AuditEventType,
  };

  const actionMap = {
    grant: "concedeu",
    revoke: "revogou",
    update: "atualizou",
  };

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} permissões para ${targetUserName}`,
      category: "authorization",
      severity: "high",
    },
    resource: resourceType && resourceId ? {
      type: resourceType,
      id: resourceId,
    } : undefined,
    metadata: {
      ...metadata,
      targetUserId: targetUserId.toString(),
      permissions,
    },
    request,
  });
}

/**
 * Helper function to log booking operations
 */
export async function logBookingOperation(
  ctx: MutationCtx,
  operation: "create" | "update" | "cancel" | "confirm",
  bookingType: string,
  bookingId: string,
  confirmationCode?: string,
  amount?: number,
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    create: "booking_create" as AuditEventType,
    update: "booking_update" as AuditEventType,
    cancel: "booking_cancel" as AuditEventType,
    confirm: "booking_confirm" as AuditEventType,
  };

  const actionMap = {
    create: "criou",
    update: "atualizou",
    cancel: "cancelou",
    confirm: "confirmou",
  };

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} reserva ${bookingType} ${confirmationCode || bookingId}`,
      category: "booking_management",
      severity: operation === "cancel" ? "medium" : "low",
    },
    resource: {
      type: bookingType,
      id: bookingId,
    },
    metadata: {
      ...metadata,
      confirmationCode,
      amount,
    },
    request,
  });
}

/**
 * Helper function to log admin reservation operations
 */
export async function logAdminReservationOperation(
  ctx: MutationCtx,
  operation: "create" | "update" | "cancel" | "confirm" | "delete",
  reservationId: string,
  confirmationCode?: string,
  travelerName?: string,
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    create: "admin_reservation_create" as AuditEventType,
    update: "admin_reservation_update" as AuditEventType,
    cancel: "admin_reservation_cancel" as AuditEventType,
    confirm: "admin_reservation_confirm" as AuditEventType,
    delete: "admin_reservation_delete" as AuditEventType,
  };

  const actionMap = {
    create: "criou",
    update: "atualizou",
    cancel: "cancelou",
    confirm: "confirmou",
    delete: "excluiu",
  };

  const travelerInfo = travelerName ? ` para ${travelerName}` : "";
  const codeInfo = confirmationCode ? ` (${confirmationCode})` : "";

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} reserva administrativa${travelerInfo}${codeInfo}`,
      category: "admin_reservation_management",
      severity: operation === "delete" || operation === "cancel" ? "high" : "medium",
    },
    resource: {
      type: "admin_reservation",
      id: reservationId,
      name: confirmationCode,
    },
    metadata: {
      ...metadata,
      confirmationCode,
      travelerName,
      operation,
    },
    request,
  });
}

/**
 * Helper function to log package proposal operations
 */
export async function logPackageProposalOperation(
  ctx: MutationCtx,
  operation: "create" | "update" | "send" | "approve" | "reject" | "accept" | "convert" | "delete",
  proposalId: string,
  proposalNumber?: string,
  packageRequestId?: string,
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    create: "package_proposal_create" as AuditEventType,
    update: "package_proposal_update" as AuditEventType,
    send: "package_proposal_send" as AuditEventType,
    approve: "package_proposal_approve" as AuditEventType,
    reject: "package_proposal_reject" as AuditEventType,
    accept: "package_proposal_accept" as AuditEventType,
    convert: "package_proposal_convert" as AuditEventType,
    delete: "package_proposal_delete" as AuditEventType,
  };

  const actionMap = {
    create: "criou",
    update: "atualizou",
    send: "enviou",
    approve: "aprovou",
    reject: "rejeitou",
    accept: "aceitou",
    convert: "converteu",
    delete: "excluiu",
  };

  const proposalInfo = proposalNumber ? ` ${proposalNumber}` : "";
  const requestInfo = packageRequestId ? ` (solicitação ${packageRequestId})` : "";

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} proposta de pacote${proposalInfo}${requestInfo}`,
      category: "package_management",
      severity: operation === "delete" || operation === "convert" ? "high" : "medium",
    },
    resource: {
      type: "package_proposal",
      id: proposalId,
      name: proposalNumber,
    },
    metadata: {
      ...metadata,
      proposalNumber,
      packageRequestId,
      operation,
    },
    request,
  });
}

/**
 * Helper function to log auto-confirmation setting operations
 */
export async function logAutoConfirmationOperation(
  ctx: MutationCtx,
  operation: "create" | "update" | "enable" | "disable" | "delete",
  settingId: string,
  assetType: string,
  assetId: string,
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    create: "auto_confirmation_create" as AuditEventType,
    update: "auto_confirmation_update" as AuditEventType,
    enable: "auto_confirmation_enable" as AuditEventType,
    disable: "auto_confirmation_disable" as AuditEventType,
    delete: "auto_confirmation_delete" as AuditEventType,
  };

  const actionMap = {
    create: "criou",
    update: "atualizou",
    enable: "habilitou",
    disable: "desabilitou",
    delete: "excluiu",
  };

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} configuração de auto-confirmação para ${assetType}`,
      category: "system_admin",
      severity: operation === "delete" ? "high" : "medium",
    },
    resource: {
      type: "auto_confirmation_setting",
      id: settingId,
      name: `${assetType}:${assetId}`,
    },
    metadata: {
      ...metadata,
      assetType,
      assetId,
      operation,
    },
    request,
  });
}

/**
 * Helper function to log reservation communication events
 */
export async function logReservationCommunication(
  ctx: MutationCtx,
  operation: "chat_created" | "message_sent" | "status_changed" | "assigned",
  communicationType: "chat" | "email" | "sms" | "notification",
  reservationId: string,
  reservationType: "admin_reservation" | "regular_booking",
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const eventTypeMap = {
    chat_created: "reservation_chat_create" as AuditEventType,
    message_sent: "reservation_message_send" as AuditEventType,
    status_changed: "reservation_comm_status_change" as AuditEventType,
    assigned: "reservation_comm_assign" as AuditEventType,
  };

  const actionMap = {
    chat_created: "criou chat de",
    message_sent: "enviou mensagem sobre",
    status_changed: "alterou status de comunicação da",
    assigned: "atribuiu comunicação da",
  };

  return await createAuditLog(ctx, {
    event: {
      type: eventTypeMap[operation],
      action: `${actionMap[operation]} reserva via ${communicationType}`,
      category: "communication",
      severity: "low",
    },
    resource: {
      type: reservationType,
      id: reservationId,
    },
    metadata: {
      ...metadata,
      communicationType,
      reservationType,
      operation,
    },
    request,
  });
}

/**
 * Helper function to log bulk operations
 */
export async function logBulkOperation(
  ctx: MutationCtx,
  operation: "bulk_create" | "bulk_update" | "bulk_delete" | "bulk_confirm" | "bulk_cancel",
  resourceType: string,
  affectedIds: string[],
  metadata?: Record<string, any>,
  request?: any
): Promise<Id<"auditLogs">> {
  const actionMap = {
    bulk_create: "criou em massa",
    bulk_update: "atualizou em massa",
    bulk_delete: "excluiu em massa",
    bulk_confirm: "confirmou em massa",
    bulk_cancel: "cancelou em massa",
  };

  return await createAuditLog(ctx, {
    event: {
      type: "bulk_operation",
      action: `${actionMap[operation]} ${affectedIds.length} ${resourceType}(s)`,
      category: "system_admin",
      severity: "high",
    },
    resource: {
      type: resourceType,
      id: "bulk_operation",
      name: `${affectedIds.length} items`,
    },
    metadata: {
      ...metadata,
      operation,
      affectedCount: affectedIds.length,
      affectedIds: affectedIds.slice(0, 10), // Limit to first 10 IDs
      totalAffected: affectedIds.length,
    },
    request,
  });
}

// Helper functions for risk assessment

function isOffHours(timestamp: number): boolean {
  const date = new Date(timestamp);
  const hour = date.getHours();
  return hour < 8 || hour > 18; // Outside 8 AM - 6 PM
}

function isWeekend(timestamp: number): boolean {
  const date = new Date(timestamp);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function isHighRiskEvent(eventType: AuditEventType): boolean {
  const highRiskEvents: AuditEventType[] = [
    "delete", "asset_delete", "permission_grant", "permission_revoke",
    "role_change", "system_config_change", "bulk_operation"
  ];
  return highRiskEvents.includes(eventType);
}

function isAdminEvent(eventType: AuditEventType): boolean {
  const adminEvents: AuditEventType[] = [
    "permission_grant", "permission_revoke", "permission_update",
    "role_change", "system_config_change", "bulk_operation"
  ];
  return adminEvents.includes(eventType);
}

async function isNewDevice(ctx: QueryCtx | MutationCtx, riskContext: RiskContext): Promise<boolean> {
  if (!riskContext.userAgent) return false;
  
  // Check if this user agent has been seen before for this user in the last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const existingLogs = await ctx.db
    .query("auditLogs")
    .withIndex("by_actor_timestamp", q => 
      q.eq("actor.userId", riskContext.userId).gte("timestamp", thirtyDaysAgo)
    )
    .filter(q => q.eq(q.field("source.userAgent"), riskContext.userAgent))
    .take(1);
    
  return existingLogs.length === 0;
}

async function isSuspiciousIP(ctx: QueryCtx | MutationCtx, ipAddress: string): Promise<boolean> {
  // Simple checks - in production, integrate with threat intelligence feeds
  const suspiciousPatterns = [
    /^10\./, // Private IP ranges might be suspicious depending on context
    /^172\.16\./, 
    /^192\.168\./,
  ];
  
  // Check if IP has been associated with failed attempts
  const recentFailures = await ctx.db
    .query("auditLogs")
    .withIndex("by_ip", q => q.eq("source.ipAddress", ipAddress))
    .filter(q => q.eq(q.field("status"), "failure"))
    .take(5);
    
  return recentFailures.length >= 3;
}

async function hasRapidActions(ctx: QueryCtx | MutationCtx, riskContext: RiskContext): Promise<boolean> {
  // Check for more than 10 actions in the last 5 minutes
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  const recentActions = await ctx.db
    .query("auditLogs")
    .withIndex("by_actor_timestamp", q => 
      q.eq("actor.userId", riskContext.userId).gte("timestamp", fiveMinutesAgo)
    )
    .take(11);
    
  return recentActions.length > 10;
}

async function hasGeoAnomaly(ctx: QueryCtx | MutationCtx, riskContext: RiskContext): Promise<boolean> {
  // Simple geo-anomaly detection
  // In production, use more sophisticated geolocation services
  return false; // Placeholder - implement with actual geolocation service
}

function detectSuspiciousPatterns(recentActions: AuditEventType[]): string[] {
  const patterns: string[] = [];
  
  // Pattern: Multiple failed login attempts
  const failedLogins = recentActions.filter(action => action === "login").length;
  if (failedLogins >= 3) {
    patterns.push("Múltiplas tentativas de login");
  }
  
  // Pattern: Rapid permission changes
  const permissionChanges = recentActions.filter(action => 
    action.includes("permission") || action === "role_change"
  ).length;
  if (permissionChanges >= 2) {
    patterns.push("Múltiplas alterações de permissão");
  }
  
  // Pattern: Mass deletion
  const deletions = recentActions.filter(action => 
    action === "delete" || action === "asset_delete"
  ).length;
  if (deletions >= 3) {
    patterns.push("Múltiplas exclusões");
  }
  
  return patterns;
}

// Helper functions for categorization and classification

function categorizeEvent(eventType: AuditEventType): AuditEventCategory {
  const categoryMap: Record<AuditEventType, AuditEventCategory> = {
    login: "authentication",
    logout: "authentication",
    password_change: "authentication",
    permission_grant: "authorization",
    permission_revoke: "authorization",
    permission_update: "authorization",
    role_change: "authorization",
    create: "data_modification",
    update: "data_modification",
    delete: "data_modification",
    asset_create: "asset_management",
    asset_update: "asset_management",
    asset_delete: "asset_management",
    asset_feature_toggle: "asset_management",
    asset_status_change: "asset_management",
    booking_create: "booking_management",
    booking_update: "booking_management",
    booking_cancel: "booking_management",
    booking_confirm: "booking_management",
    // Admin Reservation Operations
    admin_reservation_create: "admin_reservation_management",
    admin_reservation_update: "admin_reservation_management", 
    admin_reservation_cancel: "admin_reservation_management",
    admin_reservation_confirm: "admin_reservation_management",
    admin_reservation_delete: "admin_reservation_management",
    // Package Proposal Operations
    package_proposal_create: "package_management",
    package_proposal_update: "package_management",
    package_proposal_send: "package_management",
    package_proposal_viewed: "package_management",
    package_proposal_approve: "package_management",
    package_proposal_reject: "package_management",
    package_proposal_accept: "package_management",
    package_proposal_convert: "package_management",
    package_proposal_delete: "package_management",
    package_proposal_attachment_add: "package_management",
    package_proposal_attachment_remove: "document_management",
    package_proposal_template_create: "template_management",
    package_proposal_template_update: "template_management",
    package_proposal_template_delete: "template_management",

    // Auto-Confirmation Operations
    auto_confirmation_create: "auto_confirmation_management",
    auto_confirmation_update: "auto_confirmation_management",
    auto_confirmation_enable: "auto_confirmation_management",
    auto_confirmation_disable: "auto_confirmation_management",
    auto_confirmation_delete: "auto_confirmation_management",
    // Reservation Communication
    reservation_chat_create: "communication",
    reservation_message_send: "communication",
    reservation_comm_status_change: "communication",
    reservation_comm_assign: "communication",
    organization_create: "user_management",
    organization_update: "user_management",
    organization_delete: "user_management",
    system_config_change: "system_admin",
    bulk_operation: "system_admin",
    media_upload: "data_modification",
    media_delete: "data_modification",
    chat_room_create: "communication",
    chat_message_send: "communication",
    chat_status_change: "communication",
    other: "other",
  };
  
  return categoryMap[eventType] || "other";
}

function assessEventSeverity(eventType: AuditEventType): AuditEventSeverity {
  const highSeverityEvents: AuditEventType[] = [
    "delete", "asset_delete", "permission_grant", "permission_revoke",
    "role_change", "system_config_change", "organization_delete"
  ];
  
  const criticalSeverityEvents: AuditEventType[] = [
    "bulk_operation"
  ];
  
  if (criticalSeverityEvents.includes(eventType)) {
    return "critical";
  }
  
  if (highSeverityEvents.includes(eventType)) {
    return "high";
  }
  
  const mediumSeverityEvents: AuditEventType[] = [
    "update", "asset_update", "asset_feature_toggle", "asset_status_change",
    "permission_update", "booking_cancel", "organization_update"
  ];
  
  if (mediumSeverityEvents.includes(eventType)) {
    return "medium";
  }
  
  return "low";
}

function isPersonalDataEvent(eventType: AuditEventType, resourceType?: string): boolean {
  const personalDataEvents: AuditEventType[] = [
    "login", "logout", "password_change", "create", "update", "booking_create",
    "booking_update", "chat_message_send"
  ];
  
  const personalDataResources = ["users", "bookings", "chat"];
  
  const isPersonalEvent = personalDataEvents.includes(eventType);
  const isPersonalResource = resourceType ? personalDataResources.some(type => resourceType.includes(type)) : false;
  
  return isPersonalEvent || isPersonalResource;
}

// Placeholder functions - implement with actual services in production

async function getLocationFromIP(ipAddress: string): Promise<{ country?: string; city?: string; region?: string; } | undefined> {
  // Implement with actual geolocation service (e.g., MaxMind, IPStack)
  return undefined;
}

async function getResourceOrganization(ctx: QueryCtx | MutationCtx, resourceType: string, resourceId: string): Promise<Id<"partnerOrganizations"> | undefined> {
  // Get organization ID from resource if applicable
  try {
    if (resourceType === "partnerOrganizations") {
      return resourceId as Id<"partnerOrganizations">;
    }
    // Add logic for other resource types
    return undefined;
  } catch {
    return undefined;
  }
}

async function getResourcePartner(ctx: QueryCtx | MutationCtx, resourceType: string, resourceId: string): Promise<Id<"users"> | undefined> {
  // Get partner ID from resource if applicable
  try {
    const resourceTables = ["restaurants", "events", "activities", "accommodations"];
    if (resourceTables.includes(resourceType)) {
      const resource = await ctx.db.get(resourceId as any);
      if (resource && 'partnerId' in resource) {
        return resource.partnerId as Id<"users">;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
} 