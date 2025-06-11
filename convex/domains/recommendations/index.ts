// Export all recommendation-related functions
export { 
  getAssetsForRecommendations,
  getAssetsStats 
} from "./queries";

// Cache queries
export {
  getCacheStats,
  listUserCaches,
  getCacheLimitStats
} from "./cacheQueries";

// Cache mutations
export {
  getCachedRecommendations,
  cacheRecommendations,
  invalidateUserCache,
  cleanExpiredCache,
  cleanCacheWithCriteria
} from "./mutations"; 