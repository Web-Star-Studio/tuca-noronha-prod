/**
 * Recommendations functions - Cache management and AI recommendations
 * This file provides easier access to recommendation-related functions
 */

// Re-export cache queries
export {
  getCacheStats,
  listUserCaches,
  getCacheLimitStats
} from "./domains/recommendations/cacheQueries";

// Re-export cache mutations
export {
  getCachedRecommendations,
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