# Plano de Refatoração e Melhorias

Este documento descreve melhorias sugeridas para o projeto, com foco em reduzir a base de código e garantir qualidade de produção. Cada item inclui o **local**, um resumo de **como implementar** e o **porquê** da melhoria.

## 1. Migração de Pagamentos do Stripe para Mercado Pago (Alta Prioridade)
- **Local**: `src/lib/stripe.ts`, `src/lib/providers/StripeProvider.tsx`, `src/components/payments/*`, `convex/domains/stripe/*` e scripts relacionados em `scripts/`.
- **Como implementar**:
  1. Instalar SDK oficial do Mercado Pago (`mercadopago`).
  2. Criar wrapper `src/lib/mercadoPago.ts` para configurar o cliente usando variáveis `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`.
  3. Substituir o provedor `StripeProvider` por componente equivalente que inicialize o checkout do Mercado Pago.
  4. Refatorar o domínio `convex/domains/stripe` para um domínio genérico `payments`, implementando rotinas de criação de pagamento, captura e webhooks usando a API do Mercado Pago.
  5. Atualizar componentes de UI e páginas que dependem de Stripe (`src/components/payments/*` e páginas de onboarding) para utilizar os endpoints do novo domínio.
  6. Ajustar testes e scripts de backfill para refletir o novo fluxo de pagamentos.
- **Por quê**: melhora aderência ao mercado local e reduz custos transacionais, além de simplificar requisitos de onboarding para parceiros brasileiros.

## 2. Domínio de Pagamentos Genérico
- **Local**: `convex/domains/stripe/*` e `src/components/payments/`.
- **Como implementar**:
  1. Extrair interfaces comuns de pagamento (`PaymentProvider`, `PaymentIntent`, `WebhookEvent`).
  2. Implementar adaptadores específicos (Mercado Pago inicialmente, outros no futuro) seguindo as interfaces.
  3. Centralizar constantes e tipos em `src/lib/constants/payments.ts`.
- **Por quê**: facilita troca de provedores e reduz acoplamento da aplicação com uma solução específica.

## 3. Validação Estrita de Variáveis de Ambiente
- **Local**: `src/lib/utils.ts` ou novo módulo `src/lib/env.ts`.
- **Como implementar**:
  1. Usar `zod` para declarar e validar o esquema de variáveis de ambiente em tempo de execução.
  2. Exportar valores tipados, evitando checagens manuais espalhadas pelo código.
- **Por quê**: previne falhas em produção devido a configuração incorreta e melhora a DX ao centralizar a configuração.

## 4. Testes Automatizados para Fluxos Críticos
- **Local**: `tests/`.
- **Como implementar**:
  1. Adicionar testes de integração para reservas, criação de pagamentos e emissão de vouchers.
  2. Configurar pipeline de CI para executar `npm run lint` e os novos testes em cada PR.
- **Por quê**: garante estabilidade ao refatorar e reduz regressões em funcionalidades essenciais.

## 5. Limpeza de Código e Documentação
- **Local**: pastas `docs/` e scripts obsoletos em `scripts/`.
- **Como implementar**:
  1. Remover documentos e scripts históricos que não representam mais o estado atual do projeto.
  2. Agrupar guias relevantes em um único diretório `docs/legacy` para referência futura.
- **Por quê**: diminui ruído no repositório e facilita navegação para novos contribuidores.

## 6. Observabilidade e Tratamento de Erros
- **Local**: `src/lib/sentry.ts`, `convex/**`.
- **Como implementar**:
  1. Garantir captura de erros em todos os `mutation` e `action` de Convex usando `try/catch` e envio para Sentry.
  2. Adicionar logs estruturados para operações financeiras e reservas.
- **Por quê**: aumenta visibilidade sobre falhas em produção e acelera a resolução de incidentes.

## 7. Componentização e Reuso de UI
- **Local**: `src/components/`.
- **Como implementar**:
  1. Consolidar componentes duplicados de formulários de reserva em um conjunto de componentes base (`BookingForm`, `PaymentSummary`).
  2. Adotar convenções de pastas por domínio para facilitar descoberta (`components/bookings`, `components/payments`).
- **Por quê**: reduz código duplicado e torna a manutenção de UI mais previsível.

---

Estas melhorias podem ser implementadas incrementalmente, garantindo que cada etapa esteja coberta por testes e monitoramento adequado antes de avançar para a próxima.