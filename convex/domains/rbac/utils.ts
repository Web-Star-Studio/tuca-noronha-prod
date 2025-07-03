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