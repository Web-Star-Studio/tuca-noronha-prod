import { Id } from "../../../../../../../../convex/_generated/dataModel";
import EditProposalClientPage from "./EditProposalClientPage";

interface EditProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProposalPage({ params }: EditProposalPageProps) {
  const { id } = await params;
  const proposalId = id as Id<"packageProposals">;

  return <EditProposalClientPage proposalId={proposalId} />;
} 