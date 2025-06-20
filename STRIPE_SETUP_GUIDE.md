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