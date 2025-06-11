import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  operation: string;
}

/**
 * Rate limiting configurations for different operations
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Booking operations
  CREATE_BOOKING: { maxAttempts: 10, windowMinutes: 60, operation: "create_booking" },
  CANCEL_BOOKING: { maxAttempts: 5, windowMinutes: 60, operation: "cancel_booking" },
  
  // Notification operations
  SEND_NOTIFICATION: { maxAttempts: 100, windowMinutes: 60, operation: "send_notification" },
  BULK_NOTIFICATION: { maxAttempts: 5, windowMinutes: 60, operation: "bulk_notification" },
  
  // Authentication operations
  SIGN_IN_ATTEMPT: { maxAttempts: 5, windowMinutes: 15, operation: "sign_in" },
  PASSWORD_RESET: { maxAttempts: 3, windowMinutes: 60, operation: "password_reset" },
  
  // API operations
  API_CALLS: { maxAttempts: 1000, windowMinutes: 60, operation: "api_calls" },
  SEARCH_QUERIES: { maxAttempts: 100, windowMinutes: 10, operation: "search_queries" },
};

/**
 * Check rate limit for a user and operation
 */
export async function checkRateLimit(
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">,
  operation: keyof typeof RATE_LIMITS,
  identifier?: string // Optional additional identifier (e.g., IP address)
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: number }> {
  const config = RATE_LIMITS[operation];
  if (!config) {
    throw new Error(`Unknown rate limit operation: ${operation}`);
  }

  const now = Date.now();
  const windowStart = now - (config.windowMinutes * 60 * 1000);
  
  // Create unique key for this rate limit check
  const rateLimitKey = `${userId}_${operation}${identifier ? `_${identifier}` : ''}`;

  try {
    // Get existing rate limit records for this user and operation within the time window
    const existingAttempts = await ctx.db
      .query("rateLimits")
      .withIndex("by_key_timestamp", (q) => 
        q.eq("key", rateLimitKey).gte("timestamp", windowStart)
      )
      .collect();

    const attemptCount = existingAttempts.length;
    const isAllowed = attemptCount < config.maxAttempts;
    const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);
    
    // Calculate reset time (start of next window)
    const resetTime = now + (config.windowMinutes * 60 * 1000);

    return {
      allowed: isAllowed,
      remainingAttempts,
      resetTime,
    };
  } catch (error) {
    // If rate limiting table doesn't exist or there's an error, allow the operation
    console.error("Rate limiting check failed:", error);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      resetTime: now + (config.windowMinutes * 60 * 1000),
    };
  }
}

/**
 * Record a rate limit attempt (call this after successful operation)
 */
export async function recordRateLimitAttempt(
  ctx: MutationCtx,
  userId: Id<"users">,
  operation: keyof typeof RATE_LIMITS,
  identifier?: string
): Promise<void> {
  const config = RATE_LIMITS[operation];
  if (!config) {
    throw new Error(`Unknown rate limit operation: ${operation}`);
  }

  const rateLimitKey = `${userId}_${operation}${identifier ? `_${identifier}` : ''}`;
  
  try {
    // Record this attempt
    await ctx.db.insert("rateLimits", {
      key: rateLimitKey,
      userId,
      operation: config.operation,
      timestamp: Date.now(),
      identifier: identifier || undefined,
    });

    // Clean up old rate limit records (optional, helps with database size)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    const oldRecords = await ctx.db
      .query("rateLimits")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
      .take(100); // Limit cleanup batch size

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }
  } catch (error) {
    // If rate limiting table doesn't exist, continue without recording
    console.error("Failed to record rate limit attempt:", error);
  }
}

/**
 * Enhanced rate limiting with IP-based checking
 */
export async function checkEnhancedRateLimit(
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">,
  operation: keyof typeof RATE_LIMITS,
  ipAddress?: string
): Promise<{ allowed: boolean; reason?: string; resetTime: number }> {
  // Check user-based rate limit
  const userCheck = await checkRateLimit(ctx, userId, operation);
  
  if (!userCheck.allowed) {
    return {
      allowed: false,
      reason: `Rate limit exceeded for operation: ${operation}. Try again later.`,
      resetTime: userCheck.resetTime,
    };
  }

  // If IP address is provided, also check IP-based rate limit
  if (ipAddress) {
    const ipCheck = await checkRateLimit(ctx, userId, operation, ipAddress);
    
    if (!ipCheck.allowed) {
      return {
        allowed: false,
        reason: `Rate limit exceeded from this IP address. Try again later.`,
        resetTime: ipCheck.resetTime,
      };
    }
  }

  return {
    allowed: true,
    resetTime: userCheck.resetTime,
  };
}

/**
 * Middleware function to wrap mutations with rate limiting
 */
export function withRateLimit<T extends any[], R>(
  operation: keyof typeof RATE_LIMITS,
  mutationFn: (ctx: MutationCtx, args: any) => Promise<R>
) {
  return async (ctx: MutationCtx, args: any): Promise<R> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(ctx, user._id, operation);
    
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded for ${operation}. ` +
        `${rateLimitCheck.remainingAttempts} attempts remaining. ` +
        `Resets at ${new Date(rateLimitCheck.resetTime).toISOString()}`
      );
    }

    // Execute the operation
    const result = await mutationFn(ctx, args);

    // Record the attempt
    await recordRateLimitAttempt(ctx, user._id, operation);

    return result;
  };
} 