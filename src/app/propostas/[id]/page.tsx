import { ProposalClientPage } from "./ProposalClientPage";

interface ProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;
  
  return <ProposalClientPage proposalId={id} />;
} 