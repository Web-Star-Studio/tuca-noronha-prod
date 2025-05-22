import { v } from "convex/values";

// Common validator for pagination options
export const paginationOptsValidator = {
  paginationOpts: v.optional(
    v.object({
      cursor: v.optional(v.string()),
      limit: v.optional(v.number()),
    })
  ),
}; 