# Sistema de Emails - Tucano Noronha

Este documento explica como configurar e usar o sistema de emails implementado com Nodemailer no projeto Tucano Noronha.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Tipos de Emails](#tipos-de-emails)
- [Estrutura do Sistema](#estrutura-do-sistema)
- [Como Usar](#como-usar)
- [Testes](#testes)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

## 🔍 Visão Geral

O sistema de emails automatiza o envio de notificações importantes para:

### Para Clientes (Travelers):
- ✅ Confirmação de reservas (atividades, eventos, restaurantes, veículos)
- ❌ Cancelamento de reservas
- 📦 Confirmação de solicitação de pacotes personalizados
- 🔔 Atualizações de status de solicitações
- 👋 Boas-vindas para novos usuários

### Para Parceiros:
- 📬 Notificação de novas reservas
- 📊 Relatórios de atividade
- 👥 Convites para funcionários

### Para Administradores:
- 🆘 Mensagens de suporte urgentes
- 📋 Novas solicitações de pacotes
- 🔧 Registro de novos parceiros

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env.local`:

```bash
# Configuração SMTP para Produção
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app

# Email de origem
EMAIL_FROM_NAME=Tucano Noronha
EMAIL_FROM=noreply@tucanoronha.com

# Emails importantes do sistema
ADMIN_EMAIL=admin@tucanoronha.com
SUPPORT_EMAIL=suporte@tucanoronha.com
NO_REPLY_EMAIL=noreply@tucanoronha.com
MASTER_EMAIL=master@tucanoronha.com

# Para desenvolvimento (usando Ethereal Email para testes)
EMAIL_USER=ethereal.user@ethereal.email
EMAIL_PASS=ethereal.password
```

### 2. Configuração Gmail (Produção)

Para usar o Gmail como provedor SMTP:

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de App" específica para o projeto
3. Use essa senha no `SMTP_PASS`

### 3. Configuração de Desenvolvimento

Em desenvolvimento, o sistema usa automaticamente o Ethereal Email para testes. Os emails são apenas simulados e você pode visualizá-los através de links que aparecem no console.

## 📧 Tipos de Emails

### 1. Confirmação de Reserva (`booking_confirmation`)
- **Quando:** Após criação de qualquer reserva
- **Para:** Cliente que fez a reserva
- **Conteúdo:** Detalhes da reserva, código de confirmação, informações do parceiro

### 2. Cancelamento de Reserva (`booking_cancelled`)
- **Quando:** Após cancelamento de uma reserva
- **Para:** Cliente
- **Conteúdo:** Motivo do cancelamento, informações de reembolso

### 3. Nova Reserva para Parceiro (`partner_new_booking`)
- **Quando:** Após criação de uma reserva
- **Para:** Parceiro responsável pelo serviço
- **Conteúdo:** Dados do cliente, detalhes da reserva, ações necessárias

### 4. Solicitação de Pacote Recebida (`package_request_received`)
- **Quando:** Após envio de solicitação de pacote personalizado
- **Para:** Cliente solicitante e administradores
- **Conteúdo:** Número de acompanhamento, resumo da solicitação

### 5. Boas-vindas (`welcome_new_user`)
- **Quando:** Após criação de nova conta
- **Para:** Novo usuário
- **Conteúdo:** Informações da conta, próximos passos

### 6. Mensagem de Suporte (`support_message`)
- **Quando:** Envio de mensagem através do sistema de suporte
- **Para:** Equipe de suporte
- **Conteúdo:** Dados do cliente, categoria, mensagem

## 🏗️ Estrutura do Sistema

```
convex/domains/email/
├── types.ts          # Definições de tipos TypeScript
├── config.ts         # Configurações de SMTP e emails
├── templates.ts      # Templates HTML dos emails
├── service.ts        # Serviço principal usando Nodemailer
├── actions.ts        # Ações do Convex para envio
├── mutations.ts      # Mutations para logs e administração
├── queries.ts        # Queries para relatórios e estatísticas
└── index.ts          # Exportações principais
```

### Templates Responsivos

Todos os emails usam templates HTML responsivos com:
- ✨ Design moderno e profissional
- 📱 Compatibilidade com dispositivos móveis
- 🎨 Cores da marca Tucano Noronha
- 📧 Links de ação diretos

## 🚀 Como Usar

### Enviando Emails Programaticamente

```typescript
// Em uma mutation do Convex
await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingConfirmationEmail, {
  customerEmail: "cliente@exemplo.com",
  customerName: "João Silva",
  assetName: "Passeio de Barco",
  bookingType: "activity",
  confirmationCode: "ABC123",
  bookingDate: "2024-02-15",
  totalPrice: 150.00,
  bookingDetails: {
    // dados específicos da reserva
  },
});
```

### Adicionando Novos Tipos de Email

1. **Adicione o tipo em `types.ts`:**
```typescript
export interface NovoTipoEmailData extends BaseEmailData {
  type: "novo_tipo";
  // campos específicos
}
```

2. **Crie o template em `templates.ts`:**
```typescript
export const getNovoTipoTemplate = (data: NovoTipoEmailData): string => {
  // implementação do template
};
```

3. **Adicione a ação em `actions.ts`:**
```typescript
export const sendNovoTipoEmail = internalAction({
  // implementação da ação
});
```

## 🧪 Testes

### Teste Manual

Execute o script de teste:

```bash
# Teste com seu email
node scripts/test-email.js seu-email@exemplo.com
```

### Teste de Reserva

Crie uma reserva real no sistema e verifique se os emails são enviados corretamente.

### Monitoramento de Logs

Acesse o painel admin para ver logs de emails:
- `/admin/dashboard/logs`
- Filtros por tipo, status, destinatário
- Estatísticas de sucesso/falha

## 📊 Monitoramento

### Logs de Email

Todos os emails são logados na tabela `emailLogs` com:
- ✅ Status (sent/failed/pending)
- 📧 Destinatário e tipo
- ⏰ Timestamps de criação e envio
- ❌ Mensagens de erro (se houver)

### Queries Disponíveis

```typescript
// Buscar logs de email
const logs = await ctx.runQuery(api.domains.email.queries.getEmailLogs, {
  limit: 50,
  type: "booking_confirmation",
  status: "sent"
});

// Estatísticas de email
const stats = await ctx.runQuery(api.domains.email.queries.getEmailStats, {
  period: "month"
});
```

### Métricas Importantes

- 📈 Taxa de sucesso de envio
- 📊 Volume de emails por tipo
- ⚡ Tempo médio de entrega
- 🔥 Emails falhados que precisam reenvio

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Emails não estão sendo enviados

**Verifique:**
- ✅ Variáveis de ambiente configuradas
- ✅ Credenciais SMTP corretas
- ✅ Firewall/proxy não bloqueando porta 587
- ✅ Logs de erro no console do Convex

#### 2. Emails indo para spam

**Soluções:**
- 📧 Configure SPF, DKIM e DMARC no DNS
- 🔗 Use domínio próprio para envio
- 📝 Evite palavras que ativam filtros de spam
- ✉️ Mantenha lista de emails limpa

#### 3. Rate limiting

**Quando ocorre:**
- 🚀 Muitos emails enviados rapidamente
- 📊 Limite do provedor SMTP atingido

**Soluções:**
- ⏱️ Implementar delays entre envios
- 📈 Usar serviço SMTP profissional
- 🔄 Implementar fila de retry

### Debugging

#### Logs Detalhados

Ative logs detalhados no desenvolvimento:

```typescript
// No service.ts
console.log("Sending email:", {
  to: emailData.to,
  subject: emailData.subject,
  type: emailData.type
});
```

#### Teste de Conexão SMTP

```typescript
// Teste a conexão SMTP
const service = getEmailService();
const isConnected = await service.testConnection();
console.log("SMTP Connection:", isConnected);
```

## 🔐 Segurança

### Boas Práticas

1. **🔒 Nunca commits credenciais**
   - Use variáveis de ambiente
   - Adicione `.env*` no `.gitignore`

2. **🛡️ Validação de entrada**
   - Sempre validar emails antes de enviar
   - Sanitizar dados dos templates

3. **📊 Rate limiting**
   - Implementar limites por usuário
   - Monitorar volumes anômalos

4. **🔍 Logs auditoria**
   - Registrar todas as tentativas
   - Alertas para falhas repetidas

## 📚 Recursos Adicionais

- [Documentação Nodemailer](https://nodemailer.com/)
- [Ethereal Email (testes)](https://ethereal.email/)
- [Gmail App Passwords](https://support.google.com/mail/answer/185833)
- [SPF/DKIM Configuration](https://support.google.com/a/answer/33786)

---

## 🤝 Contribuindo

Para adicionar novos tipos de email ou melhorar templates:

1. 🔧 Crie uma branch feature
2. 📝 Implemente seguindo a estrutura existente
3. 🧪 Teste thoroughly
4. 📋 Atualize esta documentação
5. 🚀 Submeta PR com descrição detalhada

---

**💡 Dica:** Em desenvolvimento, todos os emails são interceptados pelo Ethereal. Verifique o console para links de preview dos emails enviados! 