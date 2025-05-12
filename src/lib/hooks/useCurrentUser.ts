import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export const useCurrentUser = () => {
  const { isAuthenticated, userId } = useAuth();
  const convexUser = useQuery(api.auth.getUser, isAuthenticated ? {} : "skip");
  
  return {
    user: convexUser,
    isLoading: isAuthenticated && convexUser === undefined,
    isAuthenticated,
  };
}; 