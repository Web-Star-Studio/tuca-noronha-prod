// Export all queries
export { 
  getById,
  getBySlug,
  getFeatured,
  getAll,
} from "./queries";

// Export all mutations
export { 
  create,
  update,
  remove,
  toggleFeatured,
  toggleActive,
} from "./mutations";

// Export types
export type {
  Accommodation,
  AccommodationWithCreator,
  AccommodationBooking,
  AccommodationUpdateInput,
} from "./types"; 