import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export const useCurrentUser = () => {
  const { isAuthenticated } = useAuth();
  const convexUser = useQuery(api.domains.users.queries.getCurrentUser, isAuthenticated ? {} : "skip");
  
  return {
    user: convexUser,
    isLoading: isAuthenticated && convexUser === undefined,
    isAuthenticated,
  };
}; 