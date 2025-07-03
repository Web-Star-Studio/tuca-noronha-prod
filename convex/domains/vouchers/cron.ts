import { cronJobs } from "convex/server";
import { internal } from "../../_generated/api";
import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { VOUCHER_STATUS } from "./types";

/**
 * Internal mutation to expire vouchers that have passed their expiration date
 */
export const expireVouchers = internalMutation({
  args: {},
  returns: v.object({
    expiredCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const errors: string[] = [];
    let expiredCount = 0;

    try {
      // Find all active vouchers that have passed their expiration date
      const activeVouchers = await ctx.db
        .query("vouchers")
        .withIndex("by_status", (q) => q.eq("status", VOUCHER_STATUS.ACTIVE))
        .collect();

      for (const voucher of activeVouchers) {
        try {
          // Check if voucher has passed its expiration date
          if (!voucher.validUntil) continue; // Skip if no expiration date set
          const expirationDate = voucher.validUntil;
          
          if (expirationDate < now) {
            await ctx.db.patch(voucher._id, {
              status: VOUCHER_STATUS.EXPIRED,
              updatedAt: now,
            });
            expiredCount++;
            
            console.log(`✅ Voucher ${voucher.voucherNumber} expired`);
          }
        } catch (error) {
          const errorMessage = `Failed to expire voucher ${voucher.voucherNumber}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      console.log(`📊 Voucher expiration job completed: ${expiredCount} vouchers expired`);
      
      return {
        expiredCount,
        errors,
      };
    } catch (error) {
      console.error("❌ Error in voucher expiration job:", error);
      return {
        expiredCount,
        errors: [`Global error: ${error}`],
      };
    }
  },
});

// Configure cron jobs
const crons = cronJobs();

// Run voucher expiration check every day at 2 AM
crons.interval(
  "expire-vouchers",
  { hours: 24 }, // Run every 24 hours
  internal.domains.vouchers.cron.expireVouchers,
  {}
);

export default crons; 