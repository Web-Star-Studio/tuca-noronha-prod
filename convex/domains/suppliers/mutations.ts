import { v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import { mutationWithRole } from "../rbac/mutation";
import type { SupplierAssetAssociation } from "./types";

const bankDetailsValidator = v.object({
  bankName: v.optional(v.string()),
  accountType: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
  agencyNumber: v.optional(v.string()),
  holderName: v.optional(v.string()),
  holderDocument: v.optional(v.string()),
  pixKey: v.optional(v.string()),
});

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

export const createSupplier = mutationWithRole(["master"])({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    bankDetails: v.optional(bankDetailsValidator),
    notes: v.optional(v.string()),
    assetAssociations: v.optional(v.array(assetAssociationValidator)),
  },
  returns: v.id("suppliers"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdBy = await getCurrentUserId(ctx);

    const supplierId = await ctx.db.insert("suppliers", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      bankDetails: args.bankDetails,
      notes: args.notes,
      assetAssociations: normalizeAssetAssociations(args.assetAssociations ?? []),
      createdBy,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });

    return supplierId;
  },
});

export const updateSupplier = mutationWithRole(["master"])({
  args: {
    supplierId: v.id("suppliers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    bankDetails: v.optional(bankDetailsValidator),
    notes: v.optional(v.string()),
    assetAssociations: v.optional(v.array(assetAssociationValidator)),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fornecedor não encontrado");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.email !== undefined) updates.email = args.email;
    if (args.bankDetails !== undefined) updates.bankDetails = args.bankDetails;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.assetAssociations !== undefined) {
      updates.assetAssociations = normalizeAssetAssociations(args.assetAssociations);
    }
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.supplierId, updates);
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
