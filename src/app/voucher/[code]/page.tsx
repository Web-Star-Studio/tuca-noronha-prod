import { Metadata } from "next";
import { VoucherViewer } from "@/components/vouchers/VoucherViewer";

interface VoucherPageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({ params }: VoucherPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Voucher ${code} - Tuca Noronha`,
    description: "Visualize e baixe seu voucher de reserva",
  };
}

export default async function VoucherPage({ params }: VoucherPageProps) {
  const { code } = await params;
  return <VoucherViewer confirmationCode={code} />;
} 