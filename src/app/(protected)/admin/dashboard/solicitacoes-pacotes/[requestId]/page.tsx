import type { Metadata } from "next";
import { PackageRequestDetailsPageClient } from "@/components/dashboard/package-request-details/PackageRequestDetailsPageClient";

interface PackageRequestDetailsPageProps {
  params: {
    requestId: string;
  };
}

export const metadata: Metadata = {
  title: "Detalhes da Solicitação de Pacote | Admin",
  description: "Visualize e gerencie uma solicitação de pacote personalizada.",
};

export default function PackageRequestDetailsPage({ params }: PackageRequestDetailsPageProps) {
  return <PackageRequestDetailsPageClient requestId={params.requestId} />;
}

