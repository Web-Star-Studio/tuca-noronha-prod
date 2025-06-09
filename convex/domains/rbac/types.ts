import type { Id } from "../../_generated/dataModel";

// Define the user roles in the system
export type UserRole = "traveler" | "partner" | "employee" | "master";

// User with role information
export interface UserWithRole {
  _id: Id<"users">;
  _creationTime: number;
  clerkId: string;
  name?: string;
  email?: string;
  image?: string;
  role: UserRole;
}

// Employee permission on an asset
export interface EmployeePermission {
  _id: Id<any>; // Using any since 'employeePermissions' table may not exist yet
  _creationTime: number;
  employeeId: Id<"users">;
  partnerId: Id<"users">;
  assetId: Id<any>; // Using any since the asset can be from different tables
  assetType: string;
  permissions: string[];
}

// Access control result
export interface AccessControlResult {
  allowed: boolean;
  message?: string;
} 