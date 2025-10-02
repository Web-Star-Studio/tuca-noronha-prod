import { v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import { mutationWithRole } from "../rbac/mutation";
import type { SupplierAssetAssociation } from "./types";
import { CreateSupplierArgs, UpdateSupplierArgs, SupplierBankDetailsValidator } from "./types";

const assetAssociationValidator = v.object({
  assetId: v.string(),
  assetType: v.string(),
  assetName: v.optional(v.string()),
});

function normalizeAssetAssociations(
  associations: SupplierAssetAssociation[]
): SupplierAssetAssociation[] {
  const seen = new Set<string>();

  return associations.reduce<SupplierAssetAssociation[]>((acc, association) => {
    const assetId = association.assetId?.trim();
    const assetType = association.assetType?.trim();

    if (!assetId || !assetType) {
      return acc;
    }

    const key = `${assetType}:${assetId}`;
    if (seen.has(key)) {
      return acc;
    }

    seen.add(key);
    acc.push({
      assetId,
      assetType,
      assetName: association.assetName?.trim() || undefined,
    });

    return acc;
  }, []);
}

async function getCurrentUserId(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Não autorizado");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  return user._id;
}

export const createSupplier = mutationWithRole(["master", "partner"])({
  args: CreateSupplierArgs,
  returns: v.id("suppliers"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdBy = await getCurrentUserId(ctx);

    const supplierId = await ctx.db.insert("suppliers", {
      // Public fields
      name: args.name,
      address: args.address,
      cnpj: args.cnpj,
      emergencyPhone: args.emergencyPhone,
      
      // Private fields
      bankDetails: args.bankDetails,
      financialEmail: args.financialEmail,
      contactPerson: args.contactPerson,
      financialPhone: args.financialPhone,
      pixKey: args.pixKey,
      
      // Legacy fields
      phone: args.phone,
      email: args.email,
      notes: args.notes,
      assetAssociations: args.assetAssociations ? normalizeAssetAssociations(args.assetAssociations) : undefined,
      
      // Metadata
      isActive: true,
      partnerId: args.partnerId,
      organizationId: args.organizationId,
      createdBy,
      updatedBy: createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return supplierId;
  },
});

export const updateSupplier = mutationWithRole(["master", "partner"])({
  args: UpdateSupplierArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.id);
    if (!supplier) {
      throw new Error("Fornecedor não encontrado");
    }

    const currentUserId = await getCurrentUserId(ctx);
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      updatedBy: currentUserId,
    };

    // Public fields
    if (args.name !== undefined) updates.name = args.name;
    if (args.address !== undefined) updates.address = args.address;
    if (args.cnpj !== undefined) updates.cnpj = args.cnpj;
    if (args.emergencyPhone !== undefined) updates.emergencyPhone = args.emergencyPhone;
    
    // Private fields
    if (args.bankDetails !== undefined) updates.bankDetails = args.bankDetails;
    if (args.financialEmail !== undefined) updates.financialEmail = args.financialEmail;
    if (args.contactPerson !== undefined) updates.contactPerson = args.contactPerson;
    if (args.financialPhone !== undefined) updates.financialPhone = args.financialPhone;
    if (args.pixKey !== undefined) updates.pixKey = args.pixKey;
    
    // Legacy fields
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.email !== undefined) updates.email = args.email;
    if (args.notes !== undefined) updates.notes = args.notes;
    
    // Status
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const setSupplierStatus = mutationWithRole(["master"])({
  args: {
    supplierId: v.id("suppliers"),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fornecedor não encontrado");
    }

    if (supplier.isActive === args.isActive) {
      return null;
    }

    await ctx.db.patch(args.supplierId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return null;
  },
});
