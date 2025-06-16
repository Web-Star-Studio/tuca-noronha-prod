/**
 * RBAC (Role-Based Access Control) Domain
 * 
 * This domain provides utilities for managing user roles and permissions
 * in the Tuca Noronha application.
 */

import { mutationWithRole as mutationRole } from "./mutation";
import { queryWithRole as queryRole } from "./query";
import { actionWithRole as actionRole } from "./action";

// Export utility functions
export {
  getCurrentUserRole,
  requireRole,
  getCurrentUserConvexId,
  verifyPartnerAccess,
  verifyEmployeeAccess,
  hasAssetAccess,
  hasOrganizationAccess,
  filterAccessibleAssets
} from "./utils";

// Export types
export type { UserRole } from "./types";
export type { EmployeePermission } from "./types";

// Export RBAC function wrappers
export const mutationWithRole = mutationRole;
export const queryWithRole = queryRole;
export const actionWithRole = actionRole;

// Export queries
export { 
  listAllAssetPermissions,
  listEmployeeAssets,
  listEmployeePermissions,
  listPartnerOrganizations,
  listUserOrganizations,
  getOrganization,
  listOrganizationAssets,
  listPartnerAssets,
  listAllOrganizationPermissions,
  listEmployeeOrganizations,
  getEmployeeOrganizationPermission,
  getCurrentUser
} from "./queries";

// Export test functions
export {
  testOrganizationAccess,
  testEmployeeOrganizationAccess
} from "./test";

// Export mutations  
export {
  grantAssetPermission,
  revokeAssetPermission,
  createEmployee,
  createEmployeeDirectly,
  createEmployeeWithDefaultPermissions,
  createInvite,
  removeEmployee,
  updateEmployee,
  createOrganization,
  createOrganizationWithRestaurant,
  updateOrganization,
  grantOrganizationPermission,
  revokeOrganizationPermission,
  updateOrganizationPermission,
  createSampleOrganizations
} from "./mutations"; 