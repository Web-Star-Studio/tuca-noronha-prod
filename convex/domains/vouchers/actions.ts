import { action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generate a PDF for a voucher using PDF-lib
 */
export const generateVoucherPDF = action({
  args: {
    voucherNumber: v.string(),
  },
  handler: async (ctx, { voucherNumber }) => {
    try {
      // Get voucher data
      const voucher = await ctx.runQuery(internal.domains.vouchers.queries.getVoucherByNumber, {
        voucherNumber,
      });

      if (!voucher) {
        throw new Error("Voucher não encontrado");
      }

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      
      // Get fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

      const { width, height } = page.getSize();
      const margin = 50;
      let yPosition = height - margin;

      // Helper functions
      const getAssetTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
          activity: 'Atividade',
          event: 'Evento', 
          restaurant: 'Restaurante',
          vehicle: 'Veículo',
          accommodation: 'Hospedagem',
          package: 'Pacote'
        };
        return labels[type] || type;
      };

      const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const drawText = (text: string, x: number, y: number, options: any = {}) => {
        page.drawText(text, {
          x,
          y,
          size: options.size || 12,
          font: options.font || helveticaFont,
          color: options.color || rgb(0, 0, 0),
          ...options
        });
      };

      const drawRectangle = (x: number, y: number, w: number, h: number, options: any = {}) => {
        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          color: options.color || rgb(0.95, 0.95, 0.95),
          borderColor: options.borderColor,
          borderWidth: options.borderWidth || 0,
          ...options
        });
      };

      // Header - Blue background with white text
      const headerHeight = 120;
      drawRectangle(margin, yPosition - headerHeight, width - (2 * margin), headerHeight, {
        color: rgb(0.231, 0.51, 0.965), // #3b82f6
        borderRadius: 8
      });

      // Header Title
      drawText(`Voucher de ${getAssetTypeLabel(voucher.booking.type)}`, margin + 20, yPosition - 35, {
        size: 20,
        font: helveticaBold,
        color: rgb(1, 1, 1)
      });

      // Header Subtitle
      drawText('Apresente este voucher no estabelecimento', margin + 20, yPosition - 60, {
        size: 12,
        color: rgb(1, 1, 1)
      });

      // Voucher Number Box
      const voucherBoxWidth = 200;
      const voucherBoxX = (width - voucherBoxWidth) / 2;
      drawRectangle(voucherBoxX, yPosition - 100, voucherBoxWidth, 25, {
        color: rgb(1, 1, 1),
        opacity: 0.2,
        borderRadius: 6
      });

      drawText(voucher.voucherNumber, voucherBoxX + 10, yPosition - 90, {
        size: 14,
        font: courierFont,
        color: rgb(1, 1, 1)
      });

      yPosition -= headerHeight + 30;

      // Customer Information Section
      const sectionHeight = 80;
      drawRectangle(margin, yPosition - sectionHeight, width - (2 * margin), sectionHeight, {
        color: rgb(0.976, 0.98, 0.984),
        borderColor: rgb(0.231, 0.51, 0.965),
        borderWidth: 3
      });

      drawText('👤 Informações do Cliente', margin + 15, yPosition - 20, {
        size: 14,
        font: helveticaBold,
        color: rgb(0.122, 0.161, 0.216)
      });

      drawText(`Nome: ${voucher.customer.name}`, margin + 15, yPosition - 40, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      drawText(`Email: ${voucher.customer.email}`, margin + 15, yPosition - 55, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      drawText(`Telefone: ${voucher.customer.phone || 'Não informado'}`, margin + 15, yPosition - 70, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      yPosition -= sectionHeight + 20;

      // Service Information Section
      drawRectangle(margin, yPosition - sectionHeight, width - (2 * margin), sectionHeight, {
        color: rgb(0.976, 0.98, 0.984),
        borderColor: rgb(0.231, 0.51, 0.965),
        borderWidth: 3
      });

      drawText('🎯 Informações do Serviço', margin + 15, yPosition - 20, {
        size: 14,
        font: helveticaBold,
        color: rgb(0.122, 0.161, 0.216)
      });

      drawText(`Nome: ${voucher.asset.name}`, margin + 15, yPosition - 40, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      if (voucher.asset.location) {
        drawText(`Local: ${voucher.asset.location}`, margin + 15, yPosition - 55, {
          size: 10,
          color: rgb(0.067, 0.102, 0.153)
        });
      }

      drawText(`Parceiro: ${voucher.partner.name}`, margin + 15, yPosition - 70, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      yPosition -= sectionHeight + 20;

      // Booking Details Section - Yellow background
      const bookingHeight = 100;
      drawRectangle(margin, yPosition - bookingHeight, width - (2 * margin), bookingHeight, {
        color: rgb(0.996, 0.953, 0.78),
        borderColor: rgb(0.984, 0.749, 0.141),
        borderWidth: 1
      });

      drawText('📅 Detalhes da Reserva', margin + 15, yPosition - 20, {
        size: 14,
        font: helveticaBold,
        color: rgb(0.573, 0.251, 0.055)
      });

      drawText(`Confirmação: ${voucher.booking.confirmationCode}`, margin + 15, yPosition - 40, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      drawText(`Data: ${formatDate(voucher.booking.date)}`, margin + 15, yPosition - 55, {
        size: 10,
        color: rgb(0.067, 0.102, 0.153)
      });

      if (voucher.booking.time) {
        drawText(`Horário: ${voucher.booking.time}`, margin + 15, yPosition - 70, {
          size: 10,
          color: rgb(0.067, 0.102, 0.153)
        });
      }

      if (voucher.booking.participants) {
        drawText(`Participantes: ${voucher.booking.participants}`, margin + 15, yPosition - 85, {
          size: 10,
          color: rgb(0.067, 0.102, 0.153)
        });
      }

      yPosition -= bookingHeight + 20;

      // QR Code Section
      const qrHeight = 80;
      drawRectangle(margin, yPosition - qrHeight, width - (2 * margin), qrHeight, {
        color: rgb(0.976, 0.98, 0.984)
      });

      drawText('📱 QR Code para Verificação', margin + 15, yPosition - 20, {
        size: 14,
        font: helveticaBold,
        color: rgb(0.122, 0.161, 0.216)
      });

      drawText('Escaneie este código no estabelecimento para validação', margin + 15, yPosition - 40, {
        size: 10,
        color: rgb(0.419, 0.447, 0.502)
      });

      drawText(`QR Code: ${voucher.qrCode}`, margin + 15, yPosition - 55, {
        size: 8,
        font: courierFont,
        color: rgb(0.419, 0.447, 0.502)
      });

      yPosition -= qrHeight + 20;

      // Terms Section
      const termsHeight = 100;
      drawRectangle(margin, yPosition - termsHeight, width - (2 * margin), termsHeight, {
        color: rgb(0.953, 0.957, 0.965)
      });

      drawText('📋 Termos e Condições', margin + 15, yPosition - 20, {
        size: 12,
        font: helveticaBold,
        color: rgb(0.216, 0.255, 0.318)
      });

      const termsText = [
        '• Este voucher é pessoal e intransferível.',
        '• Apresente este voucher no estabelecimento junto com documento de identidade.',
        '• Sujeito à disponibilidade e condições do estabelecimento.',
        '• Em caso de cancelamento, siga as políticas do estabelecimento.',
        '• Válido apenas para o serviço e data especificados.'
      ];

      termsText.forEach((term, index) => {
        drawText(term, margin + 15, yPosition - 35 - (index * 12), {
          size: 8,
          color: rgb(0.419, 0.447, 0.502)
        });
      });

      yPosition -= termsHeight + 20;

      // Footer
      const footerHeight = 60;
      drawRectangle(margin, yPosition - footerHeight, width - (2 * margin), footerHeight, {
        color: rgb(0.976, 0.98, 0.984),
        borderColor: rgb(0.898, 0.906, 0.922),
        borderWidth: 1
      });

      drawText('Tuca Noronha Tourism', margin + 15, yPosition - 20, {
        size: 11,
        font: helveticaBold,
        color: rgb(0.122, 0.161, 0.216)
      });

      drawText('📧 suporte@tucanoronha.com | 📞 (11) 99999-9999', margin + 15, yPosition - 35, {
        size: 9,
        color: rgb(0.419, 0.447, 0.502)
      });

      drawText('🌐 www.tucanoronha.com', margin + 15, yPosition - 50, {
        size: 9,
        color: rgb(0.419, 0.447, 0.502)
      });

      drawText(`Gerado em: ${formatDate(voucher.generatedAt)}`, width - margin - 150, yPosition - 35, {
        size: 8,
        color: rgb(0.419, 0.447, 0.502)
      });

      // Generate PDF buffer
      const pdfBytes = await pdfDoc.save();

      // Store PDF in Convex file storage
      const storageId = await ctx.storage.store(
        new Blob([pdfBytes], { type: 'application/pdf' })
      );

      // Update voucher with PDF storage ID
      await ctx.runMutation(internal.domains.vouchers.mutations.updateVoucherPDF, {
        voucherNumber,
        pdfStorageId: storageId,
      });

      // Log PDF generation
      await ctx.runMutation(internal.domains.vouchers.mutations.recordVoucherDownload, {
        voucherNumber,
        userType: "system",
        metadata: "PDF generated server-side with PDF-lib",
      });

      return {
        success: true,
        storageId,
        size: pdfBytes.length,
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  },
});

/**
 * Get voucher PDF download URL
 */
export const getVoucherPDFUrl = action({
  args: {
    voucherNumber: v.string(),
  },
  handler: async (ctx, { voucherNumber }) => {
    // Get voucher data
    const voucher = await ctx.runQuery(internal.domains.vouchers.queries.getVoucherByNumber, {
      voucherNumber,
    });

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // Check if PDF exists
    if (!voucher.pdfStorageId) {
      // Generate PDF if it doesn't exist
      await ctx.runAction(internal.domains.vouchers.actions.generateVoucherPDF, {
        voucherNumber,
      });

      // Get updated voucher data
      const updatedVoucher = await ctx.runQuery(internal.domains.vouchers.queries.getVoucherByNumber, {
        voucherNumber,
      });

      if (!updatedVoucher?.pdfStorageId) {
        throw new Error("Erro ao gerar PDF");
      }

      return await ctx.storage.getUrl(updatedVoucher.pdfStorageId);
    }

    return await ctx.storage.getUrl(voucher.pdfStorageId);
  },
});

/**
 * Generate secure QR code verification token
 */
export const generateQRVerificationToken = action({
  args: {
    voucherNumber: v.string(),
    expirationHours: v.optional(v.number()),
  },
  handler: async (ctx, { voucherNumber, expirationHours = 24 }) => {
    try {
      // Get voucher data
      const voucher = await ctx.runQuery(internal.domains.vouchers.queries.getVoucherByNumber, {
        voucherNumber,
      });

      if (!voucher) {
        throw new Error("Voucher não encontrado");
      }

      // Generate verification token with expiration
      const now = Date.now();
      const expiration = now + (expirationHours * 60 * 60 * 1000);
      
      // Create token payload
      const tokenPayload = {
        v: "1.0",                      // Version
        t: "voucher",                 // Type
        n: voucherNumber,             // Voucher number
        exp: expiration,              // Expiration timestamp
        iat: now,                     // Issued at timestamp
        pid: voucher.partner._id,     // Partner ID for verification
        sid: voucher._id,             // Voucher system ID
      };

      // Sign the token with a simple hash (for now, will improve with Web Crypto API later)
      const secret = process.env.VOUCHER_SECRET || "default-secret-key";
      const tokenString = JSON.stringify(tokenPayload);
      const signature = btoa(tokenString + secret).slice(0, 32);

      // Create final token
      const token = {
        ...tokenPayload,
        sig: signature
      };

      // Generate QR code content as base64 JSON
      const qrContent = Buffer.from(JSON.stringify(token)).toString('base64');

      // Update voucher with new verification token
      await ctx.runMutation(internal.domains.vouchers.mutations.updateVoucherVerificationToken, {
        voucherNumber,
        verificationToken: qrContent,
        expiresAt: expiration,
      });

      return {
        success: true,
        qrContent,
        expiresAt: expiration,
      };
    } catch (error) {
      console.error("Error generating QR verification token:", error);
      throw new Error(`Erro ao gerar token de verificação: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  },
});

/**
 * Verify QR code token and return voucher details
 */
export const verifyQRToken = action({
  args: {
    qrContent: v.string(),
    partnerId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { qrContent, partnerId, ipAddress, userAgent }) => {
    try {
      // Decode base64 QR content
      let tokenData;
      try {
        const decodedContent = Buffer.from(qrContent, 'base64').toString('utf8');
        tokenData = JSON.parse(decodedContent);
      } catch (err) {
        throw new Error("QR Code inválido ou corrompido");
      }

      // Validate token structure
      if (!tokenData.v || !tokenData.t || !tokenData.n || !tokenData.exp || !tokenData.sig) {
        throw new Error("Token QR inválido - estrutura incorreta");
      }

      // Check token version
      if (tokenData.v !== "1.0") {
        throw new Error("Versão do token QR não suportada");
      }

      // Check token type
      if (tokenData.t !== "voucher") {
        throw new Error("Tipo de token QR inválido");
      }

      // Check expiration
      if (Date.now() > tokenData.exp) {
        throw new Error("Token QR expirado");
      }

      // Verify signature
      const { sig, ...payload } = tokenData;
      const secret = process.env.VOUCHER_SECRET || "default-secret-key";
      const expectedSignature = btoa(JSON.stringify(payload) + secret).slice(0, 32);

      if (sig !== expectedSignature) {
        throw new Error("Token QR inválido - assinatura incorreta");
      }

      // Get voucher data
      const voucher = await ctx.runQuery(internal.domains.vouchers.queries.getVoucherByNumber, {
        voucherNumber: tokenData.n,
      });

      if (!voucher) {
        throw new Error("Voucher não encontrado");
      }

      // Verify partner access
      if (voucher.partner._id !== partnerId) {
        throw new Error("Acesso negado - voucher não pertence a este parceiro");
      }

      // Check voucher status
      if (voucher.status === "cancelled") {
        throw new Error("Voucher cancelado");
      }

      if (voucher.status === "expired") {
        throw new Error("Voucher expirado");
      }

      if (voucher.status === "used") {
        throw new Error("Voucher já utilizado");
      }

      // Log verification attempt
      await ctx.runMutation(internal.domains.vouchers.mutations.logVoucherAction, {
        voucherNumber: tokenData.n,
        action: "scanned",
        userId: partnerId,
        userType: "partner",
        ipAddress,
        userAgent,
        metadata: JSON.stringify({
          tokenVersion: tokenData.v,
          scannedAt: Date.now(),
          success: true,
        }),
      });

      return {
        success: true,
        voucher: {
          voucherNumber: voucher.voucherNumber,
          status: voucher.status,
          customer: voucher.customer,
          booking: voucher.booking,
          asset: voucher.asset,
          partner: voucher.partner,
          generatedAt: voucher.generatedAt,
          expiresAt: voucher.expiresAt,
        },
        verification: {
          verifiedAt: Date.now(),
          tokenValid: true,
          partnerVerified: true,
          canUse: voucher.status === "active",
        },
      };
    } catch (error) {
      console.error("Error verifying QR token:", error);
      
      // Log failed verification attempt
      try {
        await ctx.runMutation(internal.domains.vouchers.mutations.logVoucherAction, {
          voucherNumber: "unknown",
          action: "scanned",
          userId: partnerId,
          userType: "partner",
          ipAddress,
          userAgent,
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : "Erro desconhecido",
            scannedAt: Date.now(),
            success: false,
          }),
        });
      } catch (logError) {
        console.error("Error logging failed verification:", logError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de verificação",
        verification: {
          verifiedAt: Date.now(),
          tokenValid: false,
          partnerVerified: false,
          canUse: false,
        },
      };
    }
  },
});

/**
 * Manual voucher lookup by voucher number
 */
export const manualVoucherLookup = action({
  args: {
    voucherNumber: v.string(),
    partnerId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { voucherNumber, partnerId, ipAddress, userAgent }) => {
    try {
      // Get voucher data
      const voucher = await ctx.runQuery(internal.domains.vouchers.queries.getVoucherByNumber, {
        voucherNumber,
      });

      if (!voucher) {
        throw new Error("Voucher não encontrado");
      }

      // Verify partner access
      if (voucher.partner._id !== partnerId) {
        throw new Error("Acesso negado - voucher não pertence a este parceiro");
      }

      // Log lookup attempt
      await ctx.runMutation(internal.domains.vouchers.mutations.logVoucherAction, {
        voucherNumber,
        action: "looked_up",
        userId: partnerId,
        userType: "partner",
        ipAddress,
        userAgent,
        metadata: JSON.stringify({
          lookupMethod: "manual",
          lookedUpAt: Date.now(),
          success: true,
        }),
      });

      return {
        success: true,
        voucher: {
          voucherNumber: voucher.voucherNumber,
          status: voucher.status,
          customer: voucher.customer,
          booking: voucher.booking,
          asset: voucher.asset,
          partner: voucher.partner,
          generatedAt: voucher.generatedAt,
          expiresAt: voucher.expiresAt,
          usedAt: voucher.usedAt,
        },
        verification: {
          verifiedAt: Date.now(),
          lookupValid: true,
          partnerVerified: true,
          canUse: voucher.status === "active",
        },
      };
    } catch (error) {
      console.error("Error in manual voucher lookup:", error);
      
      // Log failed lookup attempt
      try {
        await ctx.runMutation(internal.domains.vouchers.mutations.logVoucherAction, {
          voucherNumber,
          action: "looked_up",
          userId: partnerId,
          userType: "partner",
          ipAddress,
          userAgent,
          metadata: JSON.stringify({
            lookupMethod: "manual",
            error: error instanceof Error ? error.message : "Erro desconhecido",
            lookedUpAt: Date.now(),
            success: false,
          }),
        });
      } catch (logError) {
        console.error("Error logging failed lookup:", logError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de consulta",
        verification: {
          verifiedAt: Date.now(),
          lookupValid: false,
          partnerVerified: false,
          canUse: false,
        },
      };
    }
  },
});