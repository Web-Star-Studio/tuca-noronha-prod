"use node";

// Template base minimalista com logo
const getMinimalTemplate = (content: string): string => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tuca Noronha</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="https://qgvvzy3mml.ufs.sh/f/0xZ1EvLKAEpzfpXCGmZS0RtQBhX7sAUFKkL4TzbvlnwWgr2Y" alt="Tuca Noronha" style="max-width: 180px; height: auto;" />
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Tuca Noronha - Experiências em Fernando de Noronha
                            </p>
                            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                                Este é um email automático, por favor não responda.
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
};

// Estilo para botão
const getButtonStyle = () => `
  display: inline-block;
  padding: 14px 32px;
  background-color: #2563eb;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 16px;
  margin: 24px 0;
`;

// Estilo para card de informação
const getInfoCard = (title: string, items: Array<{label: string, value: string}>) => `
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">${title}</h3>
    ${items.map(item => `
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">${item.label}</span>
        <span style="color: #111827; font-size: 15px; font-weight: 500;">${item.value}</span>
      </div>
    `).join('')}
  </div>
`;

// ====================
// EMAILS PARA ADMIN
// ====================

// 1. Nova Solicitação de Pacote (Notificação Genérica)
export const newPackageRequestAdminEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 28px; font-weight: 700;">
      Nova Solicitação Recebida!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Um viajante solicitou um pacote personalizado.
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-size: 15px; font-weight: 600;">
        Uma nova solicitação foi registrada no sistema
      </p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Acesse o painel administrativo para visualizar os detalhes completos da solicitação e criar uma proposta personalizada para o cliente.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/admin/dashboard/solicitacoes-pacotes" 
         style="${getButtonStyle()}">
        Acessar Painel Admin
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Responda rapidamente para oferecer a melhor experiência ao cliente!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 2. Viajante Aceitou Proposta (Notificação Genérica)
export const proposalAcceptedAdminEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 28px; font-weight: 700;">
      Cliente Aceitou Proposta!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Um cliente aceitou uma proposta de pacote.
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-size: 15px; font-weight: 600;">
        Proposta aceita com sucesso
      </p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Acesse o painel administrativo para visualizar os detalhes completos e iniciar o processo de confirmação da viagem.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/admin/dashboard/solicitacoes-pacotes" 
         style="${getButtonStyle()}">
        Acessar Painel Admin
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Próximo passo: Coletar dados dos participantes e confirmar a viagem!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 3. Viajante Rejeitou Proposta (Notificação Genérica)
export const proposalRejectedAdminEmail = (): string => {
  const content = `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; color: #b91c1c; font-weight: 600; font-size: 16px;">Proposta Rejeitada</p>
    </div>
    
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Proposta Rejeitada por Cliente
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Um cliente rejeitou uma proposta de pacote no sistema.
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        Acesse o painel para visualizar o motivo da rejeição e detalhes completos.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/admin/dashboard/solicitacoes-pacotes" 
         style="${getButtonStyle()}">
        Acessar Painel Admin
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Entre em contato com o cliente para entender melhor suas necessidades.
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 4. Viajante Pediu Revisão (Notificação Genérica)
export const proposalRevisionRequestedAdminEmail = (): string => {
  const content = `
    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; color: #9a3412; font-weight: 600; font-size: 16px;">Revisão Solicitada</p>
    </div>
    
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Cliente Solicitou Revisão de Proposta
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Um cliente solicitou alterações em uma proposta de pacote.
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        Acesse o painel para visualizar as solicitações de alterações e revisar a proposta.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/admin/dashboard/solicitacoes-pacotes" 
         style="${getButtonStyle()}">
        Acessar Painel Admin
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Ajuste a proposta conforme solicitado e reenvie ao cliente.
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// ====================
// EMAILS PARA VIAJANTE
// ====================

// 5. Proposta Enviada (Notificação Genérica para Viajante)
export const proposalSentTravelerEmail = (data: {
  proposalLink: string;
}): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Sua Proposta Está Pronta!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Preparamos uma proposta personalizada especialmente para você.
    </p>
    
    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #9a3412; font-size: 14px;">
        <strong>Atenção:</strong> Esta proposta tem validade de 24 horas. Não perca essa oportunidade!
      </p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Acesse seu painel para visualizar os detalhes completos da proposta e tomar sua decisão.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://tucanoronha.com.br/meu-painel" 
         style="${getButtonStyle()}">
        Acessar Meu Painel
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Tem dúvidas? Responda este email ou entre em contato conosco.
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 6. Confirmação de Solicitação Recebida (Notificação Genérica para Viajante)
export const packageRequestReceivedTravelerEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Solicitação Recebida!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Recebemos sua solicitação de pacote personalizado.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-weight: 600;">Sua solicitação foi registrada com sucesso</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Nossa equipe está analisando todos os detalhes da sua viagem e em até 24 horas você receberá uma proposta personalizada por email.
    </p>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Fique atento ao seu email!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 7. Reserva de Voos Iniciada (Viajante)
export const flightBookingStartedTravelerEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Reserva de Voos Iniciada!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Estamos trabalhando na reserva dos seus voos.
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-weight: 600;">Processo de reserva em andamento</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Nossa equipe está trabalhando para garantir os melhores voos para sua viagem. Você receberá uma confirmação assim que a reserva for concluída.
    </p>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Aguarde atualizações em breve!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 8. Voos Confirmados (Viajante)
export const flightsConfirmedTravelerEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Voos Confirmados!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Ótimas notícias! Seus voos foram confirmados com sucesso.
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-weight: 600;">Reservas confirmadas</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Os detalhes completos dos seus voos estão disponíveis no seu painel. Em breve você receberá toda a documentação necessária para a viagem.
    </p>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Sua viagem está cada vez mais próxima!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 9. Documentos Prontos (Viajante)
export const documentsReadyTravelerEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Documentos Prontos!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Toda a documentação da sua viagem está disponível.
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-weight: 600;">Documentos disponíveis para download</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Acesse seu painel para visualizar e baixar todos os vouchers, bilhetes e documentos necessários para sua viagem.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://tucanoronha.com.br/meu-painel" 
         style="${getButtonStyle()}">
        Acessar Meu Painel
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Revise com atenção todos os documentos antes da viagem!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// ====================
// EMAILS DE BOOKING (RESERVAS AVULSAS)
// ====================

// 10. Confirmação de Reserva
export const bookingConfirmationEmail = (data: { bookingLink: string }): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Reserva Confirmada!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Sua reserva foi confirmada com sucesso.
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-weight: 600;">Reserva processada</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Acesse seu painel para visualizar todos os detalhes da sua reserva e baixar os vouchers necessários.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${data.bookingLink}" 
         style="${getButtonStyle()}">
        Ver Detalhes da Reserva
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Estamos ansiosos para receber você!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 11. Cancelamento de Reserva
export const bookingCancelledEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Reserva Cancelada
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Sua reserva foi cancelada conforme solicitado.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #b91c1c; font-weight: 600;">Cancelamento confirmado</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Se você tiver alguma dúvida sobre o processo de reembolso ou quiser fazer uma nova reserva, entre em contato conosco.
    </p>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Esperamos vê-lo em breve!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 12. Bem-vindo ao Sistema
export const welcomeNewUserEmail = (): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Bem-vindo ao Tuca Noronha!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Sua conta foi criada com sucesso.
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-weight: 600;">Conta ativada</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Agora você pode acessar seu painel, fazer reservas e gerenciar suas viagens para Fernando de Noronha de forma fácil e rápida.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://tucanoronha.com.br/meu-painel" 
         style="${getButtonStyle()}">
        Acessar Meu Painel
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Explore as melhores experiências em Fernando de Noronha!
    </p>
  `;
  
  return getMinimalTemplate(content);
};

// 13. Nova Reserva para Partner
export const partnerNewBookingEmail = (data: { bookingLink: string }): string => {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
      Nova Reserva Recebida!
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
      Você recebeu uma nova reserva para sua atividade.
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-weight: 600;">Reserva aguardando confirmação</p>
    </div>
    
    <p style="margin: 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Acesse seu painel de parceiro para visualizar os detalhes completos da reserva e gerenciar a confirmação.
    </p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${data.bookingLink}" 
         style="${getButtonStyle()}">
        Ver Detalhes da Reserva
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      Responda rapidamente para garantir a melhor experiência ao cliente!
    </p>
  `;
  
  return getMinimalTemplate(content);
};
