import { v } from "convex/values";
import { query } from "../../_generated/server";
import { queryWithRole } from "./query";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import type { Id } from "../../_generated/dataModel";

/**
 * Lista todos os employees associados ao partner atual.
 * Somente partners e masters podem listar employees.
 */
export const listEmployees = queryWithRole(["partner", "master"])({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Se for master, retorna todos os employees
    if (currentUserRole === "master") {
      return await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "employee"))
        .collect();
    }

    // Se for partner, retorna apenas os employees que têm permissões criadas por este partner
    const permissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .collect();

    // Extrai os IDs únicos dos employees
    const employeeIds = [...new Set(permissions.map((p) => p.employeeId.toString()))];

    if (employeeIds.length === 0) {
      return [];
    }

    // Busca os dados dos employees
    return await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "employee"),
          q.or(...employeeIds.map((id) => q.eq(q.field("_id"), id as Id<"users">)))
        )
      )
      .collect();
  },
});

/**
 * Lista todos os assets que um employee pode acessar, com suas permissões
 */
export const listEmployeeAssets = queryWithRole(["partner", "master", "employee"])({
  args: {
    // ID opcional do employee (apenas partners e masters podem especificar outro employee)
    employeeId: v.optional(v.id("users")),
    // Tipo opcional de asset para filtrar
    assetType: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    let targetEmployeeId = args.employeeId;
    
    // Se não foi fornecido um employeeId, usa o usuário atual
    if (!targetEmployeeId) {
      targetEmployeeId = currentUserId;
    }
    
    // Employees só podem ver suas próprias permissões
    if (currentUserRole === "employee" && targetEmployeeId.toString() !== currentUserId.toString()) {
      throw new Error("Você só pode visualizar seus próprios assets");
    }
    
    // Partners só podem ver permissões de seus employees
    if (currentUserRole === "partner") {
      // Verifica se o employee pertence a este partner
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", targetEmployeeId))
        .filter((q) => q.eq(q.field("partnerId"), currentUserId))
        .collect();
      
      if (permissions.length === 0 && targetEmployeeId.toString() !== currentUserId.toString()) {
        throw new Error("Este employee não pertence a você");
      }
    }
    
    // Constrói a query para buscar permissões
    let permissionsQuery = ctx.db
      .query("assetPermissions")
      .withIndex("by_employee", (q) => q.eq("employeeId", targetEmployeeId));
    
    // Aplica filtro por tipo, se especificado
    if (args.assetType) {
      permissionsQuery = permissionsQuery.filter((q) => 
        q.eq(q.field("assetType"), args.assetType)
      );
    }
    
    // Busca todas as permissões para este employee
    const permissions = await permissionsQuery.collect();
    
    // Busca os detalhes de cada asset e adiciona as permissões
    const assetsWithPermissions = await Promise.all(
      permissions.map(async (permission) => {
        const assetId = permission.assetId;
        const assetType = permission.assetType;
        
        // Busca o asset baseado no tipo
        let asset: any = null;
        let assetDetails = {};
        
        if (assetType === "events") {
          asset = await ctx.db.get(assetId as Id<"events">);
          if (asset) {
            assetDetails = {
              title: asset.title || '',
              date: asset.date || '',
              location: asset.location || '',
              isActive: asset.isActive || false,
            };
          }
        }
        else if (assetType === "restaurants") {
          asset = await ctx.db.get(assetId as Id<"restaurants">);
          if (asset) {
            assetDetails = {
              name: asset.name || '',
              location: asset.address?.city || '',
              cuisine: Array.isArray(asset.cuisine) ? asset.cuisine : [],
              isActive: asset.isActive || false,
            };
          }
        }
        else if (assetType === "activities") {
          asset = await ctx.db.get(assetId as Id<"activities">);
          if (asset) {
            assetDetails = {
              title: asset.title || '',
              duration: asset.duration || '',
              difficulty: asset.difficulty || '',
              isActive: asset.isActive || false,
            };
          }
        }
        // Adicionar outros tipos de asset conforme necessário
        
        // Se o asset não existir mais, pula
        if (!asset) return null;
        
        // Busca informações do partner dono do asset
        const partner = await ctx.db.get(permission.partnerId);
        
        return {
          permissionId: permission._id,
          assetId: permission.assetId,
          assetType: permission.assetType,
          permissions: permission.permissions,
          note: permission.note,
          asset: assetDetails,
          partner: partner ? {
            id: partner._id,
            name: partner.name,
            email: partner.email,
          } : null,
        };
      })
    );
    
    // Filtra out nulls (em caso de assets que foram removidos)
    return assetsWithPermissions.filter(Boolean);
  },
});

/**
 * Lista todas as permissões de assets para o partner atual.
 * Somente partners e masters podem listar permissões.
 */
export const listAllAssetPermissions = queryWithRole(["partner", "master"])({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Se for master, retorna todas as permissões
    if (currentUserRole === "master") {
      return await ctx.db.query("assetPermissions").collect();
    }

    // Se for partner, retorna apenas as permissões criadas por este partner
    return await ctx.db
      .query("assetPermissions")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .collect();
  },
});

/**
 * Lista todas as permissões de um employee específico para o partner atual.
 * Somente partners e masters podem listar permissões.
 */
export const listEmployeePermissions = queryWithRole(["partner", "master"])({
  args: {
    employeeId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verifica se o employee existe
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee não encontrado");
    }

    // Se for master, retorna todas as permissões do employee
    if (currentUserRole === "master") {
      return await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .collect();
    }

    // Se for partner, retorna apenas as permissões do employee criadas por este partner
    return await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee_partner", (q) => 
        q.eq("employeeId", args.employeeId).eq("partnerId", currentUserId)
      )
      .collect();
  },
});

/**
 * Lista todos os assets que um partner possui, para gerenciamento de permissões.
 * Agrupa por tipo (eventos, restaurantes, etc).
 */
export const listPartnerAssets = queryWithRole(["partner", "master"])({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Função para verificar se o usuário é o dono do asset
    const isOwner = (partnerId: Id<"users"> | undefined) => {
      if (!partnerId) return false;
      return currentUserRole === "master" || partnerId.toString() === currentUserId.toString();
    };

    // Busca os assets por tipo
    const events = await ctx.db
      .query("events")
      .collect()
      .then(items => items.filter(item => isOwner(item.partnerId)));

    const restaurants = await ctx.db
      .query("restaurants")
      .collect()
      .then(items => items.filter(item => isOwner(item.partnerId)));

    const activities = await ctx.db
      .query("activities")
      .collect()
      .then(items => items.filter(item => isOwner(item.partnerId)));

    const media = await ctx.db
      .query("media")
      .collect()
      .then(items => items.filter(item => isOwner(item.partnerId)));

    return {
      events,
      restaurants,
      activities,
      media
    };
  }
}); 