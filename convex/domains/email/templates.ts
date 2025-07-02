"use node";

import type { EmailData } from "./types";

// Função auxiliar para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função auxiliar para formatar data
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Template base para todos os emails
const getBaseTemplate = (content: string): string => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tuca Noronha</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 2rem 1.5rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 2rem 1.5rem;
        }
        
        .highlight-box {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .confirmation-code {
            background-color: #1e40af;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 1.2rem;
            font-weight: bold;
            text-align: center;
            margin: 1rem 0;
        }
        
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 1rem 0;
        }
        
        .button:hover {
            background-color: #2563eb;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .info-item {
            background-color: #f8fafc;
            padding: 0.75rem;
            border-radius: 4px;
        }
        
        .info-label {
            font-weight: 600;
            color: #4b5563;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 1rem;
        }
        
        .footer {
            background-color: #1f2937;
            color: #d1d5db;
            padding: 1.5rem;
            text-align: center;
            font-size: 0.875rem;
        }
        
        .footer a {
            color: #60a5fa;
            text-decoration: none;
        }
        
        .urgent {
            background-color: #fef2f2;
            border: 1px solid #fca5a5;
            color: #b91c1c;
        }
        
        .success {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .header {
                padding: 1.5rem 1rem;
            }
            
            .content {
                padding: 1.5rem 1rem;
            }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
  `;
};

// Template para confirmação de reserva
export const getBookingConfirmationTemplate = (data: any): string => {
  // Gerar lista HTML com todos os detalhes extras da reserva (campos dinâmicos)
  const extraDetailsHtml = data.bookingDetails
    ? Object.entries(data.bookingDetails)
        .map(([key, value]) => {
          // Transformar chave em formato legível (ex: "pickupLocation" => "Pickup Location")
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase());
          const displayValue =
            typeof value === "object"
              ? JSON.stringify(value)
              : String(value);
          return `<li><strong>${label}:</strong> ${displayValue}</li>`;
        })
        .join("")
    : "";
  const content = `
    <div class="container">
        <div class="header">
            <h1>🎉 Reserva Confirmada!</h1>
            <p>Sua reserva foi confirmada com sucesso</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Temos o prazer de confirmar sua reserva para <strong>${data.assetName}</strong>!</p>
            
            <div class="confirmation-code">
                Código de Confirmação: ${data.confirmationCode}
            </div>
            
            <div class="highlight-box success">
                <h3>Detalhes da Reserva</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Tipo</div>
                        <div class="info-value">${data.bookingType === 'activity' ? 'Atividade' : 
                                                  data.bookingType === 'event' ? 'Evento' :
                                                  data.bookingType === 'restaurant' ? 'Restaurante' :
                                                  data.bookingType === 'vehicle' ? 'Veículo' : 'Hospedagem'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Data</div>
                        <div class="info-value">${formatDate(data.bookingDate)}</div>
                    </div>
                    ${data.totalPrice ? `
                    <div class="info-item">
                        <div class="info-label">Valor Total</div>
                        <div class="info-value">${formatCurrency(data.totalPrice)}</div>
                    </div>
                    ` : ''}
                    ${data.partnerName ? `
                    <div class="info-item">
                        <div class="info-label">Responsável</div>
                        <div class="info-value">${data.partnerName}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${data.bookingDetails ? `
            <div class="highlight-box">
                <h3>Informações Adicionais da Reserva</h3>
                <ul style="margin: 0 0 0 1.5rem;">
                    ${extraDetailsHtml}
                </ul>
            </div>
            ` : ''}
            
            <p><strong>Importante:</strong> Guarde este código de confirmação. Você precisará dele no dia da sua experiência.</p>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="https://tucanoronha.com/meu-painel" class="button">
                    Ver Minhas Reservas
                </a>
            </div>
            
            <p>Se você tiver alguma dúvida, entre em contato conosco através do nosso suporte.</p>
            
            <p>Obrigado por escolher o Tuca Noronha! ✈️🏝️</p>
        </div>
        
        <div class="footer">
            <p>Tuca Noronha - Sua experiência em Fernando de Noronha</p>
            <p>📧 suporte@tucanoronha.com | 📱 (81) 99999-9999</p>
            <p><a href="https://tucanoronha.com">www.tucanoronha.com</a></p>
        </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para cancelamento de reserva
export const getBookingCancelledTemplate = (data: any): string => {
  const content = `
    <div class="container">
        <div class="header">
            <h1>❌ Reserva Cancelada</h1>
            <p>Informações sobre o cancelamento</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Sua reserva para <strong>${data.assetName}</strong> foi cancelada.</p>
            
            <div class="highlight-box urgent">
                <h3>Detalhes do Cancelamento</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Código da Reserva</div>
                        <div class="info-value">${data.confirmationCode}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Tipo</div>
                        <div class="info-value">${data.bookingType === 'activity' ? 'Atividade' : 
                                                  data.bookingType === 'event' ? 'Evento' :
                                                  data.bookingType === 'restaurant' ? 'Restaurante' :
                                                  data.bookingType === 'vehicle' ? 'Veículo' : 'Hospedagem'}</div>
                    </div>
                    ${data.reason ? `
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <div class="info-label">Motivo</div>
                        <div class="info-value">${data.reason}</div>
                    </div>
                    ` : ''}
                    ${data.refundAmount ? `
                    <div class="info-item">
                        <div class="info-label">Valor do Reembolso</div>
                        <div class="info-value">${formatCurrency(data.refundAmount)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${data.refundAmount ? `
            <p><strong>Reembolso:</strong> O valor de ${formatCurrency(data.refundAmount)} será estornado em sua forma de pagamento original em até 5 dias úteis.</p>
            ` : ''}
            
            <p>Lamentamos qualquer inconveniente causado. Nossa equipe está sempre disponível para ajudá-lo a encontrar outras opções incríveis em Fernando de Noronha.</p>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="https://tucanoronha.com" class="button">
                    Explorar Outras Opções
                </a>
            </div>
            
            <p>Se você tiver alguma dúvida sobre este cancelamento, entre em contato conosco.</p>
        </div>
        
        <div class="footer">
            <p>Tuca Noronha - Sua experiência em Fernando de Noronha</p>
            <p>📧 suporte@tucanoronha.com | 📱 (81) 99999-9999</p>
            <p><a href="https://tucanoronha.com">www.tucanoronha.com</a></p>
        </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para solicitação de pacote recebida
export const getPackageRequestReceivedTemplate = (data: any): string => {
  const content = `
    <div class="container">
        <div class="header">
            <h1>📝 Solicitação Recebida!</h1>
            <p>Sua solicitação de pacote personalizado foi recebida</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Recebemos sua solicitação de pacote personalizado para Fernando de Noronha!</p>
            
            <div class="confirmation-code">
                Número de Acompanhamento: ${data.requestNumber}
            </div>
            
            <div class="highlight-box">
                <h3>Resumo da Sua Solicitação</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Destino</div>
                        <div class="info-value">${data.destination}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Duração</div>
                        <div class="info-value">${data.duration} ${data.duration === 1 ? 'dia' : 'dias'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Pessoas</div>
                        <div class="info-value">${data.guests} ${data.guests === 1 ? 'pessoa' : 'pessoas'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Orçamento</div>
                        <div class="info-value">${formatCurrency(data.budget)}</div>
                    </div>
                </div>
            </div>
            
            <p><strong>Próximos passos:</strong></p>
            <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                <li>Nossa equipe analisará sua solicitação</li>
                <li>Criaremos uma proposta personalizada para você</li>
                <li>Entraremos em contato em até 24 horas</li>
            </ul>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="https://tuca-noronha.vercel.app/meu-painel" class="button">
                    Acompanhar Solicitação
                </a>
            </div>
            
            <p>Você pode usar o número de acompanhamento <strong>${data.requestNumber}</strong> para verificar o status da sua solicitação a qualquer momento.</p>
            
            <p>Obrigado por confiar no Tuca Noronha para criar sua experiência perfeita! 🏝️</p>
        </div>
        
        <div class="footer">
            <p>Tuca Noronha - Sua experiência em Fernando de Noronha</p>
            <p>📧 suporte@tucanoronha.com | 📱 (81) 99999-9999</p>
            <p><a href="https://tucanoronha.com">www.tucanoronha.com</a></p>
        </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para nova reserva (para parceiros)
export const getPartnerNewBookingTemplate = (data: any): string => {
  const extraDetailsHtml = data.bookingDetails
    ? Object.entries(data.bookingDetails)
        .map(([key, value]) => {
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase());
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return `<li><strong>${label}:</strong> ${displayValue}</li>`;
        })
        .join('')
    : '';
  const content = `
    <div class="container">
        <div class="header">
            <h1>🎯 Nova Reserva Recebida!</h1>
            <p>Você tem uma nova reserva para confirmar</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>${data.partnerName}</strong>,</p>
            <p>Você recebeu uma nova reserva para <strong>${data.assetName}</strong>!</p>
            
            <div class="highlight-box success">
                <h3>Detalhes da Reserva</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Cliente</div>
                        <div class="info-value">${data.customerName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Código de Confirmação</div>
                        <div class="info-value">${data.confirmationCode}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Data</div>
                        <div class="info-value">${formatDate(data.bookingDate)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Tipo</div>
                        <div class="info-value">${data.bookingType === 'activity' ? 'Atividade' : 
                                                  data.bookingType === 'event' ? 'Evento' :
                                                  data.bookingType === 'restaurant' ? 'Restaurante' :
                                                  data.bookingType === 'vehicle' ? 'Veículo' : 'Hospedagem'}</div>
                    </div>
                    ${data.totalPrice ? `
                    <div class="info-item">
                        <div class="info-label">Valor</div>
                        <div class="info-value">${formatCurrency(data.totalPrice)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="highlight-box">
                <h3>Contato do Cliente</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${data.customerContact.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Telefone</div>
                        <div class="info-value">${data.customerContact.phone}</div>
                    </div>
                </div>
            </div>
            
            ${data.bookingDetails ? `
            <div class="highlight-box">
                <h3>Informações Adicionais da Reserva</h3>
                <ul style="margin: 0 0 0 1.5rem;">
                    ${extraDetailsHtml}
                </ul>
            </div>
            ` : ''}
            
            <p><strong>Ação necessária:</strong> Acesse o painel de parceiro para confirmar ou gerenciar esta reserva.</p>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="https://tuca-noronha.vercel.app/admin/dashboard/reservas/" class="button">
                    Gerenciar Reserva
                </a>
            </div>
            
            <p>Lembre-se de confirmar a reserva o quanto antes para garantir uma boa experiência ao cliente.</p>
        </div>
        
        <div class="footer">
            <p>Tuca Noronha - Portal do Parceiro</p>
            <p>📧 parceiros@tucanoronha.com | 📱 (81) 99999-9999</p>
            <p><a href="https://tucanoronha.com">www.tucanoronha.com</a></p>
        </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para boas-vindas a novos usuários
export const getWelcomeNewUserTemplate = (data: any): string => {
  const roleMessages = {
    traveler: {
      title: "🏝️ Bem-vindo ao Tuca Noronha!",
      message: "Estamos animados para ajudá-lo a descobrir as maravilhas de Fernando de Noronha!",
      features: [
        "🎯 Explore atividades exclusivas",
        "🏨 Reserve hospedagens incríveis", 
        "🍽️ Descubra restaurantes locais",
        "📱 Gerencie suas reservas facilmente"
      ]
    },
    partner: {
      title: "🤝 Bem-vindo, Parceiro!",
      message: "Obrigado por se juntar à nossa rede de parceiros em Fernando de Noronha!",
      features: [
        "📊 Gerencie suas ofertas",
        "📅 Controle suas reservas",
        "💰 Acompanhe seus ganhos",
        "📈 Analise performance"
      ]
    },
    employee: {
      title: "👋 Bem-vindo à Equipe!",
      message: "Estamos felizes em tê-lo como parte da equipe Tucano Noronha!",
      features: [
        "🎯 Gerencie operações",
        "👥 Suporte aos clientes",
        "📋 Administre reservas",
        "📊 Relatórios e métricas"
      ]
    },
    master: {
      title: "🚀 Bem-vindo, Administrador!",
      message: "Você tem acesso completo à plataforma Tuca Noronha!",
      features: [
        "🔧 Controle total do sistema",
        "👥 Gestão de usuários",
        "📊 Analytics avançados",
        "🏗️ Configurações gerais"
      ]
    }
  };

  const roleInfo = roleMessages[data.userRole as keyof typeof roleMessages] || roleMessages.traveler;

  const content = `
    <div class="container">
        <div class="header">
            <h1>${roleInfo.title}</h1>
            <p>${roleInfo.message}</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>${data.userName}</strong>,</p>
            <p>Sua conta foi criada com sucesso! Agora você pode aproveitar todos os recursos da nossa plataforma.</p>
            
            <div class="highlight-box">
                <h3>O que você pode fazer:</h3>
                <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                    ${roleInfo.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            
            <p><strong>Suas informações de acesso:</strong></p>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${data.userEmail}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo de Conta</div>
                    <div class="info-value">${data.userRole === 'traveler' ? 'Viajante' : 
                                              data.userRole === 'partner' ? 'Parceiro' :
                                              data.userRole === 'employee' ? 'Funcionário' : 'Administrador'}</div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="https://tucanoronha.com/${data.userRole === 'traveler' ? 'meu-painel' : 'admin/dashboard'}" class="button">
                    Acessar Plataforma
                </a>
            </div>
            
            <p>Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe de suporte está sempre disponível.</p>
            
            <p>Bem-vindo à família Tuca Noronha! 🌺</p>
        </div>
        
        <div class="footer">
            <p>Tuca Noronha - Sua experiência em Fernando de Noronha</p>
            <p>📧 suporte@tucanoronha.com | 📱 (81) 99999-9999</p>
            <p><a href="https://tucanoronha.com">www.tucanoronha.com</a></p>
        </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Função principal para obter template por tipo
export const getEmailTemplate = (data: EmailData): string => {
  switch (data.type) {
    case 'booking_confirmation':
      return getBookingConfirmationTemplate(data);
    case 'booking_cancelled':
      return getBookingCancelledTemplate(data);
    case 'package_request_received':
      return getPackageRequestReceivedTemplate(data);
    case 'partner_new_booking':
      return getPartnerNewBookingTemplate(data);
    case 'welcome_new_user':
      return getWelcomeNewUserTemplate(data);
    default:
      // Template genérico para tipos não implementados
      return getBaseTemplate(`
        <div class="container">
            <div class="header">
                <h1>Tuca Noronha</h1>
                <p>Notificação importante</p>
            </div>
            <div class="content">
                <p>Você recebeu uma notificação do Tuca Noronha.</p>
                <p>Entre em contato conosco se precisar de ajuda.</p>
            </div>
            <div class="footer">
                <p>Tuca Noronha - Sua experiência em Fernando de Noronha</p>
                <p>📧 suporte@tucanoronha.com | 📱 (81) 99999-9999</p>
            </div>
        </div>
      `);
  }
}; 