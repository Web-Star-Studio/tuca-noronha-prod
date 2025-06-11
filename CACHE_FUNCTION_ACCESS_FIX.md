# Fix: Cache Function Access Error

## Problem
The client was getting this error:
```
Error: [CONVEX Q(domains/recommendations:getCacheStats)] Server Error
Could not find public function for 'domains/recommendations:getCacheStats'
```

## Root Cause
The recommendations domain functions were not properly exported and accessible through the expected API paths:
- Functions existed in `convex/domains/recommendations/` but weren't accessible via `api.domains.recommendations`
- The domains index file was missing the recommendations export

## Solution

### 1. Added Missing Domain Export
**File:** `convex/domains/index.ts`
```typescript
// Export recommendations domain for cache and AI recommendations
export * as recommendations from "./recommendations";
```

### 2. Created Root-Level Export File
**File:** `convex/recommendations.ts`
```typescript
// Re-export cache queries
export {
  getCachedRecommendations,
  getCacheStats,
  listUserCaches,
  getCacheLimitStats
} from "./domains/recommendations/cacheQueries";

// Re-export cache mutations
export {
  cacheRecommendations,
  invalidateUserCache,
  cleanExpiredCache,
  cleanCacheWithCriteria
} from "./domains/recommendations/mutations";

// Re-export recommendation queries
export {
  getAssetsForRecommendations,
  getAssetsStats
} from "./domains/recommendations/queries";
```

### 3. Updated Client Code Paths
**Files Updated:**
- `src/lib/hooks/useCachedRecommendations.ts`
- `src/lib/hooks/useConvexPreferences.ts`
- `src/lib/hooks/useAIRecommendations.ts`

**Changed from:**
```typescript
api.domains.recommendations.getCacheStats
```

**Changed to:**
```typescript
api.recommendations.getCacheStats
```

## Verification
All functions are now accessible and working:
```bash
✅ npx convex run recommendations:getCacheStats
✅ npx convex run recommendations:getCacheLimitStats
✅ npx convex run recommendations:cacheRecommendations
✅ npx convex run recommendations:invalidateUserCache
```

## Available Functions
The following functions are now accessible via `api.recommendations.*`:

### Queries
- `getCachedRecommendations` - Retrieve cached recommendations
- `getCacheStats` - Get basic cache statistics
- `listUserCaches` - List all user cache entries
- `getCacheLimitStats` - Get detailed limit and usage statistics
- `getAssetsForRecommendations` - Get real assets for recommendations
- `getAssetsStats` - Get asset statistics

### Mutations  
- `cacheRecommendations` - Save recommendations to cache
- `invalidateUserCache` - Invalidate user cache entries
- `cleanExpiredCache` - Clean expired cache entries
- `cleanCacheWithCriteria` - Advanced cache cleanup with criteria

## Status
✅ **RESOLVED** - All cache functions are now properly accessible and the client error is fixed. 