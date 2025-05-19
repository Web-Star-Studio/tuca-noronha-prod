import { Id } from "../../_generated/dataModel";

export type UserRole = "traveler" | "partner" | "employee" | "master";

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  clerkId: string;
  email?: string;
  name?: string;
  image?: string;
  phone?: string;
  emailVerificationTime?: number;
  isAnonymous: boolean;
  role: UserRole;
}

export interface UserCreateInput {
  clerkId: string;
  email?: string;
  name?: string;
  image?: string;
  phone?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserUpdateInput {
  id: Id<"users">;
  email?: string;
  name?: string;
  image?: string;
  phone?: string;
  role?: UserRole;
}

export interface UserWithRole {
  id: Id<"users">;
  clerkId: string;
  email?: string;
  name?: string;
  image?: string;
  role: UserRole;
} 