/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { queryWithRole } from "./query";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import type { Id } from "../../_generated/dataModel";

type PermissionDoc = {
  _id: Id<"assetPermissions">;
  assetId: string;
  assetType: string;
  permissions: string[];
  note?: string;
  partnerId: Id<"users">;
};

type EmployeeDoc = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  partnerId?: Id<"users">;
};

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

    // Se for partner, retorna:
    // 1. Employees que possuem assetPermissions concedidas por este partner
    // 2. Employees criados/associados diretamente a este partner (partnerId)

    // Employees via permissões
    const permissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .collect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeIdsFromPermissions = new Set(
      permissions.map((p: { employeeId: Id<"users"> }) => p.employeeId.toString())
    );

    // Employees via associação direta
    const directEmployees = await ctx.db
      .query("users")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .collect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const combinedIds = new Set<string>([
      ...employeeIdsFromPermissions,
      ...directEmployees.map((e: { _id: Id<"users"> }) => e._id.toString()),
    ]);

    if (combinedIds.size === 0) {
      return [];
    }

    // Já temos os employees associados diretamente
    const employees: EmployeeDoc[] = [...directEmployees as EmployeeDoc[]];

    // IDs que ainda não temos carregados (via permissões)
    const missingIds = [...employeeIdsFromPermissions].filter((id) =>
      !directEmployees.some((d) => d._id.toString() === id)
    );

    if (missingIds.length > 0) {
      const extra = await ctx.db
        .query("users")
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "employee"),
            q.or(...missingIds.map((id) => q.eq(q.field("_id"), id as Id<"users">)))
          )
        )
        .collect();
      employees.push(...(extra as EmployeeDoc[]));
    }

    return employees;
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
      (permissions as PermissionDoc[]).map(async (permission) => {
        const assetId = permission.assetId;
        const assetType = permission.assetType;
        
        // Busca o asset baseado no tipo
        let asset: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
        let assetDetails: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
        
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
      // Log more details for debugging
      console.error("Employee not found in listEmployeePermissions:", {
        employeeId: args.employeeId,
        currentUserId,
        currentUserRole,
        timestamp: new Date().toISOString()
      });
      
      // Return empty array instead of throwing error to prevent UI breaks
      return [];
    }

    let permissions: any[] = [];

    // Se for master, retorna todas as permissões do employee
    if (currentUserRole === "master") {
      permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .collect();
    } else {
      // Se for partner, retorna apenas as permissões do employee criadas por este partner
      permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_partner", (q) => 
          q.eq("employeeId", args.employeeId).eq("partnerId", currentUserId)
        )
        .collect();
    }

    // Para cada permissão, busca os detalhes do asset
    const permissionsWithAssets = await Promise.all(
             permissions.map(async (permission) => {
         let asset: any = null;
        
                 try {
           // Busca o asset baseado no tipo
           if (permission.assetType === "restaurants") {
             const restaurantAsset = await ctx.db.get(permission.assetId as Id<"restaurants">);
             if (restaurantAsset) {
               asset = {
                 name: restaurantAsset.name,
                 description: restaurantAsset.description,
                 isActive: restaurantAsset.isActive,
                 location: restaurantAsset.address?.city || "Não informado"
               };
             }
           }
           else if (permission.assetType === "events") {
             const eventAsset = await ctx.db.get(permission.assetId as Id<"events">);
             if (eventAsset) {
               asset = {
                 title: eventAsset.title,
                 description: eventAsset.description,
                 isActive: eventAsset.isActive,
                 date: eventAsset.date,
                 location: eventAsset.location || "Não informado"
               };
             }
           }
           else if (permission.assetType === "activities") {
             const activityAsset = await ctx.db.get(permission.assetId as Id<"activities">);
             if (activityAsset) {
               asset = {
                 title: activityAsset.title,
                 description: activityAsset.description,
                 isActive: activityAsset.isActive,
                 duration: activityAsset.duration,
                 difficulty: activityAsset.difficulty
               };
             }
           }
           else if (permission.assetType === "vehicles") {
             const vehicleAsset = await ctx.db.get(permission.assetId as Id<"vehicles">);
             if (vehicleAsset) {
               asset = {
                 name: vehicleAsset.name,
                 brand: vehicleAsset.brand,
                 model: vehicleAsset.model,
                 status: vehicleAsset.status,
                 year: vehicleAsset.year
               };
             }
           }
           else if (permission.assetType === "accommodations") {
             const accommodationAsset = await ctx.db.get(permission.assetId as Id<"accommodations">);
             if (accommodationAsset) {
               asset = {
                 name: accommodationAsset.name,
                 description: accommodationAsset.description,
                 isActive: accommodationAsset.isActive,
                 location: accommodationAsset.address?.city || "Não informado"
               };
             }
           }
        } catch (error) {
          console.error(`Error fetching asset ${permission.assetId}:`, error);
          // Asset pode ter sido deletado, mantém a permissão sem detalhes
        }

        return {
          ...permission,
          asset
        };
      })
    );

    return permissionsWithAssets;
  },
});

/**
 * Lista todas as organizações de um partner
 */
export const listPartnerOrganizations = queryWithRole(["partner", "master"])({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Se for master, retorna todas as organizações
    if (currentUserRole === "master") {
      return await ctx.db.query("partnerOrganizations").collect();
    }

    // Se for partner, retorna apenas suas organizações
    return await ctx.db
      .query("partnerOrganizations")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .collect();
  },
});

/**
 * Obtém uma organização específica por ID
 */
export const getOrganization = queryWithRole(["partner", "master", "employee"])({
  args: {
    organizationId: v.id("partnerOrganizations"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Masters podem ver qualquer organização
    if (currentUserRole === "master") {
      return organization;
    }

    // Partners só podem ver suas próprias organizações
    if (currentUserRole === "partner") {
      if (organization.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para ver esta organização");
      }
      return organization;
    }

    // Employees só podem ver organizações onde têm permissões
    if (currentUserRole === "employee") {
      const hasOrganizationPermission = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee_organization", (q) => 
          q.eq("employeeId", currentUserId).eq("organizationId", args.organizationId)
        )
        .first();

      if (!hasOrganizationPermission) {
        throw new Error("Você não tem permissão para ver esta organização");
      }
      return organization;
    }

    throw new Error("Acesso negado");
  },
});

/**
 * Lista todos os assets de uma organização específica
 */
export const listOrganizationAssets = queryWithRole(["partner", "master", "employee"])({
  args: {
    organizationId: v.id("partnerOrganizations"),
    assetType: v.optional(v.string()), // Filtro opcional por tipo
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verifica se a organização existe
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica permissões
    if (currentUserRole === "partner") {
      if (organization.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para ver os assets desta organização");
      }
    } else if (currentUserRole === "employee") {
      // Verifica se o employee tem permissão para esta organização específica
      const hasOrganizationPermission = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee_organization", (q) => 
          q.eq("employeeId", currentUserId).eq("organizationId", args.organizationId)
        )
        .first();

      if (!hasOrganizationPermission) {
        throw new Error("Você não tem permissão para ver os assets desta organização");
      }
    }

    // Busca os assets da organização
    let query = ctx.db
      .query("partnerAssets")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId));

    if (args.assetType) {
      query = ctx.db
        .query("partnerAssets")
        .withIndex("by_organization_type", (q) => 
          q.eq("organizationId", args.organizationId).eq("assetType", args.assetType)
        );
    }

    const partnerAssets = await query.collect();

    // Para cada asset, busca os dados completos
    const assetsWithDetails = await Promise.all(
      partnerAssets.map(async (partnerAsset) => {
        let assetDetails = null;

        switch (partnerAsset.assetType) {
          case "restaurants":
            assetDetails = await ctx.db.get(partnerAsset.assetId as any);
            break;
          case "events":
            assetDetails = await ctx.db.get(partnerAsset.assetId as any);
            break;
          case "activities":
            assetDetails = await ctx.db.get(partnerAsset.assetId as any);
            break;
          case "vehicles":
            assetDetails = await ctx.db.get(partnerAsset.assetId as any);
            break;
          case "accommodations":
            assetDetails = await ctx.db.get(partnerAsset.assetId as any);
            break;
          default:
            break;
        }

        return {
          ...partnerAsset,
          assetDetails,
        };
      })
    );

    return assetsWithDetails.filter(asset => asset.assetDetails !== null);
  },
});

/**
 * Lista todos os assets que um partner possui, para gerenciamento de permissões.
 * Agrupa por tipo (eventos, restaurantes, etc).
 */
export const listPartnerAssets = queryWithRole(["partner", "master"])({
  args: {},
  returns: v.any(),
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

    // Busca os assets por tipo (versão antiga)
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

    // Vehicles usa ownerId em vez de partnerId
    const vehicles = await ctx.db
      .query("vehicles")
      .collect()
      .then(items => items.filter(item => isOwner(item.ownerId)));

    const accommodations = await ctx.db
      .query("accommodations")
      .collect()
      .then(items => items.filter(item => isOwner(item.partnerId)));

    const media = await ctx.db
      .query("media")
      .collect()
      .then(items => items.filter(item => isOwner(item.partnerId)));

    const result = {
      events,
      restaurants,
      activities,
      vehicles,
      accommodations,
      media
    };

    return result;
  }
});

/**
 * Obtém um convite pelo token, validando status e expiração.
 * Usado para onboarding via link de convite.
 */
export const getInvite = query({
  args: { token: v.string() },
  returns: v.object({
    _id: v.id("invites"),
    employeeId: v.id("users"),
    email: v.string(),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!invite) throw new Error("Convite não encontrado");
    if (invite.status !== "pending") throw new Error("Convite já utilizado ou cancelado");
    if (Date.now() > invite.expiresAt) throw new Error("Convite expirado");
    return invite;
  },
});

/**
 * Lista todas as permissões de organizações concedidas por um partner ou todas (para master)
 */
export const listAllOrganizationPermissions = queryWithRole(["partner", "master"])({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    let permissions;

    // Master vê todas as permissões
    if (currentUserRole === "master") {
      permissions = await ctx.db.query("organizationPermissions").collect();
    } else {
      // Partner vê apenas as permissões que ele concedeu
      permissions = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    }

    // Para cada permissão, busca dados completos do employee e organização
    const permissionsWithDetails = await Promise.all(
      permissions.map(async (permission) => {
        const employee = await ctx.db.get(permission.employeeId);
        const organization = await ctx.db.get(permission.organizationId);
        const partner = await ctx.db.get(permission.partnerId);

        return {
          _id: permission._id,
          employeeId: permission.employeeId,
          partnerId: permission.partnerId,
          organizationId: permission.organizationId,
          permissions: permission.permissions,
          note: permission.note,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
          employee: employee ? {
            id: employee._id,
            name: employee.name,
            email: employee.email,
            image: employee.image,
          } : null,
          organization: organization ? {
            id: organization._id,
            name: organization.name,
            description: organization.description,
            type: organization.type,
            image: organization.image,
          } : null,
          partner: partner ? {
            id: partner._id,
            name: partner.name,
            email: partner.email,
          } : null,
        };
      })
    );

    return permissionsWithDetails.filter(p => p.employee && p.organization);
  },
});

/**
 * Lista todas as organizações que um employee pode acessar, com suas permissões
 */
export const listEmployeeOrganizations = queryWithRole(["partner", "master", "employee"])({
  args: {
    // ID opcional do employee (apenas partners e masters podem especificar outro employee)
    employeeId: v.optional(v.id("users")),
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
      throw new Error("Você só pode visualizar suas próprias organizações");
    }
    
    // Partners só podem ver permissões de seus employees
    if (currentUserRole === "partner") {
      // Verifica se o employee pertence a este partner
      const permissions = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", targetEmployeeId))
        .filter((q) => q.eq(q.field("partnerId"), currentUserId))
        .collect();
      
      if (permissions.length === 0 && targetEmployeeId.toString() !== currentUserId.toString()) {
        throw new Error("Este employee não pertence a você");
      }
    }
    
    // Busca as permissões do employee
    const permissions = await ctx.db
      .query("organizationPermissions")
      .withIndex("by_employee", (q) => q.eq("employeeId", targetEmployeeId))
      .collect();

    // Para cada permissão, busca os dados completos da organização
    const organizationsWithPermissions = await Promise.all(
      permissions.map(async (permission) => {
        const organization = await ctx.db.get(permission.organizationId);
        
        if (!organization) return null;
        
        // Busca informações do partner dono da organização
        const partner = await ctx.db.get(permission.partnerId);
        
        return {
          permissionId: permission._id,
          organizationId: permission.organizationId,
          permissions: permission.permissions,
          note: permission.note,
          organization: {
            id: organization._id,
            name: organization.name,
            description: organization.description,
            type: organization.type,
            image: organization.image,
            isActive: organization.isActive,
          },
          partner: partner ? {
            id: partner._id,
            name: partner.name,
            email: partner.email,
          } : null,
        };
      })
    );
    
    // Filtra out nulls (em caso de organizações que foram removidas)
    return organizationsWithPermissions.filter(Boolean);
  },
});

/**
 * Obtém as permissões de um employee para uma organização específica
 */
export const getEmployeeOrganizationPermission = queryWithRole(["partner", "master", "employee"])({
  args: {
    employeeId: v.id("users"),
    organizationId: v.id("partnerOrganizations"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Employees só podem ver suas próprias permissões
    if (currentUserRole === "employee" && args.employeeId.toString() !== currentUserId.toString()) {
      throw new Error("Você só pode visualizar suas próprias permissões");
    }
    
    // Busca a permissão específica
    const permission = await ctx.db
      .query("organizationPermissions")
      .withIndex("by_employee_organization", (q) => 
        q.eq("employeeId", args.employeeId).eq("organizationId", args.organizationId)
      )
      .first();
      
    if (!permission) {
      return null;
    }
    
    // Partners só podem ver permissões que eles concederam
    if (currentUserRole === "partner" && permission.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para ver esta permissão");
    }
    
    // Busca dados completos
    const employee = await ctx.db.get(permission.employeeId);
    const organization = await ctx.db.get(permission.organizationId);
    const partner = await ctx.db.get(permission.partnerId);
    
    return {
      _id: permission._id,
      employeeId: permission.employeeId,
      partnerId: permission.partnerId,
      organizationId: permission.organizationId,
      permissions: permission.permissions,
      note: permission.note,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      employee: employee ? {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        image: employee.image,
      } : null,
      organization: organization ? {
        id: organization._id,
        name: organization.name,
        description: organization.description,
        type: organization.type,
        image: organization.image,
      } : null,
      partner: partner ? {
        id: partner._id,
        name: partner.name,
        email: partner.email,
      } : null,
    };
  },
});

/**
 * Obtém informações do usuário atual incluindo seu papel
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      clerkId: v.optional(v.string()),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      role: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) return null;
    
    const user = await ctx.db.get(currentUserId);
    if (!user) return null;
    
    return {
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      image: user.image,
      phoneNumber: user.phoneNumber,
      role: user.role || "traveler",
    };
  },
});



/**
 * Lista organizações baseado no role do usuário:
 * - Masters: todas as organizações
 * - Partners: suas próprias organizações  
 * - Employees: organizações que foram atribuídas a eles
 */
export const listUserOrganizations = queryWithRole(["partner", "master", "employee"])({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    try {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const currentUserRole = await getCurrentUserRole(ctx);

      if (!currentUserId) {
        return [];
      }

      // Se for master, retorna todas as organizações
      if (currentUserRole === "master") {
        return await ctx.db.query("partnerOrganizations").collect();
      }

      // Se for partner, retorna apenas suas organizações
      if (currentUserRole === "partner") {
        return await ctx.db
          .query("partnerOrganizations")
          .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
          .collect();
      }

      // Se for employee, retorna organizações que tem permissão para acessar
      if (currentUserRole === "employee") {
        const permissions = await ctx.db
          .query("organizationPermissions")
          .withIndex("by_employee", (q) => q.eq("employeeId", currentUserId))
          .collect();

        if (permissions.length === 0) {
          return [];
        }

        // Busca as organizações para as quais o employee tem permissão
        const organizationIds = permissions.map(p => p.organizationId);
        
        const organizations = await Promise.all(
          organizationIds.map(async id => {
            try {
              return await ctx.db.get(id);
            } catch (error) {
              return null;
            }
          })
        );

        // Filtra organizações que existem e estão ativas
        return organizations.filter(org => org && org.isActive);
      }

      return [];
    } catch (error) {
      // Instead of throwing, return empty array to prevent UI crashes
      return [];
    }
  },
});

/**
 * Obtém estatísticas de dashboard para partners
 */
export const getPartnerStats = queryWithRole(["partner", "master"])({
  args: {},
  returns: v.object({
    totalAssets: v.number(),
    recentAssets: v.number(),
    monthlyBookings: v.number(),
    bookingGrowth: v.number(),
    monthlyRevenue: v.number(),
    revenueGrowth: v.number(),
    averageRating: v.number(),
    totalReviews: v.number(),
  }),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Busca todos os assets do partner ou TODOS os assets se for master
    let activities, events, restaurants, accommodations, vehicles;
    
    if (currentUserRole === "master") {
      // Masters see ALL assets in the system
      activities = await ctx.db.query("activities").collect();
      events = await ctx.db.query("events").collect();
      restaurants = await ctx.db.query("restaurants").collect();
      accommodations = await ctx.db.query("accommodations").collect();
      vehicles = await ctx.db.query("vehicles").collect();
    } else {
      // Partners see only their own assets
      activities = await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();

      events = await ctx.db
        .query("events")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();

      restaurants = await ctx.db
        .query("restaurants")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();

      accommodations = await ctx.db
        .query("accommodations")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();

      // Para veículos, usa ownerId em vez de partnerId
      vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", currentUserId))
        .collect();
    }

    const totalAssets = activities.length + events.length + restaurants.length + accommodations.length + vehicles.length;

    // Assets criados no último mês
    const lastMonth = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentAssets = [...activities, ...events, ...restaurants, ...accommodations, ...vehicles]
      .filter(asset => asset._creationTime > lastMonth).length;

    // Busca reservas do partner (aproximação usando assets IDs)
    const assetIds = [
      ...activities.map(a => a._id),
      ...events.map(e => e._id),
      ...restaurants.map(r => r._id),
      ...accommodations.map(a => a._id),
      ...vehicles.map(v => v._id),
    ];

    // Reservas do mês atual
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthTime = currentMonthStart.getTime();

    let monthlyBookings = 0;
    let monthlyRevenue = 0;

    // Conta bookings de atividades de forma eficiente
    for (const activity of activities) {
      const bookings = await ctx.db
        .query("activityBookings")
        .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
        .filter((q) => q.gte(q.field("createdAt"), currentMonthTime))
        .collect();
      monthlyBookings += bookings.length;
      monthlyRevenue += bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    }

    // Conta bookings de eventos de forma eficiente
    for (const event of events) {
      const bookings = await ctx.db
        .query("eventBookings")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .filter((q) => q.gte(q.field("createdAt"), currentMonthTime))
        .collect();
      monthlyBookings += bookings.length;
      monthlyRevenue += bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    }

    // Conta reservas de restaurantes de forma eficiente (não têm preço)
    for (const restaurant of restaurants) {
      const reservations = await ctx.db
        .query("restaurantReservations")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
        .filter((q) => q.gte(q.field("_creationTime"), currentMonthTime))
        .collect();
      monthlyBookings += reservations.length;
    }

    // Conta bookings de acomodações de forma eficiente
    for (const accommodation of accommodations) {
      const bookings = await ctx.db
        .query("accommodationBookings")
        .withIndex("by_accommodation", (q) => q.eq("accommodationId", accommodation._id))
        .filter((q) => q.gte(q.field("createdAt"), currentMonthTime))
        .collect();
      monthlyBookings += bookings.length;
      monthlyRevenue += bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    }

    // Conta bookings de veículos de forma eficiente
    for (const vehicle of vehicles) {
      const bookings = await ctx.db
        .query("vehicleBookings")
        .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id))
        .filter((q) => q.gte(q.field("createdAt"), currentMonthTime))
        .collect();
      monthlyBookings += bookings.length;
      monthlyRevenue += bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    }

    // Calcula crescimento (simulado por enquanto - seria baseado em dados históricos)
    const bookingGrowth = Math.floor(Math.random() * 20); // Placeholder
    const revenueGrowth = Math.floor(Math.random() * 15); // Placeholder

    // Calcula avaliação média
    let totalRating = 0;
    let totalReviews = 0;

    activities.forEach(activity => {
      totalRating += activity.rating;
      totalReviews += 1;
    });

    events.forEach(event => {
      // Eventos não têm rating individual, usa rating padrão
      totalRating += 4.5;
      totalReviews += 1;
    });

    restaurants.forEach(restaurant => {
      totalRating += restaurant.rating.overall;
      totalReviews += Number(restaurant.rating.totalReviews);
    });

    accommodations.forEach(accommodation => {
      totalRating += accommodation.rating.overall;
      totalReviews += Number(accommodation.rating.totalReviews);
    });

    const averageRating = totalReviews > 0 ? Number((totalRating / totalAssets).toFixed(1)) : 0;

    return {
      totalAssets,
      recentAssets,
      monthlyBookings,
      bookingGrowth,
      monthlyRevenue: Math.round(monthlyRevenue),
      revenueGrowth,
      averageRating,
      totalReviews,
    };
  },
}); 