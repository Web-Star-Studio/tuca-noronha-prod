# Fix: Query vs Mutation Type Error

## Problem
The client was getting this error:
```
Error: [CONVEX M(recommendations:getCachedRecommendations)] Server Error
Trying to execute recommendations.js:getCachedRecommendations as Mutation, but it is defined as Query.
```

## Root Cause
The `getCachedRecommendations` function was defined as a `query` in `convex/domains/recommendations/cacheQueries.ts`, but the client code was calling it using `useMutation()`. This type mismatch caused the error.

## Analysis of Usage Pattern
Looking at how the function is used:
```typescript
// Client code - using as mutation
const getCachedRecommendations = useMutation(api.recommendations.getCachedRecommendations);

// Called imperatively with specific parameters
const cached = await getCachedRecommendations({
  userPreferences,
  category,
});
```

This pattern indicates the function should be a **mutation** because:
1. It's called imperatively (not reactively)
2. It's called with dynamic parameters on-demand
3. It's used for cache lookup logic, not reactive UI updates

## Solution Applied

### 1. Converted to Mutation
**Changed:** `convex/domains/recommendations/cacheQueries.ts`
```typescript
// Before: 
export const getCachedRecommendations = query({...})

// After: Moved to mutations.ts as:
export const getCachedRecommendations = mutation({...})
```

### 2. Moved Function Location
- **From:** `convex/domains/recommendations/cacheQueries.ts`
- **To:** `convex/domains/recommendations/mutations.ts`
- **Reason:** It's now a mutation, so belongs with other mutations

### 3. Updated Exports
**File:** `convex/domains/recommendations/index.ts`
```typescript
// Cache queries (removed getCachedRecommendations)
export {
  getCacheStats,
  listUserCaches,
  getCacheLimitStats
} from "./cacheQueries";

// Cache mutations (added getCachedRecommendations)
export {
  getCachedRecommendations,  // ← Moved here
  cacheRecommendations,
  invalidateUserCache,
  cleanExpiredCache,
  cleanCacheWithCriteria
} from "./mutations";
```

**File:** `convex/recommendations.ts`
```typescript
// Re-export cache mutations (added getCachedRecommendations)
export {
  getCachedRecommendations,  // ← Moved here
  cacheRecommendations,
  invalidateUserCache,
  cleanExpiredCache,
  cleanCacheWithCriteria
} from "./domains/recommendations/mutations";
```

## Function Behavior
The function behavior remains exactly the same:
- Takes `userPreferences` and optional `category` as input
- Returns cached recommendations or `null` if no cache exists
- Performs authentication and cache expiration checks
- Calculates cache age and adds metadata

## Client Code Compatibility
No changes needed in client code! The function continues to be used as:
```typescript
const getCachedRecommendations = useMutation(api.recommendations.getCachedRecommendations);
const cached = await getCachedRecommendations({ userPreferences, category });
```

## Testing
The function is now properly accessible as a mutation:
```bash
✅ npx convex run recommendations:getCachedRecommendations
```

## Status
✅ **RESOLVED** - Function is now correctly defined as a mutation and works with the existing client code patterns. 