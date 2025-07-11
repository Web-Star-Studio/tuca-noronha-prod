"use server";

import { Id } from "../../../../../../../../convex/_generated/dataModel";
import CreateProposalClientPage from "./CreateProposalClientPage";

interface CreateProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CreateProposalPage({ params }: CreateProposalPageProps) {
  const { id } = await params;
  const packageRequestId = id as Id<"packageRequests">;

  return <CreateProposalClientPage packageRequestId={packageRequestId} />;
} 