# Plano Detalhado de Implementação do Mercado Pago

Este documento descreve um passo a passo para substituir o Stripe pelo Mercado Pago no projeto. Cada etapa referencia a documentação oficial do Mercado Pago.

## Referências
- [SDK oficial Node.js](https://www.mercadopago.com.br/developers/en/docs/checkout-api/checkout-api-via-server#nodejs)
- [Checkout Pro JavaScript](https://www.mercadopago.com.br/developers/en/docs/checkout-pro/introduction)
- [Webhooks](https://www.mercadopago.com.br/developers/en/docs/checkout-api/additional-content/webhooks)
- [Autorização e captura em dois passos](https://www.mercadopago.com.br/developers/en/docs/checkout-api/advanced-payments/authorization-and-capture)

## 1. Instalação e Configuração Inicial
- **Local**: `package.json`, `.env`.
- **Como**:
  1. Instalar dependência: `npm install mercadopago`.
  2. Declarar variáveis de ambiente `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY` e `MERCADO_PAGO_WEBHOOK_SECRET`.
  3. Validar as variáveis com `zod` em `src/lib/env.ts`.
- **Por quê**: habilita uso do SDK com credenciais seguras para cada ambiente.

## 2. Wrapper de Cliente
- **Local**: `src/lib/mercadoPago.ts` (novo arquivo).
- **Como**:
  1. Criar instância do `MercadoPagoConfig` usando o `accessToken`.
  2. Exportar funções utilitárias para criar pagamentos, capturar, estornar e registrar webhooks.
- **Por quê**: centraliza configuração do SDK e evita duplicação de código.

## 3. Fluxo de Checkout
- **Local**: `convex/domains/payments/`, `src/components/payments/*`.
- **Como**:
  1. No backend, gerar `Preference` via SDK e retornar `init_point` para o cliente.
  2. Na UI, inicializar `mercadopago.js` com `initMercadoPago(MERCADO_PAGO_PUBLIC_KEY)` e chamar `checkout.open(init_point)`.
  3. Converter formulários existentes para usar os dados da preferência (itens, moeda, callback URLs).
- **Por quê**: habilita criação de cobranças com Checkout Pro mantendo fluxo atual de reserva.

## 4. Autorização e Captura Manual
- **Local**: `convex/domains/payments/`.
- **Como**:
  1. Criar pagamento com `capture: false` para apenas autorizar o valor.
  2. Após confirmação do parceiro, chamar `POST /v1/payments/{id}/capture` para capturar.
  3. Em caso de cancelamento, chamar `POST /v1/payments/{id}/refunds`.
- **Por quê**: reproduz o modelo de aprovação manual utilizado hoje com Stripe.

## 5. Webhooks
- **Local**: `src/app/api/webhooks/mercado-pago/route.ts` (novo), `convex/domains/payments/webhooks.ts`.
- **Como**:
  1. Registrar URL de webhook no painel do Mercado Pago ou na preferência.
  2. Validar assinatura via cabeçalho `x-signature` comparando com `MERCADO_PAGO_WEBHOOK_SECRET`.
  3. Processar eventos `payment.created`, `payment.updated` e `chargebacks` atualizando o status da reserva.
- **Por quê**: garante atualização assíncrona do status de pagamento e reconciliação financeira.

## 6. Substituição de Componentes Stripe
- **Local**: `src/lib/stripe.ts`, `src/lib/providers/StripeProvider.tsx`, `src/components/payments/`.
- **Como**:
  1. Remover dependências de Stripe e adaptar componentes para consumir funções do wrapper Mercado Pago.
  2. Ajustar tipos em `src/lib/constants/payments.ts` para incluir enums de status do Mercado Pago.
  3. Revisar páginas de onboarding que criavam contas Stripe Connect e substituí-las por instruções para preenchimento de dados bancários do Mercado Pago.
- **Por quê**: elimina código morto e reduz complexidade ligada à antiga integração.

## 7. Testes e Sandbox
- **Local**: `tests/payments/*`.
- **Como**:
  1. Utilizar credenciais de sandbox do Mercado Pago para cenários de pagamento, captura e estorno.
  2. Adicionar testes de integração cobrindo o fluxo de reserva com autorização manual.
- **Por quê**: assegura que a migração não introduz regressões e facilita deploy confiável.

---
Com essas etapas, a plataforma terá pagamentos processados via Mercado Pago, aderindo às práticas recomendadas pela documentação oficial e mantendo a experiência de captura manual já existente.r5