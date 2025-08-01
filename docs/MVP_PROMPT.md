# Prompt para MVP - Plataforma de Turismo

**Contexto**: Crie um MVP de uma plataforma de turismo B2B2C usando Next.js 15, Convex, Clerk e Stripe.

## Stack Técnica Obrigatória
- **Frontend**: Next.js 15 + App Router + React 19 + TypeScript
- **Backend**: Convex (database + serverless functions)
- **Auth**: Clerk com RBAC (Traveler, Partner, Employee, Master)
- **Pagamentos**: Stripe com manual capture
- **UI**: TailwindCSS + Shadcn/ui
- **Deploy**: Vercel + Convex Cloud

## Estrutura do Projeto
```
src/
├── app/
│   ├── (protected)/
│   │   ├── admin/dashboard/    # Admin dashboards
│   │   └── meu-painel/        # User dashboard
│   ├── atividades/            # Public activity browsing
│   └── reservas/              # Booking flow
├── components/
│   ├── cards/                 # Asset display cards
│   ├── dashboard/             # Dashboard components
│   └── ui/                    # Shadcn components
└── lib/                       # Hooks and utilities

convex/
├── domains/
│   ├── users/                 # User management
│   ├── rbac/                  # Role-based access
│   ├── activities/            # Activity booking
│   ├── bookings/              # Unified booking
│   └── stripe/                # Payment processing
└── schema.ts                  # Database schema
```

## Funcionalidades Core do MVP

### 1. Sistema de Autenticação (Clerk + RBAC)
- 4 roles: Traveler, Partner, Employee, Master
- Partners criam employees com permissões específicas
- Middleware de proteção de rotas
- Organizações para partners

### 2. Gestão de Atividades
- CRUD de atividades (apenas partners/employees)
- Upload de imagens via Convex Storage
- Preços e disponibilidade
- Status ativo/inativo

### 3. Sistema de Reservas
- Flow de booking para travelers
- Checkout com Stripe (manual capture)
- Status: pending → requires_capture → confirmed
- Códigos de confirmação únicos

### 4. Dashboards
- **Partner/Employee**: Gerenciar atividades e reservas
- **Traveler**: Visualizar reservas pessoais
- **Master**: Visão geral da plataforma

### 5. Pagamentos (Stripe)
- Produtos/preços criados automaticamente
- Manual capture workflow
- Webhooks para status updates
- Gestão de reembolsos

## Schema Mínimo (Convex)
```typescript
// Principais tabelas
users: { role, clerkId, partnerId?, organizationId? }
activities: { partnerId, title, price, stripeProductId, isActive }
bookings: { userId, activityId, status, paymentIntentId, confirmationCode }
assetPermissions: { employeeId, assetId, permissions[] }
```

## Fluxos Principais

### 1. Onboarding de Partner
1. Registro via Clerk
2. Criação de organização
3. Setup inicial de atividades
4. Configuração Stripe

### 2. Booking Flow
1. Traveler navega atividades públicas
2. Seleciona atividade e preenche dados
3. Checkout Stripe (authorize only)
4. Partner aprova/rejeita
5. Payment capture ou cancel

### 3. Gestão de Funcionários
1. Partner cria employee
2. Atribui permissões específicas
3. Employee acessa apenas assets permitidos

## Integrações Essenciais
- **Stripe**: Products, Checkout, Webhooks, Manual Capture
- **Clerk**: Auth, Organizations, Metadata
- **Convex**: Real-time queries, File storage
- **Email**: Confirmações via Resend (opcional no MVP)

## Comandos de Desenvolvimento
```bash
bun run dev              # Next.js + Turbo
bunx convex dev          # Backend
bun run build           # Production build
bun run lint            # ESLint
bunx tsc --noEmit       # Type checking
```

## Critérios de Sucesso MVP
1. ✅ Partner pode criar e gerenciar atividades
2. ✅ Traveler pode fazer reservas com pagamento
3. ✅ Sistema RBAC funcionando (4 roles)
4. ✅ Fluxo de aprovação manual de pagamentos
5. ✅ Dashboards básicos para todos os roles
6. ✅ Webhooks Stripe processando corretamente

## Próximos Passos Pós-MVP
- Sistema de cupons
- Múltiplos tipos de assets (eventos, restaurantes)
- Chat em tempo real
- Sistema de reviews
- Analytics avançadas

**Importante**: Foque na simplicidade e na experiência core. O MVP deve permitir que um partner liste atividades e receba reservas pagas, com gestão completa do fluxo.