/**
 * Email templates for booking approvals and rejections
 */

interface BookingEmailData {
  customerName: string;
  confirmationCode: string;
  assetName: string;
  assetType: string;
  bookingDate?: string;
  bookingTime?: string;
  totalAmount?: number;
  adminNotes?: string;
  rejectionReason?: string;
  bookingDetailsUrl: string;
}

/**
 * Base template for booking emails
 */
function getBookingEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Atualização da Reserva</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <img src="https://qgvvzy3mml.ufs.sh/f/0xZ1EvLKAEpzfpXCGmZS0RtQBhX7sAUFKkL4TzbvlnwWgr2Y" alt="Logo" style="max-width: 180px; height: auto; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Atualização da Reserva</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    ${content}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                      Tuca Noronha Viagens
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                      Este é um email automático, por favor não responda.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
                      Em caso de dúvidas, entre em contato conosco.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Template for booking approval email
 */
export function bookingApprovedEmail(data: BookingEmailData): string {
  const assetTypeLabel = {
    activity: "Atividade",
    event: "Evento",
    vehicle: "Veículo",
    restaurant: "Restaurante",
  }[data.assetType] || "Reserva";

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #d4edda; color: #155724; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        ✓ Reserva Aprovada
      </div>
    </div>

    <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0;">
      Olá, ${data.customerName}!
    </h2>

    <p style="color: #495057; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Temos ótimas notícias! Sua solicitação de reserva foi <strong>aprovada</strong> pelo parceiro.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="color: #28a745; font-size: 18px; margin: 0 0 15px 0;">
        Detalhes da Reserva
      </h3>
      <table width="100%" cellpadding="5" cellspacing="0" style="color: #495057;">
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Código:</td>
          <td style="text-align: right; padding: 8px 0;">${data.confirmationCode}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Tipo:</td>
          <td style="text-align: right; padding: 8px 0;">${assetTypeLabel}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Item:</td>
          <td style="text-align: right; padding: 8px 0;">${data.assetName}</td>
        </tr>
        ${data.bookingDate ? `
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Data:</td>
          <td style="text-align: right; padding: 8px 0;">${data.bookingDate}</td>
        </tr>
        ` : ''}
        ${data.totalAmount ? `
        <tr>
          <td style="font-weight: 600; padding: 8px 0; border-top: 2px solid #28a745; padding-top: 15px;">Valor Total:</td>
          <td style="text-align: right; font-size: 20px; font-weight: bold; color: #28a745; border-top: 2px solid #28a745; padding-top: 15px;">
            R$ ${(data.totalAmount / 100).toFixed(2).replace('.', ',')}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.adminNotes ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h4 style="color: #856404; font-size: 16px; margin: 0 0 10px 0;">
        Observações do Parceiro:
      </h4>
      <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
        ${data.adminNotes}
      </p>
    </div>
    ` : ''}

    ${data.totalAmount && data.totalAmount > 0 ? `
    <div style="background-color: #e7f3ff; border: 2px solid #0066cc; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center;">
      <h3 style="color: #0066cc; font-size: 20px; margin: 0 0 15px 0;">
        Próximo Passo: Pagamento
      </h3>
      <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Para confirmar sua reserva, realize o pagamento através do link abaixo:
      </p>
      <a href="${data.bookingDetailsUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-top: 10px;">
        Pagar Agora
      </a>
    </div>
    ` : `
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://tucanoronha.com.br/reservas" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Ver Detalhes da Reserva
      </a>
    </div>
    `}

    <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
      Estamos felizes em poder servi-lo!
    </p>
  `;

  return getBookingEmailTemplate(content);
}

/**
 * Template for booking rejection email
 */
export function bookingRejectedEmail(data: BookingEmailData): string {
  const assetTypeLabel = {
    activity: "Atividade",
    event: "Evento",
    vehicle: "Veículo",
    restaurant: "Restaurante",
  }[data.assetType] || "Reserva";

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #f8d7da; color: #721c24; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        ✕ Reserva Não Aprovada
      </div>
    </div>

    <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0;">
      Olá, ${data.customerName}!
    </h2>

    <p style="color: #495057; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Infelizmente, sua solicitação de reserva não pôde ser aprovada pelo parceiro.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="color: #dc3545; font-size: 18px; margin: 0 0 15px 0;">
        Detalhes da Solicitação
      </h3>
      <table width="100%" cellpadding="5" cellspacing="0" style="color: #495057;">
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Código:</td>
          <td style="text-align: right; padding: 8px 0;">${data.confirmationCode}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Tipo:</td>
          <td style="text-align: right; padding: 8px 0;">${assetTypeLabel}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Item:</td>
          <td style="text-align: right; padding: 8px 0;">${data.assetName}</td>
        </tr>
        ${data.bookingDate ? `
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Data Solicitada:</td>
          <td style="text-align: right; padding: 8px 0;">${data.bookingDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.adminNotes || data.rejectionReason ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h4 style="color: #856404; font-size: 16px; margin: 0 0 10px 0;">
        Motivo:
      </h4>
      <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
        ${data.adminNotes || data.rejectionReason}
      </p>
    </div>
    ` : ''}

    <div style="background-color: #e7f3ff; border: 1px solid #0066cc; padding: 20px; margin: 30px 0; border-radius: 8px;">
      <h4 style="color: #0066cc; font-size: 16px; margin: 0 0 10px 0;">
        O que fazer agora?
      </h4>
      <p style="color: #495057; font-size: 14px; line-height: 1.6; margin: 0;">
        Você pode tentar fazer uma nova reserva com datas diferentes ou entrar em contato conosco para mais opções.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.SITE_URL || 'https://tucanoronha.com'}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Explorar Outras Opções
      </a>
    </div>

    <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
      Estamos à disposição para ajudá-lo a encontrar a melhor opção!
    </p>
  `;

  return getBookingEmailTemplate(content);
}
