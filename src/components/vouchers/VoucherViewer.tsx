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
}

export function VoucherViewer({ voucherId, confirmationCode }: VoucherViewerProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Query voucher based on ID or confirmation code
  const voucher = useQuery(
    voucherId
      ? api.domains.vouchers.queries.getVoucher
      : api.domains.vouchers.queries.getVoucherByConfirmationCode,
    voucherId
      ? { voucherId }
      : confirmationCode
      ? { confirmationCode }
      : "skip"
  );

  if (!voucher && (voucherId || confirmationCode)) {
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
    switch (voucher.status) {
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

  // Prepare voucher data for template
  const voucherData: VoucherTemplateData = {
    voucherNumber: voucher.voucherNumber,
    issueDate: new Date(voucher.issueDate),
    confirmationCode: voucher.confirmationCode,
    customerInfo: voucher.customerInfo,
    assetInfo: voucher.assetInfo,
    bookingType: voucher.bookingType,
    bookingDetails: voucher.bookingDetails,
    qrCode: voucher.qrCode,
    validFrom: voucher.validFrom ? new Date(voucher.validFrom) : undefined,
    validUntil: voucher.validUntil ? new Date(voucher.validUntil) : undefined,
    partnerName: voucher.partner?.name,
    partnerLogo: voucher.partner?.image,
    termsAndConditions: [
      "Este voucher é pessoal e intransferível",
      "Apresente este voucher no estabelecimento",
      "Sujeito à disponibilidade e condições do estabelecimento",
      "Em caso de cancelamento, siga as políticas do estabelecimento",
    ],
  };

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
      link.download = `voucher-${voucher.voucherNumber}.pdf`;
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
    const shareUrl = `${window.location.origin}/voucher/${voucher.confirmationCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Voucher ${voucher.voucherNumber}`,
          text: `Voucher de ${voucherData.assetInfo.name}`,
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
      {voucher.status === "cancelled" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Voucher Cancelado</AlertTitle>
          <AlertDescription>
            Este voucher foi cancelado e não pode mais ser utilizado.
            {voucher.cancelReason && ` Motivo: ${voucher.cancelReason}`}
          </AlertDescription>
        </Alert>
      )}

      {voucher.status === "expired" && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertTitle>Voucher Expirado</AlertTitle>
          <AlertDescription>
            Este voucher expirou e não pode mais ser utilizado.
          </AlertDescription>
        </Alert>
      )}

      {voucher.status === "used" && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Voucher Utilizado</AlertTitle>
          <AlertDescription>
            Este voucher já foi utilizado em{" "}
            {voucher.usedAt && new Date(voucher.usedAt).toLocaleString("pt-BR")}.
          </AlertDescription>
        </Alert>
      )}

      {/* Voucher Template */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
        <VoucherTemplate voucherData={voucherData} assetType={voucher.bookingType} />
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