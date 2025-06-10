import { query } from "../../_generated/server";
import { queryWithRole } from "./query";
import { v } from "convex/values";
import { getCurrentUserConvexId, getCurrentUserRole } from "./utils";

/**
 * Função de teste para verificar se a atribuição de empreendimentos está funcionando
 * Retorna informações sobre as organizações e permissões do usuário atual
 */
export const testOrganizationAccess = queryWithRole(["partner", "master", "employee"])({
  args: {},
  returns: v.object({
    userId: v.id("users"),
    userRole: v.string(),
    organizations: v.array(v.any()),
    permissions: v.array(v.any()),
    employees: v.array(v.any()),
    summary: v.object({
      organizationCount: v.number(),
      permissionCount: v.number(),
      employeeCount: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    let organizations: any[] = [];
    let permissions: any[] = [];
    let employees: any[] = [];

    // Se for master, pega tudo
    if (currentUserRole === "master") {
      organizations = await ctx.db.query("partnerOrganizations").collect();
      permissions = await ctx.db.query("organizationPermissions").collect();
      employees = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "employee"))
        .collect();
    }
    // Se for partner, pega suas organizações e employees
    else if (currentUserRole === "partner") {
      organizations = await ctx.db
        .query("partnerOrganizations")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
      
      permissions = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
      
      employees = await ctx.db
        .query("users")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    }
    // Se for employee, pega organizações que pode acessar
    else if (currentUserRole === "employee") {
      permissions = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", currentUserId))
        .collect();

      if (permissions.length > 0) {
        const organizationIds = permissions.map(p => p.organizationId);
        organizations = await Promise.all(
          organizationIds.map(id => ctx.db.get(id))
        );
        organizations = organizations.filter(Boolean);
      }
    }

    return {
      userId: currentUserId,
      userRole: currentUserRole,
      organizations,
      permissions,
      employees,
      summary: {
        organizationCount: organizations.length,
        permissionCount: permissions.length,
        employeeCount: employees.length,
      },
    };
  },
});

/**
 * Função para testar se um employee específico tem acesso a uma organização específica
 */
export const testEmployeeOrganizationAccess = query({
  args: {
    employeeId: v.id("users"),
    organizationId: v.id("partnerOrganizations"),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    permission: v.union(v.any(), v.null()),
    employee: v.union(v.any(), v.null()),
    organization: v.union(v.any(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Busca o employee
    const employee = await ctx.db.get(args.employeeId);
    
    // Busca a organização
    const organization = await ctx.db.get(args.organizationId);
    
    // Busca a permissão
    const permission = await ctx.db
      .query("organizationPermissions")
      .withIndex("by_employee_organization", (q) => 
        q.eq("employeeId", args.employeeId).eq("organizationId", args.organizationId)
      )
      .first();

    return {
      hasAccess: !!permission,
      permission,
      employee,
      organization,
    };
  },
}); 