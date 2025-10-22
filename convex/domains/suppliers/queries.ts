import { v } from "convex/values";
import { query } from "../../_generated/server";
import { queryWithRole } from "../rbac/query";
import type { Supplier, SupplierPublicInfo } from "./types";

export const listSuppliers = queryWithRole(["master", "partner"])({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
  },
  handler: async (ctx, args) => {
    let suppliers: Supplier[];

    // Filter by partner or organization if specified
    if (args.partnerId) {
      suppliers = (await ctx.db
        .query("suppliers")
        .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
        .collect()) as Supplier[];
    } else if (args.organizationId) {
      suppliers = (await ctx.db
        .query("suppliers")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect()) as Supplier[];
    } else if (args.isActive !== undefined) {
      suppliers = (await ctx.db
        .query("suppliers")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive))
        .collect()) as Supplier[];
    } else {
      suppliers = (await ctx.db.query("suppliers").collect()) as Supplier[];
    }

    // Apply active filter if needed
    if (args.isActive !== undefined) {
      suppliers = suppliers.filter((s) => s.isActive === args.isActive);
    }

    const searchTerm = args.search?.trim().toLowerCase();

    if (searchTerm) {
      suppliers = suppliers.filter((supplier) => {
        const haystack = [
          supplier.name,
          supplier.email,
          supplier.phone,
          supplier.address,
          supplier.cnpj,
          supplier.contactPerson,
          supplier.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (haystack.includes(searchTerm)) {
          return true;
        }

        return supplier.assetAssociations?.some((association) =>
          association.assetName?.toLowerCase().includes(searchTerm)
        );
      });
    }

    return suppliers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getSupplier = queryWithRole(["master"])({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.supplierId)) as Supplier | null;
  },
});

export const listSupplierOptions = queryWithRole(["master", "partner"])({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const suppliers = (await ctx.db
      .query("suppliers")
      .withIndex("by_name")
      .collect()) as Supplier[];

    return suppliers
      .filter((supplier) =>
        args.isActive === undefined ? true : supplier.isActive === args.isActive
      )
      .map((supplier) => ({
        _id: supplier._id,
        name: supplier.name,
        isActive: supplier.isActive,
      }));
  },
});

// Get all active suppliers (for admin selection)
export const getAllSuppliers = queryWithRole(["master", "partner", "employee"])({
  args: {},
  handler: async (ctx) => {
    const suppliers = (await ctx.db
      .query("suppliers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect()) as Supplier[];

    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get public supplier information for voucher display
 * This query is public (no role check) as it only returns public fields
 */
export const getSupplierPublicInfo = query({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args): Promise<SupplierPublicInfo | null> => {
    const supplier = await ctx.db.get(args.supplierId);
    
    if (!supplier) {
      return null;
    }

    // Return only public fields for voucher
    return {
      name: supplier.name,
      address: supplier.address,
      cnpj: supplier.cnpj,
      emergencyPhone: supplier.emergencyPhone,
    };
  },
});
