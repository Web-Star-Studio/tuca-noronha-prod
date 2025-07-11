"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Download, Printer, Share2, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { VoucherTemplate } from "./VoucherTemplate";
import { generateVoucherPDF } from "@/lib/pdf/generateVoucherPDF";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Id } from "../../../convex/_generated/dataModel";
import type { VoucherTemplateData } from "../../../convex/domains/vouchers/types";

interface VoucherViewerProps {
  voucherId?: Id<"vouchers">;
  confirmationCode?: string;
  voucherNumber?: string;
}

export function VoucherViewer({ voucherId, confirmationCode, voucherNumber }: VoucherViewerProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Query voucher based on ID, confirmation code, or voucher number
  const voucher = useQuery(
    voucherId
      ? api.domains.vouchers.queries.getVoucher
      : voucherNumber
      ? api.domains.vouchers.queries.getVoucherByNumber
      : api.domains.vouchers.queries.getVoucherByConfirmationCode,
    voucherId
      ? { voucherId }
      : voucherNumber
      ? { voucherNumber }
      : confirmationCode
      ? { confirmationCode }
      : "skip"
  );

  // Log voucher data for debugging
  if (voucher) {
    console.log("Voucher data received:", voucher);
  }

  if (!voucher && (voucherId || confirmationCode || voucherNumber)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Voucher não encontrado</AlertTitle>
          <AlertDescription>
            O voucher solicitado não foi encontrado ou foi cancelado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Get status icon and color
  const getStatusInfo = () => {
    const status = voucher.voucher?.status || "unknown";
    switch (status) {
      case "active":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "text-green-600",
          label: "Ativo",
        };
      case "used":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "text-blue-600",
          label: "Utilizado",
        };
      case "cancelled":
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: "text-red-600",
          label: "Cancelado",
        };
      case "expired":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "text-gray-600",
          label: "Expirado",
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: "text-gray-600",
          label: "Desconhecido",
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Prepare voucher data for template with better null handling
  const voucherData: VoucherTemplateData = {
    voucher: {
      voucherNumber: voucher.voucher?.voucherNumber || voucherNumber || "N/A",
      status: voucher.voucher?.status || "active",
      qrCode: voucher.voucher?.qrCode || "",
      generatedAt: voucher.voucher?.generatedAt || new Date().toISOString(),
      expiresAt: voucher.voucher?.expiresAt,
      usedAt: voucher.voucher?.usedAt,
      downloadCount: voucher.voucher?.downloadCount || 0,
      scanCount: voucher.voucher?.scanCount || 0,
    },
    booking: {
      id: voucher.booking?.id || "",
      type: voucher.booking?.type || "unknown",
      confirmationCode: voucher.booking?.confirmationCode || "",
      status: voucher.booking?.status || "pending",
      date: voucher.booking?.date || new Date().toISOString(),
      time: voucher.booking?.time,
      participants: voucher.booking?.participants || 1,
      totalAmount: voucher.booking?.totalAmount || 0,
    },
    customer: {
      name: voucher.customer?.name || "Cliente",
      email: voucher.customer?.email || "email@exemplo.com",
      phone: voucher.customer?.phone || "",
    },
    asset: {
      name: voucher.asset?.name || "Serviço",
      location: voucher.asset?.location || "Local a definir",
      description: voucher.asset?.description,
      type: voucher.booking?.type || "unknown",
    },
    partner: {
      name: voucher.partner?.name || "Parceiro",
      contactInfo: voucher.partner?.contactInfo || "",
    },
    brandInfo: {
      logoUrl: voucher.partner?.image,
      companyName: "Tuca Noronha",
      website: "https://tucanoronha.com",
      supportEmail: "atendimentotucanoronha@gmail.com",
      supportPhone: "",
    },
    instructions: {
      checkIn: ["Chegue 15 minutos antes do horário", "Apresente este voucher"],
      preparation: ["Traga documento de identidade", "Siga as instruções do estabelecimento"],
      cancellation: "Cancelamentos seguem as políticas do estabelecimento",
    },
    termsAndConditions: [
      "Este voucher é pessoal e intransferível",
      "Apresente este voucher no estabelecimento", 
      "Sujeito à disponibilidade e condições do estabelecimento",
      "Em caso de cancelamento, siga as políticas do estabelecimento",
    ].join(". "),
    confirmationInfo: voucher.confirmationInfo || undefined,
  };

  // Log processed data for debugging
  console.log("Processed voucher data:", voucherData);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const element = document.getElementById("voucher-content");
      if (!element) {
        throw new Error("Elemento do voucher não encontrado");
      }

      const pdfBlob = await generateVoucherPDF(element);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `voucher-${voucherData.voucher.voucherNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Voucher baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF do voucher");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/voucher/${voucherData.voucher.voucherNumber}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Voucher ${voucherData.voucher.voucherNumber}`,
          text: `Voucher de ${voucherData.asset.name}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Visualizar Voucher</h1>
          <span className={`flex items-center gap-1 ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isGeneratingPDF ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
        </div>
      </div>

      {/* Voucher Status Warnings */}
      {voucher.voucher?.status === "cancelled" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Voucher Cancelado</AlertTitle>
          <AlertDescription>
            Este voucher foi cancelado e não pode mais ser utilizado.
            {voucher.voucher?.cancelReason && ` Motivo: ${voucher.voucher.cancelReason}`}
          </AlertDescription>
        </Alert>
      )}

      {voucher.voucher?.status === "expired" && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertTitle>Voucher Expirado</AlertTitle>
          <AlertDescription>
            Este voucher expirou e não pode mais ser utilizado.
          </AlertDescription>
        </Alert>
      )}

      {voucher.voucher?.status === "used" && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Voucher Utilizado</AlertTitle>
          <AlertDescription>
            Este voucher já foi utilizado em{" "}
            {voucher.voucher?.usedAt && new Date(voucher.voucher.usedAt).toLocaleString("pt-BR")}.
          </AlertDescription>
        </Alert>
      )}

      {/* Voucher Template */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
        <VoucherTemplate voucherData={voucherData} assetType={voucher.booking?.type || "activity"} />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #voucher-content, #voucher-content * {
            visibility: visible;
          }
          #voucher-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 