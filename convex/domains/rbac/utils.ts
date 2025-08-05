import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { UserRole } from "./types";

// Union type for Convex function context (query or mutation)
type Ctx = QueryCtx | MutationCtx;

/**
 * Utility function to read the current user's role from Convex "users" table.
 * Fallback to "traveler" if no role has been stored yet.
 */
export async function getCurrentUserRole(ctx: Ctx): Promise<UserRole> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    // Session is not authenticated, consider as "traveler" (anonymous visitor)
    return "traveler";
  }
  // Try to find user by clerkId
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .collect();

  if (users.length === 0) {
    // User is authenticated but not yet synchronized in Convex
    return "traveler";
  }
  return (users[0].role as UserRole) ?? "traveler";
}

/**
 * Helper to enforce that the current user has at least one of the allowed roles.
 */
export async function requireRole(ctx: Ctx, allowedRoles: UserRole[]): Promise<UserRole> {
  const role = await getCurrentUserRole(ctx);
  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized: insufficient role permissions");
  }
  return role;
}

/**
 * Returns the _id of the logged in user's document or null if it doesn't exist
 */
export async function getCurrentUserConvexId(ctx: Ctx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .collect();
  if (users.length === 0) return null;
  return users[0]._id as Id<"users">;
}

/**
 * Verify if a partner has access to a specific resource
 */
export async function verifyPartnerAccess(
  ctx: Ctx, 
  resourceId: Id<any>, 
  resourceTable: string, 
  partnerIdField: string = "partnerId"
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso total a todos os recursos
  if (role === "master") return true;
  
  const resource = await ctx.db.get(resourceId);
  if (!resource) return false;
  
  // Check if the resource belongs to the current user
  return resource[partnerIdField].toString() === currentUserId.toString();
}

/**
 * Verifica se um employee tem permissão explícita para acessar um asset
 */
export async function verifyEmployeeAccess(
  ctx: Ctx,
  assetId: Id<any> | string,
  assetType: string,
  requiredPermission?: string // Ex: "view", "edit", "manage"
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso total a todos os assets
  if (role === "master") return true;
  
  // Partners têm acesso a seus próprios assets (verificado em outra função)
  
  // Employee precisa ter permissão explícita
  if (role === "employee") {
    const permissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee_asset_type", (q) => 
        q.eq("employeeId", currentUserId).eq("assetType", assetType)
      )
      .filter((q) => q.eq(q.field("assetId"), assetId.toString()))
      .collect();
    
    // Se não tiver permissões explícitas, não tem acesso
    if (permissions.length === 0) return false;
    
    // Se não precisar verificar uma permissão específica, basta ter qualquer permissão
    if (!requiredPermission) return true;
    
    // Verifica se tem a permissão específica
    return permissions.some(permission => 
      permission.permissions.includes(requiredPermission)
    );
  }
  
  // Outros papéis (como traveler) não têm acesso a assets no admin
  return false;
}

/**
 * Verifica se um employee tem acesso a uma organização específica
 */
export async function hasOrganizationAccess(
  ctx: Ctx,
  organizationId: Id<"partnerOrganizations">,
  requiredPermission?: string // Ex: "view", "edit", "manage"
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso total a todas as organizações
  if (role === "master") return true;
  
  // Partners têm acesso total a suas próprias organizações
  if (role === "partner") {
    const organization = await ctx.db.get(organizationId);
    if (organization && organization.partnerId.toString() === currentUserId.toString()) {
      return true;
    }
  }
  
  // Employees precisam ter permissão explícita para a organização
  if (role === "employee") {
    const permission = await ctx.db
      .query("organizationPermissions")
      .withIndex("by_employee_organization", (q) => 
        q.eq("employeeId", currentUserId).eq("organizationId", organizationId)
      )
      .first();
    
    // Se não tiver permissões explícitas, não tem acesso
    if (!permission) return false;
    
    // Se não precisar verificar uma permissão específica, basta ter qualquer permissão
    if (!requiredPermission) return true;
    
    // Verifica se tem a permissão específica
    return permission.permissions.includes(requiredPermission);
  }
  
  // Outros papéis (como traveler) não têm acesso a organizações no admin
  return false;
}

/**
 * Verifica se um usuário tem acesso a um asset específico, considerando seu papel
 */
export async function hasAssetAccess(
  ctx: Ctx,
  assetId: Id<any> | string,
  assetType: string,
  requiredPermission?: string
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso total a todos os assets
  if (role === "master") return true;
  
  // Partners têm acesso total a seus próprios assets
  if (role === "partner") {
    // Converte o assetId para string para comparação consistente
    const assetIdStr = assetId.toString();
    
    // Busca o asset para verificar se pertence ao partner
    // Para eventos
    if (assetType === "events") {
      const event = await ctx.db.get(assetIdStr as Id<"events">);
      if (event && event.partnerId.toString() === currentUserId.toString()) {
        return true;
      }
    }
    // Para restaurantes
    else if (assetType === "restaurants") {
      const restaurant = await ctx.db.get(assetIdStr as Id<"restaurants">);
      if (restaurant && restaurant.partnerId.toString() === currentUserId.toString()) {
        return true;
      }
    }
    // Para atividades
    else if (assetType === "activities") {
      const activity = await ctx.db.get(assetIdStr as Id<"activities">);
      if (activity && activity.partnerId.toString() === currentUserId.toString()) {
        return true;
      }
    }
    // Para outros tipos de assets, adicione lógica semelhante
  }
  
  // Employees precisam ter permissão explícita
  return verifyEmployeeAccess(ctx, assetId, assetType, requiredPermission);
}

/**
 * Função para filtrar uma lista de assets com base nas permissões do usuário
 */
export async function filterAccessibleAssets<T extends { _id: Id<any>, partnerId: Id<"users"> }>(
  ctx: Ctx,
  assets: T[],
  assetType: string,
  requiredPermission?: string
): Promise<T[]> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return [];
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso a todos os assets
  if (role === "master") return assets;
  
  // Partners só veem seus próprios assets
  if (role === "partner") {
    return assets.filter(asset => 
      asset.partnerId.toString() === currentUserId.toString()
    );
  }
  
  // Para employees, verificamos permissões explícitas
  if (role === "employee") {
    // Busca todas as permissões do employee para o tipo de asset
    const permissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee_asset_type", (q) => 
        q.eq("employeeId", currentUserId).eq("assetType", assetType)
      )
      .collect();
    
    // Cria um conjunto de IDs de assets para os quais o employee tem permissão
    const accessibleAssetIds = new Set(
      permissions
        .filter(p => !requiredPermission || p.permissions.includes(requiredPermission))
        .map(p => p.assetId)
    );
    
    // Filtra os assets pelos IDs permitidos
    return assets.filter(asset => accessibleAssetIds.has(asset._id.toString()));
  }
  
  // Outros papéis não têm acesso a assets no admin
  return [];
}

/**
 * Verifica se um usuário tem permissão para acessar uma reserva administrativa
 */
export async function hasAdminReservationAccess(
  ctx: Ctx,
  reservationId: Id<"adminReservations">,
  requiredPermission?: "view" | "edit" | "delete"
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso total a todas as reservas
  if (role === "master") return true;
  
  const reservation = await ctx.db.get(reservationId);
  if (!reservation || !reservation.isActive) return false;
  
  // Partners têm acesso a reservas de seus assets
  if (role === "partner") {
    if (reservation.partnerId?.toString() === currentUserId.toString()) {
      return true;
    }
  }
  
  // Employees precisam ter acesso à organização da reserva
  if (role === "employee") {
    const user = await ctx.db.get(currentUserId);
    if (user?.organizationId && reservation.organizationId) {
      return user.organizationId.toString() === reservation.organizationId.toString();
    }
  }
  
  return false;
}

/**
 * Verifica se um usuário tem permissão para criar uma reserva administrativa
 */
export async function canCreateAdminReservation(
  ctx: Ctx,
  assetId: string,
  assetType: string
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters podem criar reservas para qualquer asset
  if (role === "master") return true;
  
  // Partners podem criar reservas para seus próprios assets
  if (role === "partner") {
    return hasAssetAccess(ctx, assetId, assetType, "manage");
  }
  
  // Employees podem criar reservas se tiverem permissão de "manage" no asset
  if (role === "employee") {
    return hasAssetAccess(ctx, assetId, assetType, "manage");
  }
  
  return false;
}

/**
 * Verifica se um usuário tem permissão para acessar propostas de pacotes
 */
export async function hasPackageProposalAccess(
  ctx: Ctx,
  proposalId: Id<"packageProposals">,
  requiredPermission?: "view" | "edit" | "approve" | "delete"
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso total a todas as propostas
  if (role === "master") return true;
  
  const proposal = await ctx.db.get(proposalId);
  if (!proposal || !proposal.isActive) return false;
  
  // Partners têm acesso a propostas de sua organização
  if (role === "partner") {
    if (proposal.partnerId?.toString() === currentUserId.toString()) {
      return true;
    }
  }
  
  // Employees precisam ter acesso à organização da proposta
  if (role === "employee") {
    const user = await ctx.db.get(currentUserId);
    if (user?.organizationId && proposal.organizationId) {
      // Employee pode ver propostas de sua organização
      if (user.organizationId.toString() === proposal.organizationId.toString()) {
        // Para aprovação, verifica se é admin ou se pode aprovar
        if (requiredPermission === "approve") {
          return proposal.adminId.toString() === currentUserId.toString();
        }
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica se um usuário pode configurar auto-confirmação para um asset
 */
export async function canConfigureAutoConfirmation(
  ctx: Ctx,
  assetId: string,
  assetType: string
): Promise<boolean> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return false;
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters podem configurar auto-confirmação para qualquer asset
  if (role === "master") return true;
  
  // Partners podem configurar para seus próprios assets
  if (role === "partner") {
    return hasAssetAccess(ctx, assetId, assetType, "manage");
  }
  
  // Employees precisam ter permissão de "manage" no asset
  if (role === "employee") {
    return hasAssetAccess(ctx, assetId, assetType, "manage");
  }
  
  return false;
}

/**
 * Filtra reservas administrativas com base nas permissões do usuário
 */
export async function filterAccessibleAdminReservations<T extends { _id: Id<"adminReservations">, partnerId?: Id<"users">, organizationId?: Id<"partnerOrganizations"> }>(
  ctx: Ctx,
  reservations: T[]
): Promise<T[]> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return [];
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters têm acesso a todas as reservas
  if (role === "master") return reservations;
  
  // Partners só veem reservas de seus assets
  if (role === "partner") {
    return reservations.filter(reservation => 
      reservation.partnerId?.toString() === currentUserId.toString()
    );
  }
  
  // Employees só veem reservas de sua organização
  if (role === "employee") {
    const user = await ctx.db.get(currentUserId);
    if (!user?.organizationId) return [];
    
    return reservations.filter(reservation => 
      reservation.organizationId?.toString() === user.organizationId?.toString()
    );
  }
  
  // Outros papéis não têm acesso
  return [];
}

/**
 * Obtém os IDs dos assets que um usuário pode acessar para um tipo específico
 */
export async function getAccessibleAssetIds(
  ctx: Ctx,
  assetType: string,
  requiredPermission?: string
): Promise<string[]> {
  const currentUserId = await getCurrentUserConvexId(ctx);
  if (!currentUserId) return [];
  
  const role = await getCurrentUserRole(ctx);
  
  // Masters podem acessar todos os assets (retorna uma lista vazia indicando "todos")
  if (role === "master") return [];
  
  // Partners acessam seus próprios assets
  if (role === "partner") {
    let assets: any[] = [];
    
    // Busca assets do tipo específico para o partner
    if (assetType === "restaurants") {
      assets = await ctx.db
        .query("restaurants")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    } else if (assetType === "activities") {
      assets = await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    } else if (assetType === "events") {
      assets = await ctx.db
        .query("events")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    } else if (assetType === "vehicles") {
      assets = await ctx.db
        .query("vehicles")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", currentUserId))
        .collect();

    }
    
    return assets.map(asset => asset._id.toString());
  }
  
  // Employees acessam apenas assets com permissão explícita
  if (role === "employee") {
    const permissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee_asset_type", (q) => 
        q.eq("employeeId", currentUserId).eq("assetType", assetType)
      )
      .collect();
    
    return permissions
      .filter(p => !requiredPermission || p.permissions.includes(requiredPermission))
      .map(p => p.assetId);
  }
  
  return [];
} 