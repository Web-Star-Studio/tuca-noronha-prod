# Plano de Implementação do Stripe

Este documento descreve o plano de implementação do Stripe para processamento de pagamentos de reservas (atividades, eventos e veículos) na plataforma **Tuca Noronha**.

## 1. Visão Geral
- Objetivo: integrar o Stripe como provedor de pagamentos (Checkout, Webhooks) para garantir segurança e usabilidade no fluxo de reserva.
- Escopo inicial: bookings de atividades, eventos e veículos. Reservas de restaurantes poderão ser incluídas em fases posteriores.

## 2. Pré-requisitos
- Conta Stripe ativada e acesso ao Dashboard
- Chaves de API:
  - STRIPE_SECRET_KEY (servidor)
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (cliente)
  - STRIPE_WEBHOOK_SECRET (webhook)
- Variáveis de ambiente configuradas em `.env.local` e documentadas em `ENV_EXAMPLE.md`.

## 3. Configuração de Ambiente
1. Adicionar no `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXX
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXX
   ```
2. Atualizar `ENV_EXAMPLE.md` com as variáveis acima.

## 4. Dependências
- Instalar o SDK do Stripe no backend (Convex):
  ```bash
  npm install stripe
  ```
- Instalar Stripe.js no frontend:
  ```bash
  npm install @stripe/stripe-js
  ```

## 5. Modelo de Dados (Convex)
1. **Estender** `convex/schema.ts`:
   - Adicionar, em cada tabela de reservas (`activityBookings`, `eventBookings`, `vehicleBookings`):
     - `stripeSessionId?: string`
     - `stripePaymentIntentId?: string`
     - `currency?: string` (e.g. 'brl')
2. Executar `npx convex deploy` para aplicar o novo schema.

## 6. Backend (Convex HTTP Actions)
### 6.1 Criar Checkout Session
- Em `convex/http.ts`, adicionar rota `POST /stripe/create-session`:
  1. Recebe JSON com `{ bookingId: ID, bookingType: 'activity'|'event'|'vehicle' }`.
  2. Busca booking no banco; valida `status === 'pending'`.
  3. Inicializa `Stripe(process.env.STRIPE_SECRET_KEY)` e cria `checkout.sessions.create({ ... })` com:
     - `line_items` usando `unit_amount: totalPrice * 100`, `currency` definido.
     - `mode: 'payment'`, `success_url`, `cancel_url` (configuráveis por env).
     - `metadata`: `{ bookingId, bookingType, userId }`.
  4. Retorna `{ sessionId, url }` para o frontend.

### 6.2 Webhook de Eventos
- Em `convex/http.ts`, rota `POST /stripe/webhook`:
  1. Captura `rawBody` e header `stripe-signature`.
  2. Valida com `stripe.webhooks.constructEvent(...)` usando `STRIPE_WEBHOOK_SECRET`.
  3. Switch por `event.type`:
     - `checkout.session.completed`:
       - Extrair `session.metadata` (bookingId, bookingType).
       - `ctx.runMutation` para atualizar booking:
         - `paymentStatus: 'paid'`, `paymentMethod: 'credit_card'`, `status: 'confirmed'`, `stripeSessionId`, `stripePaymentIntentId`.
       - Agendar notificação via `internal.domains.notifications.actions.sendPaymentConfirmation`.
     - `charge.refunded` (opcional): atualizar `paymentStatus: 'refunded'`, `status: 'refunded'`.
  4. Retornar HTTP 200.

## 7. Frontend (Next.js)
### 7.1 Integração no Fluxo de Reserva
- Após chamada de `createXXXBooking` retornar `{ bookingId, totalPrice }`, chamar endpoint `/stripe/create-session`:
  ```ts
  const res = await fetch('/api/stripe/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, bookingType }),
  });
  const { sessionId } = await res.json();
  ```
  Em seguida usar:
  ```ts
  import { loadStripe } from '@stripe/stripe-js';
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  await stripe.redirectToCheckout({ sessionId });
  ```

### 7.2 Página de Checkout (opcional)
- Criar rota dinâmica em `src/app/checkout/[bookingType]/[bookingId]/page.tsx` para exibir resumo e botão de pagamento.

## 8. Testes
- Configurar Stripe CLI para simular webhooks:
  ```bash
  stripe listen --forward-to localhost:8787/stripe/webhook
  stripe trigger checkout.session.completed
  ```
- Testar fluxos de sucesso, falha e reembolso.

## 9. Deploy
- Adicionar variáveis de ambiente no provedor (Vercel ou similar).
- Registrar webhook endpoint em `https://seu-dominio/stripe/webhook` no Dashboard Stripe.

## 10. Cronograma Estimado (5 dias)
| Dia | Atividades |
| --- | ---------- |
| 1   | Setup Stripe, variáveis e dependências |
| 2   | Modelagem de dados e rotas HTTP |
| 3   | Lógica de criação de sessions e webhooks |
| 4   | Integração frontend e redirecionamento |
| 5   | Testes ponta a ponta e documentação |