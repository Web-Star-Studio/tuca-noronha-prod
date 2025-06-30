# Guia de Configuração do Stripe

## Problema Resolvido
Este guia resolve o erro:
```
TypeError: Cannot read properties of undefined (reading 'match')
    at initStripe
```

## Causa do Erro
O erro ocorria porque a variável de ambiente `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` não estava definida, fazendo com que o Stripe tentasse inicializar com `undefined`.

## Correções Implementadas

### 1. StripeProvider com Validação Segura
Atualizado `src/lib/providers/StripeProvider.tsx` para:
- ✅ Validar se a chave pública do Stripe está definida
- ✅ Mostrar warning no console se não estiver configurada
- ✅ Retornar children sem provider se chave não disponível
- ✅ Evitar o erro de inicialização

### 2. BookingPaymentForm com Fallback
Atualizado `src/components/payments/BookingPaymentForm.tsx` para:
- ✅ Detectar quando Stripe não está configurado
- ✅ Mostrar mensagem amigável para o usuário
- ✅ Evitar tentativas de pagamento quando não configurado

## Como Configurar o Stripe (Opcional)

### Passo 1: Criar Conta no Stripe
1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta ou faça login
3. Ative o modo de teste

### Passo 2: Obter as Chaves
1. No dashboard do Stripe, vá em **Developers > API Keys**
2. Copie as chaves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### Passo 3: Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret_aqui

# Outras variáveis necessárias
NEXT_PUBLIC_CONVEX_URL=https://sua-url-convex.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_clerk_aqui
CLERK_SECRET_KEY=sk_test_sua_chave_clerk_secreta_aqui
```

### Passo 4: Reiniciar o Servidor
```bash
npm run dev
# ou
yarn dev
# ou
bun dev
```

## Funcionalidade sem Stripe
O sistema agora funciona perfeitamente **SEM** configurar o Stripe:

- ✅ Páginas de eventos carregam normalmente
- ✅ Formulários de reserva funcionam
- ✅ Botões de pagamento mostram mensagem informativa
- ✅ Usuários podem navegar sem erros

## Arquivos Modificados

1. **`src/lib/providers/StripeProvider.tsx`**
   - Validação de chave pública
   - Fallback seguro quando não configurado

2. **`src/components/payments/BookingPaymentForm.tsx`**
   - Interface amigável quando Stripe indisponível
   - Prevenção de erros de pagamento

## Benefícios das Correções

- 🚫 **Sem mais erros** de inicialização do Stripe
- 🎯 **Desenvolvimento contínuo** sem necessidade de configurar Stripe
- 🔧 **Configuração opcional** - adicione quando precisar
- 📱 **UX melhorada** - usuários veem mensagens claras
- 🛡️ **Código robusto** - tratamento de erros adequado

## Para Produção

Quando for para produção:
1. Configure as chaves do Stripe de produção
2. Configure webhooks para eventos de pagamento
3. Teste fluxos de pagamento completos
4. Configure domínios permitidos no Stripe

## Troubleshooting

### Problema: Still getting Stripe errors
**Solução**: Certifique-se de reiniciar o servidor após adicionar variáveis de ambiente

### Problema: Payment forms not showing
**Solução**: Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está correta e reinicie

### Problema: Webhooks not working
**Solução**: Configure `STRIPE_WEBHOOK_SECRET` e endpoint `/api/stripe/webhook` 

# Guia de Configuração do Stripe para Pagamentos

## Problemas Resolvidos

Este guia resolve os seguintes problemas:
1. **Loading infinito na página de sucesso** - Substituímos Payment Links por Checkout Sessions
2. **Pagamento não confirmado imediatamente** - Implementamos webhooks para processar eventos em tempo real
3. **Melhor experiência do usuário** - Página de sucesso com polling e tratamento de erros

## Configuração do Stripe Dashboard

### 1. Configurar Webhook Endpoint

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá para **Developers > Webhooks**
3. Clique em **Add endpoint**
4. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/stripe-webhook`
   - **Description**: "Webhook para processar eventos de pagamento"
   - **Events to send**: Selecione os seguintes eventos:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`

5. Após criar, copie o **Signing secret** e adicione ao seu `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 2. Variáveis de Ambiente Necessárias

Adicione ao seu `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (para redirect após pagamento)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Testar Localmente com Stripe CLI

Para testar webhooks localmente:

1. Instale o [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Faça login:
   ```bash
   stripe login
   ```
3. Encaminhe eventos para localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
4. O CLI mostrará um webhook secret temporário - use ele no `.env.local`

## Fluxo de Pagamento Implementado

### 1. Criação da Reserva
- Usuário preenche formulário de reserva
- Sistema cria a reserva no banco com status `pending`

### 2. Checkout Session
- Sistema cria Checkout Session no Stripe com metadata da reserva
- Usuário é redirecionado para página de pagamento do Stripe

### 3. Processamento do Pagamento
- Stripe processa o pagamento
- Após sucesso, redireciona para `/booking/success?session_id={CHECKOUT_SESSION_ID}`

### 4. Webhook Processing
- Stripe envia evento `checkout.session.completed` para nosso webhook
- Webhook atualiza status da reserva para `confirmed` e pagamento para `succeeded`
- Envia notificação de confirmação ao usuário

### 5. Página de Sucesso
- Página usa polling para verificar status da reserva
- Mostra loading enquanto aguarda processamento
- Exibe detalhes da reserva quando confirmada

## Mudanças Implementadas

### 1. ActivityBookingForm.tsx
- Mudou de `createPaymentLinkForBooking` para `createCheckoutSession`
- Remove parâmetros desnecessários (assetId, totalAmount, currency)
- Usa sessionUrl em vez de paymentLinkUrl

### 2. Webhook Handler (/api/stripe-webhook)
- Verifica assinatura do Stripe
- Processa eventos de checkout e payment intent
- Atualiza status da reserva em tempo real
- Envia notificações após confirmação

### 3. Página de Sucesso
- Implementa polling para verificar status
- Aceita tanto session_id quanto booking_id
- Mostra loading com contador de tentativas
- Tratamento de timeout com opções alternativas

## Testando o Fluxo

1. **Criar uma reserva de teste**:
   - Acesse uma atividade
   - Preencha o formulário
   - Use cartão de teste: `4242 4242 4242 4242`

2. **Verificar webhook**:
   - Veja os logs no terminal onde está rodando `stripe listen`
   - Verifique console do navegador na página de sucesso

3. **Verificar banco de dados**:
   - A reserva deve ter `paymentStatus: "succeeded"`
   - Deve ter `stripeCheckoutSessionId` preenchido

## Troubleshooting

### Loading Infinito
1. Verifique se o webhook está configurado corretamente
2. Confirme que o webhook secret está correto no `.env.local`
3. Verifique logs do webhook no Stripe Dashboard

### Pagamento não Confirmado
1. Verifique se os eventos estão sendo enviados (Stripe Dashboard > Webhooks > Logs)
2. Confirme que o mutation `updateBookingPaymentSuccess` está funcionando
3. Verifique se a metadata está sendo passada corretamente no Checkout Session

### Erro 400/500 no Webhook
1. Verifique assinatura: webhook secret deve corresponder
2. Confirme que todas as mutations internas existem
3. Verifique logs do servidor para erros detalhados

## Próximos Passos

1. **Implementar para outros tipos de reserva**:
   - Eventos
   - Restaurantes
   - Hospedagens
   - Veículos

2. **Adicionar funcionalidades**:
   - Reembolsos
   - Cancelamentos
   - Recibos por email
   - Histórico de pagamentos

3. **Melhorias de UX**:
   - Progress bar na página de sucesso
   - Animações de loading
   - Mensagens de erro mais detalhadas 