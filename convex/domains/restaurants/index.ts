/**
 * Restaurants domain exports
 */

// Re-export all queries from the queries file
export * from "./queries";

// Re-export all mutations from the mutations file
export * from "./mutations";

// Re-export utility functions
export {
  validateRestaurantOwnership,
  formatRestaurant,
  generateConfirmationCode
} from "./utils";

// Re-export types
export type {
  Restaurant,
  RestaurantCreator,
  RestaurantWithCreator,
  RestaurantCreateInput,
  RestaurantUpdateInput
} from "./types"; 