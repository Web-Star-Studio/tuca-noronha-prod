/**
 * Users domain exports
 */

// Re-export all queries from the queries file
export * from "./queries";

// Re-export all mutations from the mutations file
export * from "./mutations";

// Re-export utility functions
export {
  getCurrentUserId,
  getCurrentUserRole,
  userExistsByClerkId,
  formatUserData
} from "./utils";

// Re-export types
export type {
  User,
  UserRole,
  UserCreateInput,
  UserUpdateInput,
  UserWithRole
} from "./types"; 