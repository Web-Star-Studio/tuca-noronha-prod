import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function useCurrentUser() {
  const { isSignedIn } = useAuth();
  const user = useQuery(api.domains.rbac.queries.getCurrentUser);
  
  // Helper function to check if user can manage other users
  const canManageUsers = () => {
    return user?.role === "master";
  };

  // Helper function to check if user can manage employees
  const canManageEmployees = () => {
    return user?.role === "partner" || user?.role === "master";
  };

  // Helper function to check if user has organization management permissions
  const canManageOrganizations = () => {
    return user?.role === "partner" || user?.role === "master";
  };

  // Helper function to check if current user is effectively a partner (partner or employee with partner-like access)
  const isPartnerLevel = () => {
    return user?.role === "partner" || user?.role === "employee" || user?.role === "master";
  };

  // Helper function to check if user can access business features
  const canAccessBusiness = () => {
    return user?.role === "partner" || user?.role === "employee" || user?.role === "master";
  };

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: isSignedIn,
    canManageUsers,
    canManageEmployees,
    canManageOrganizations,
    isPartnerLevel,
    canAccessBusiness,
  };
} 