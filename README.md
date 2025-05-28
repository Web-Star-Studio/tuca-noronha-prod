# Tuca Noronha - Plataforma de Turismo

Plataforma de turismo construída com Next.js 15, React 19, Convex e Clerk, oferecendo um ecossistema completo para viajantes, parceiros e administradores.

## 🏗️ Arquitetura

### Stack Tecnológica
- **Frontend**: Next.js 15 com App Router + React 19
- **Backend**: Convex (banco de dados + funções serverless)
- **Autenticação**: Clerk
- **Estilização**: TailwindCSS + Shadcn/ui
- **TypeScript**: Strict type checking

### Estrutura do Projeto

```
├── src/
│   ├── app/                     # App Router do Next.js
│   │   ├── (protected)/         # Rotas protegidas por autenticação
│   │   │   ├── admin/           # Dashboard administrativo
│   │   │   ├── dashboard/       # Dashboard do usuário
│   │   │   └── meu-painel/      # Painel pessoal
│   │   ├── atividades/          # Páginas de atividades
│   │   ├── eventos/             # Páginas de eventos
│   │   ├── restaurantes/        # Páginas de restaurantes
│   │   └── veiculos/            # Páginas de veículos
│   ├── components/              # Componentes React reutilizáveis
│   │   ├── bookings/            # Sistema de reservas
│   │   ├── cards/               # Cards de serviços
│   │   ├── dashboard/           # Componentes do dashboard
│   │   ├── filters/             # Filtros de busca
│   │   └── ui/                  # Componentes de UI
│   ├── lib/                     # Utilitários e serviços
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # Serviços de negócio
│   │   └── store/               # Stores (Zustand)
│   └── middleware.ts            # Middleware de autenticação
└── convex/
    ├── domains/                 # Domínios de negócio
    │   ├── activities/          # Gestão de atividades
    │   ├── bookings/            # Sistema de reservas
    │   ├── events/              # Gestão de eventos
    │   ├── media/               # Gestão de mídia
    │   ├── rbac/                # Controle de acesso
    │   ├── restaurants/         # Gestão de restaurantes
    │   ├── users/               # Gestão de usuários
    │   └── vehicles/            # Gestão de veículos
    ├── auth.ts                  # Configuração de autenticação
    ├── schema.ts                # Schema do banco de dados
    └── shared/                  # Utilitários compartilhados
```

## 🚀 Funcionalidades

### Para Viajantes (Travelers)
- 🔍 Busca e descoberta de serviços (atividades, eventos, restaurantes, veículos)
- 📅 Sistema de reservas unificado
- 💖 Lista de desejos
- 📊 Dashboard pessoal com histórico de reservas
- ⭐ Sistema de avaliações
- 🎨 Personalização de preferências

### Para Parceiros (Partners)
- 🏢 Gestão completa de ativos (atividades, eventos, restaurantes, veículos)
- 📈 Dashboard analítico com métricas de negócio
- 👥 Gestão de equipe com permissões granulares
- 💰 Controle de preços e disponibilidade
- 📋 Gestão de reservas recebidas
- 📸 Upload e gestão de mídia

### Para Funcionários (Employees)
- 🎯 Acesso limitado aos ativos designados pelo parceiro
- 📅 Gestão operacional de reservas
- 🔧 Atualizações de disponibilidade conforme permissões

### Para Administradores (Masters)
- 🔧 Gestão completa da plataforma
- 👑 RBAC (Role-Based Access Control)
- 📊 Analytics globais
- 🛠️ Ferramentas de moderação
- 💼 Gestão de parceiros e usuários

## 🎯 Sistema RBAC

### Papéis de Usuário

1. **Traveler** - Consumidor final dos serviços
2. **Partner** - Proprietário de ativos (hotéis, restaurantes, etc.)
3. **Employee** - Funcionário de parceiro com permissões limitadas
4. **Master** - Administrador da plataforma

### Permissões por Domínio

#### Activities (Atividades)
- Partners: CRUD completo dos próprios ativos
- Employees: Operações conforme permissões designadas
- Travelers: Visualização e reserva
- Masters: Acesso completo

#### Events (Eventos)
- Integração com Sympla para sincronização
- Gestão de ingressos e capacidade
- Sistema de reservas específico para eventos

#### Restaurants (Restaurantes)
- Perfis detalhados com cardápios e horários
- Sistema de reservas de mesa
- Gestão de capacidade por horário

#### Vehicles (Veículos)
- Catálogo de veículos para aluguel
- Sistema de reservas por período
- Gestão de disponibilidade e preços

## 🔐 Autenticação e Autorização

### Clerk Integration
- Autenticação via Clerk com metadados customizados
- Organizações para Partners e seus Employees
- Middleware de proteção de rotas

### Convex Security
- Todas as funções verificam autenticação e autorização
- Permissões granulares por asset através de `assetPermissions`
- Validação de dados rigorosa com schemas Convex

## 📦 Sistema de Reservas

### Tipos de Reserva
- **Activity Bookings**: Reservas de atividades com data/hora
- **Event Bookings**: Compra de ingressos para eventos
- **Restaurant Reservations**: Reservas de mesa
- **Vehicle Bookings**: Aluguel de veículos por período

### Características
- Códigos de confirmação únicos
- Estados de reserva (pending, confirmed, canceled, completed)
- Validação de disponibilidade em tempo real
- Histórico completo de reservas
- Dashboard unificado para gestão

## 🏃‍♂️ Getting Started

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Convex
- Conta Clerk

### Instalação

```bash
# Clone o repositório
git clone [repository-url]
cd tn-next-convex

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha as credenciais do Convex e Clerk

# Inicie o Convex
npx convex dev

# Em outro terminal, inicie o Next.js
npm run dev
```

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npx convex dev          # Inicia Convex em modo dev

# Build e Deploy
npm run build           # Build para produção
npm run start          # Inicia servidor de produção

# Qualidade de Código
npm run lint           # ESLint
npx tsc --noEmit      # Type checking
```

## 🌐 Deploy

### Convex
1. Configure o projeto: `npx convex deploy`
2. Configure as variáveis de ambiente no dashboard Convex

### Next.js (Vercel)
1. Conecte o repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático em cada push

## 📝 Desenvolvimento

### Convenções de Código
- TypeScript strict mode
- Componentes funcionais com hooks
- Import absoluto com alias `@/*`
- Tailwind para estilização
- Shadcn/ui para componentes base

### Estrutura de Dados
- Schemas Convex para validação
- Relacionamentos normalizados
- Índices otimizados para queries
- Soft deletes onde apropriado

### Performance
- Server Components por padrão
- Client Components apenas quando necessário
- Lazy loading de componentes
- Optimistic updates no Convex

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para detalhes.