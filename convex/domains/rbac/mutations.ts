import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { mutationWithRole } from "./mutation";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../rbac";
import type { Id } from "../../_generated/dataModel";

/**
 * Concede permissão a um employee para acessar um asset específico
 * Apenas partners (donos do asset) e masters podem conceder permissões
 */
export const grantAssetPermission = mutationWithRole(["partner", "master"])({
  args: {
    // Employee que receberá a permissão
    employeeId: v.id("users"),
    // ID do asset (evento, restaurante, etc)
    assetId: v.string(),
    // Tipo de asset (events, restaurants, etc)
    assetType: v.string(),
    // Permissões (view, edit, manage)
    permissions: v.array(v.string()),
    // Nota opcional sobre a permissão
    note: v.optional(v.string()),
  },
  returns: v.id("assetPermissions"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Verificar se o employee existe e tem papel de employee
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee não encontrado");
    }
    
    if (employee.role !== "employee") {
      throw new Error("O usuário selecionado não é um employee");
    }
    
    // Se for partner, verificar se o asset pertence a ele
    if (currentUserRole === "partner") {
      let isOwner = false;
      
      // Verifica o owner do asset dependendo do tipo
      if (args.assetType === "events") {
        const event = await ctx.db.get(args.assetId as Id<"events">);
        isOwner = event ? event.partnerId.toString() === currentUserId.toString() : false;
      } 
      else if (args.assetType === "restaurants") {
        const restaurant = await ctx.db.get(args.assetId as Id<"restaurants">);
        isOwner = restaurant ? restaurant.partnerId.toString() === currentUserId.toString() : false;
      }
      else if (args.assetType === "activities") {
        const activity = await ctx.db.get(args.assetId as Id<"activities">);
        isOwner = activity ? activity.partnerId.toString() === currentUserId.toString() : false;
      }
      // Adicionar outros tipos de asset aqui conforme necessário
      
      if (!isOwner) {
        throw new Error("Você não tem permissão para compartilhar esse asset");
      }
    }
    
    // Verifica se já existe uma permissão para este employee e asset
    const existingPermissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee_asset_type", (q) => 
        q.eq("employeeId", args.employeeId).eq("assetType", args.assetType)
      )
      .filter((q) => q.eq(q.field("assetId"), args.assetId))
      .collect();
    
    // Se já existe, atualiza as permissões
    if (existingPermissions.length > 0) {
      await ctx.db.patch(existingPermissions[0]._id, {
        permissions: args.permissions,
        note: args.note,
      });
      return existingPermissions[0]._id;
    }
    
    // Caso contrário, cria uma nova permissão
    return await ctx.db.insert("assetPermissions", {
      employeeId: args.employeeId,
      partnerId: currentUserId,
      assetId: args.assetId,
      assetType: args.assetType,
      permissions: args.permissions,
      note: args.note,
    });
  },
});

/**
 * Remove a permissão de um employee para um asset específico
 * Apenas partners (donos do asset) e masters podem remover permissões
 */
export const revokeAssetPermission = mutationWithRole(["partner", "master"])({
  args: {
    // ID da permissão a ser removida
    permissionId: v.id("assetPermissions"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Busca a permissão
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permissão não encontrada");
    }
    
    // Se for partner, verificar se é o dono do asset
    if (currentUserRole === "partner" && permission.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para remover esta permissão");
    }
    
    // Remove a permissão
    await ctx.db.delete(args.permissionId);
    return true;
  },
});

/**
 * Cria (ou convida) um employee. Somente parceiros (ou masters) podem cadastrar
 * novos employees. Neste primeiro momento criamos um registro na tabela `users`
 * com papel "employee" e dados básicos; a autenticação via Clerk poderá
 * reconciliar o usuário definitivo mais tarde associando o mesmo e-mail.
 */
export const createEmployee = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Verifica se já existe usuário com esse e-mail
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    if (existing.length > 0) {
      // Se já existir, apenas muda o papel para employee (caso ainda não seja)
      const user = existing[0];
      await ctx.db.patch(user._id, { role: "employee" });
      return user._id as Id<"users">;
    }

    // Cria novo usuário placeholder
    const newEmployeeId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      role: "employee",
    });

    return newEmployeeId as Id<"users">;
  },
});

/**
 * Atualiza dados básicos de um employee (nome, imagem). Somente partner dono ou master.
 */
export const updateEmployee = mutationWithRole(["partner", "master"])({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const role = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Busca employee
    const employee = await ctx.db.get(args.id);
    if (!employee) throw new Error("Employee não encontrado");
    if (employee.role !== "employee") throw new Error("Usuário não é employee");

    // Se partner, deve ser dono de ao menos uma permissão sobre employee (ou simples relação) —
    // vamos checar se existe permissão criada por esse partner OU employeeId = currentUserId (impossível).
    if (role === "partner") {
      const rel = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_partner", (q) => q.eq("employeeId", args.id).eq("partnerId", currentUserId))
        .collect();
      if (rel.length === 0) throw new Error("Você não pode editar este employee");
    }

    await ctx.db.patch(args.id, {
      name: args.name ?? employee.name,
      image: args.image ?? employee.image,
    });
    return true;
  },
});

/**
 * Remove (demite) um employee — simplesmente altera role para traveler e remove suas permissões.
 */
export const removeEmployee = mutationWithRole(["partner", "master"])({
  args: { id: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const role = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    const employee = await ctx.db.get(args.id);
    if (!employee) throw new Error("Employee não encontrado");
    if (employee.role !== "employee") throw new Error("Usuário não é employee");

    if (role === "partner") {
      const rel = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_partner", (q) => q.eq("employeeId", args.id).eq("partnerId", currentUserId))
        .collect();
      if (rel.length === 0) throw new Error("Você não pode remover este employee");
    }

    // Remove permissões do employee concedidas por este partner (ou todas se master)
    const toDelete = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.id))
      .collect();
    for (const perm of toDelete) {
      if (role === "master" || perm.partnerId.toString() === currentUserId.toString()) {
        await ctx.db.delete(perm._id);
      }
    }

    // Atualiza role para traveler
    await ctx.db.patch(args.id, { role: "traveler" });
    return true;
  },
}); 