/**
 * Users domain exports
 */

// Import from queries file
import * as queries from "./queries";

// Import from mutations file
import * as mutations from "./mutations";

// Explicitly re-export to avoid naming conflicts
export const getCurrentUser = queries.getCurrentUser;
export const getUserByClerkIdQuery = queries.getUserByClerkId; // renamed to avoid conflict
export const getUserById = queries.getUserById;
export const getUsersByRole = queries.getUsersByRole;

// Re-export mutations
export const createUser = mutations.createUser;
export const syncUserFromClerk = mutations.syncUserFromClerk;
export const deleteUserFromClerk = mutations.deleteUserFromClerk;
export const setRole = mutations.setRole;
export const updateUserProfile = mutations.updateUserProfile;
export const getUserByClerkId = mutations.getUserByClerkId; // the mutation version keeps the original name

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
  UserUpdateInput,
  UserCreateInput,
  UserWithRole
} from "./types";

// Re-export the UserRole type from RBAC domain
export type { UserRole } from "../rbac/types"; 