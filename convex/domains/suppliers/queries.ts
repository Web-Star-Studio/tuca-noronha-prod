import { v } from "convex/values";
import { queryWithRole } from "../rbac/query";
import type { Supplier } from "./types";

export const listSuppliers = queryWithRole(["master"])({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let suppliers: Supplier[];

    if (args.isActive !== undefined) {
      suppliers = (await ctx.db
        .query("suppliers")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive))
        .collect()) as Supplier[];
    } else {
      suppliers = (await ctx.db.query("suppliers").collect()) as Supplier[];
    }

    const searchTerm = args.search?.trim().toLowerCase();

    if (searchTerm) {
      suppliers = suppliers.filter((supplier) => {
        const haystack = [
          supplier.name,
          supplier.email,
          supplier.phone,
          supplier.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (haystack.includes(searchTerm)) {
          return true;
        }

        return supplier.assetAssociations.some((association) =>
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

export const listSupplierOptions = queryWithRole(["master"])({
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
