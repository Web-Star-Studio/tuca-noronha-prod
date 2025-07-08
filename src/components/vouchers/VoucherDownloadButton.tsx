"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface VoucherDownloadButtonProps {
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle" | "package" | "accommodation";
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function VoucherDownloadButton({
  bookingId,
  bookingType,
  variant = "outline",
  size = "sm",
  showIcon = true,
  showLabel = true,
  className,
}: VoucherDownloadButtonProps) {
  // Check if voucher exists for this booking
  const voucher = useQuery(api.domains.vouchers.queries.getVoucherByBooking, {
    bookingId,
    bookingType,
  });

  if (!voucher) {
    return null;
  }

  const handleClick = () => {
    // Open voucher in new tab
    window.open(`/voucher/${voucher.voucherNumber}`, "_blank");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title="Ver Voucher"
    >
      {showIcon && <FileText className="w-4 h-4" />}
      {showLabel && <span className={showIcon ? "ml-2" : ""}>Ver Voucher</span>}
    </Button>
  );
} 