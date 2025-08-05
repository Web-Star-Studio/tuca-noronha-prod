"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { toast } from "sonner";

interface VoucherDownloadButtonProps {
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle" | "package" | "accommodation";
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  downloadPDF?: boolean; // New prop to enable PDF download
}

export function VoucherDownloadButton({
  bookingId,
  bookingType,
  variant = "outline",
  size = "sm",
  showIcon = true,
  showLabel = true,
  className,
  downloadPDF = false,
}: VoucherDownloadButtonProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check if voucher exists for this booking
  const voucher = useQuery(
    api.domains.vouchers.queries.getVoucherByBooking, 
    bookingId ? { bookingId, bookingType } : undefined
  );

  // PDF generation action
  const getVoucherPDFUrl = useAction(api.domains.vouchers.actions.getVoucherPDFUrl);

  if (!voucher) {
    return null;
  }

  const handleClick = async () => {
    if (downloadPDF) {
      await handlePDFDownload();
    } else {
      // Open voucher in new tab
      window.open(`/voucher/${voucher.voucherNumber}`, "_blank");
    }
  };

  const handlePDFDownload = async () => {
    if (!voucher.voucherNumber) return;

    setIsGeneratingPDF(true);
    try {
      toast.loading("Gerando PDF...", { id: "pdf-generation" });
      
      const pdfUrl = await getVoucherPDFUrl({
        voucherNumber: voucher.voucherNumber,
      });

      if (pdfUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `voucher-${voucher.voucherNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("PDF baixado com sucesso!", { id: "pdf-generation" });
      } else {
        throw new Error("Não foi possível gerar o PDF");
      }
    } catch {
      console.error("Error downloading PDF:", error);
      toast.error("Erro ao baixar PDF. Tente novamente.", { id: "pdf-generation" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const buttonLabel = downloadPDF ? "Baixar PDF" : "Ver Voucher";
  const buttonIcon = downloadPDF ? Download : FileText;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title={buttonLabel}
      disabled={isGeneratingPDF}
    >
      {isGeneratingPDF ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        showIcon && React.createElement(buttonIcon, { className: "w-4 h-4" })
      )}
      {showLabel && (
        <span className={showIcon ? "ml-2" : ""}>
          {isGeneratingPDF ? "Gerando..." : buttonLabel}
        </span>
      )}
    </Button>
  );
} 