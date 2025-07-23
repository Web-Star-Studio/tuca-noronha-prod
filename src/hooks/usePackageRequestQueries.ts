import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UsePackageRequestQueriesProps {
  requestId: Id<"packageRequests"> | null;
  enabled?: boolean;
}

export function usePackageRequestQueries({ 
  requestId, 
  enabled = true 
}: UsePackageRequestQueriesProps) {
  // Only execute queries if we have a valid requestId and the hook is enabled
  const shouldExecute = Boolean(requestId && enabled);

  const requestDetails = useQuery(
    api.packages.getPackageRequestDetails,
    shouldExecute ? { requestId: requestId! } : "skip"
  );

  const requestMessages = useQuery(
    api.packages.getPackageRequestMessages,
    shouldExecute ? { packageRequestId: requestId! } : "skip"
  );

  const requestProposals = useQuery(
    api.domains.packageProposals.queries.getProposalsForRequest,
    shouldExecute ? { packageRequestId: requestId! } : "skip"
  );

  return {
    requestDetails,
    requestMessages,
    requestProposals,
    isLoading: shouldExecute && (
      requestDetails === undefined || 
      requestMessages === undefined || 
      requestProposals === undefined
    ),
    hasValidId: Boolean(requestId),
  };
} 