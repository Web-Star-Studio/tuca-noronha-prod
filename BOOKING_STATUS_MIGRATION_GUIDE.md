# Guia de Migração de Status de Reservas

## Problema Resolvido

As reservas não estavam aparecendo nas listagens porque o sistema estava usando um novo modelo de status, mas as queries e componentes ainda esperavam os status antigos.

## Status Antigos vs Novos

### Status Antigos
- `pending` - Pendente
- `confirmed` - Confirmada
- `cancelled` - Cancelada

### Novos Status (BOOKING_STATUS)
- `draft` - Rascunho (reserva criada mas pagamento não iniciado)
- `payment_pending` - Aguardando conclusão do pagamento
- `awaiting_confirmation` - Pagamento concluído, aguardando confirmação do partner
- `confirmed` - Confirmada pelo partner
- `in_progress` - Em andamento (para atividades/eventos)
- `completed` - Concluída com sucesso
- `canceled` - Cancelada
- `no_show` - Cliente não compareceu
- `expired` - Expirada (pagamento não concluído no prazo)

### Status de Pagamento (PAYMENT_STATUS)
- `not_required` - Pagamento não necessário
- `pending` - Aguardando início do pagamento
- `processing` - Pagamento sendo processado
- `awaiting_payment_method` - Aguardando método de pagamento
- `paid` - Pago com sucesso
- `partially_paid` - Parcialmente pago
- `failed` - Falha no pagamento
- `refunded` - Reembolsado
- `partially_refunded` - Parcialmente reembolsado
- `canceled` - Pagamento cancelado

## Fluxo de Status

### 1. Criação da Reserva
- Reserva criada com status `draft`
- Payment status: `pending`

### 2. Pagamento Iniciado
- Status muda para `payment_pending`
- Payment status: `processing`

### 3. Pagamento Concluído
- Status muda para `awaiting_confirmation`
- Payment status: `paid`
- Webhook do Stripe atualiza esses status automaticamente

### 4. Confirmação do Partner
- Partner confirma a reserva
- Status muda para `confirmed`

### 5. Execução do Serviço
- No dia/hora do serviço, status muda para `in_progress`

### 6. Conclusão
- Após o serviço, status muda para `completed`

## Arquivos Atualizados

### 1. Utils de Status (`src/app/(protected)/meu-painel/utils/reservations.ts`)
- Adicionado suporte para todos os novos status
- Mantida compatibilidade com status antigos
- Mapeamento correto de cores e labels

### 2. Queries de Bookings (`convex/domains/bookings/queries.ts`)
- `getUserStats` atualizada para incluir novos status ativos
- Considera `awaiting_confirmation` e `payment_pending` como reservas ativas

### 3. Componente de Reservas (`src/app/(protected)/meu-painel/components/ReservationsSection.tsx`)
- Filtros atualizados para contar corretamente os novos status
- "Confirmadas" agora inclui: `confirmed`, `in_progress`, `completed`
- "Pendentes" agora inclui: `pending`, `payment_pending`, `awaiting_confirmation`, `draft`

### 4. Página de Sucesso (`src/app/booking/success/page.tsx`)
- Removido botão "Ver Minhas Reservas" conforme solicitado
- Mantido apenas botão "Voltar ao Início"

## Mapeamento de Status para Exibição

```typescript
// Para determinar se uma reserva está "ativa"
const isActiveBooking = (status: string) => {
  return [
    'confirmed',
    'pending',
    'awaiting_confirmation',
    'payment_pending',
    'in_progress'
  ].includes(status);
};

// Para determinar se uma reserva foi "finalizada"
const isCompletedBooking = (status: string) => {
  return ['completed'].includes(status);
};

// Para determinar se uma reserva tem "problema"
const isProblematicBooking = (status: string) => {
  return ['canceled', 'cancelled', 'no_show', 'expired'].includes(status);
};
```

## Próximos Passos

1. **Atualizar Dashboard do Partner/Employee**
   - Garantir que as queries de listagem incluam os novos status
   - Adicionar filtros por grupo de status (aguardando pagamento, aguardando confirmação, etc.)

2. **Implementar Ações por Status**
   - `awaiting_confirmation`: Botão para confirmar reserva
   - `confirmed`: Botão para marcar como em andamento
   - `in_progress`: Botão para marcar como concluída

3. **Notificações por Status**
   - Notificar partner quando status muda para `awaiting_confirmation`
   - Notificar traveler quando status muda para `confirmed`

4. **Cron Jobs para Status**
   - Expirar reservas com `payment_pending` após 30 minutos
   - Marcar como `no_show` reservas não marcadas como `in_progress` após o horário 