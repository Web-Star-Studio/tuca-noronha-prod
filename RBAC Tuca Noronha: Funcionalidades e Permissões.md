# Sistema RBAC - Tuca Noronha: Funcionalidades e Permissões

## 1. Visão Geral do Sistema

A plataforma Tuca Noronha implementa um sistema robusto de Controle de Acesso Baseado em Papéis (RBAC) utilizando Next.js 15, React 19, Convex e Clerk. O sistema garante que usuários tenham acesso apenas às funcionalidades e dados apropriados para seus papéis e responsabilidades.

### Stack Tecnológica
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Convex (queries, mutations, actions)
- **Autenticação**: Clerk (com metadados customizados)
- **Autorização**: Validação em todas as funções Convex
- **UI**: TailwindCSS + Shadcn/ui

## 2. Papéis de Usuário (Roles)

### 2.1 Traveler (Viajante)
**Usuário final que consome serviços da plataforma**

**Funcionalidades Principais:**
- Busca e descoberta de serviços (atividades, eventos, restaurantes, veículos)
- Sistema de reservas unificado
- Gestão de perfil e preferências pessoais
- Lista de desejos (wishlist)
- Dashboard pessoal com histórico
- Sistema de avaliações

### 2.2 Partner (Parceiro)
**Proprietário de ativos que oferece serviços na plataforma**

**Funcionalidades Principais:**
- Gestão completa de ativos próprios (CRUD)
- Dashboard analítico com métricas
- Gestão de equipe (employees) com permissões granulares
- Controle de preços e disponibilidade
- Gestão de reservas recebidas
- Upload e gestão de mídia

### 2.3 Employee (Funcionário)
**Colaborador de um parceiro com acesso limitado a ativos específicos**

**Funcionalidades Principais:**
- Acesso apenas aos ativos designados pelo partner
- Gestão operacional conforme permissões
- Atualização de disponibilidade e preços (se autorizado)
- Gestão de reservas dos ativos designados

### 2.4 Master (Administrador)
**Administrador da plataforma com acesso total**

**Funcionalidades Principais:**
- Gestão completa da plataforma
- Moderação de conteúdo
- Analytics globais
- Gestão de usuários e parceiros
- Configurações do sistema

## 3. Implementação Técnica Atual

### 3.1 Estrutura de Autenticação (Clerk)

```typescript
// Metadados do usuário no Clerk
interface ClerkMetadata {
  publicMetadata: {
    role: 'traveler' | 'partner' | 'employee' | 'master';
    partnerId?: string; // Para employees
    organizationId?: string; // Para employees
  }
}
```

### 3.2 Schema de Dados (Convex)

#### Tabela Users
```typescript
users: {
  clerkId: string,
  email: string,
  name: string,
  role: 'traveler' | 'partner' | 'employee' | 'master',
  partnerId?: Id<"users">, // Para employees
  // ... outros campos
}
```

#### Tabela Asset Permissions
```typescript
assetPermissions: {
  userId: Id<"users">,
  partnerId: Id<"users">,
  assetType: 'activities' | 'events' | 'restaurants' | 'vehicles',
  assetId: Id<any>,
  permissions: {
    canView: boolean,
    canEdit: boolean,
    canDelete: boolean,
    canManageBookings: boolean,
    canManagePricing: boolean,
    canManageAvailability: boolean,
  }
}
```

### 3.3 Sistema de Validação (Convex Functions)

Todas as funções Convex implementam verificação de autorização:

```typescript
// Exemplo de função com RBAC
export const getActivities = query({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Não autenticado");
    
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) throw new Error("Usuário não encontrado");
    
    // Lógica específica por role
    switch (user.role) {
      case 'partner':
        // Retorna apenas atividades do partner
        return getPartnerActivities(ctx, user._id);
      case 'employee':
        // Retorna apenas atividades com permissão
        return getEmployeeActivities(ctx, user._id);
      case 'master':
        // Retorna todas as atividades
        return getAllActivities(ctx);
      default:
        // Travelers veem apenas atividades ativas
        return getPublicActivities(ctx);
    }
  }
});
```

## 4. Domínios de Negócio Implementados

### 4.1 Activities (Atividades)
**Localização**: `/convex/domains/activities/`

**Funcionalidades por Role:**
- **Travelers**: Visualização, busca, filtros, reservas
- **Partners**: CRUD completo dos próprios ativos, gestão de reservas
- **Employees**: Operações conforme permissões designadas
- **Masters**: Acesso completo, moderação

**Schemas Principais:**
- `activities`: Dados das atividades
- `activityBookings`: Reservas de atividades

### 4.2 Events (Eventos)
**Localização**: `/convex/domains/events/`

**Funcionalidades Especiais:**
- Integração com Sympla para sincronização
- Gestão de ingressos e capacidade
- Sistema de reservas por quantidade

**Schemas Principais:**
- `events`: Dados dos eventos
- `eventBookings`: Reservas de ingressos

### 4.3 Restaurants (Restaurantes)
**Localização**: `/convex/domains/restaurants/`

**Funcionalidades Especiais:**
- Perfis detalhados com cardápios
- Horários de funcionamento
- Sistema de reservas de mesa

**Schemas Principais:**
- `restaurants`: Dados dos restaurantes
- `restaurantReservations`: Reservas de mesa

### 4.4 Vehicles (Veículos)
**Localização**: `/convex/domains/vehicles/`

**Funcionalidades Especiais:**
- Catálogo com especificações técnicas
- Reservas por período (data início/fim)
- Gestão de localização de retirada/devolução

**Schemas Principais:**
- `vehicles`: Dados dos veículos
- `vehicleBookings`: Reservas de veículos

### 4.5 Bookings (Sistema de Reservas)
**Localização**: `/convex/domains/bookings/`

**Sistema Unificado de Reservas:**
- Códigos de confirmação únicos
- Estados padronizados (pending, confirmed, canceled, completed)
- Validação de disponibilidade
- Dashboard unificado para gestão

**Queries Principais:**
- `getUserActivityBookings`: Reservas de atividades do usuário
- `getUserEventBookings`: Reservas de eventos do usuário
- `getUserRestaurantReservations`: Reservas de restaurantes
- `getUserVehicleBookings`: Reservas de veículos
- `getPartnerBookings`: Todas as reservas dos ativos do partner
- `getActivityBookings`: Admin - todas as reservas de atividades

### 4.6 Media (Gestão de Mídia)
**Localização**: `/convex/domains/media/`

**Funcionalidades:**
- Upload de imagens para ativos
- Organização por categorias
- Controle de acesso por proprietário

### 4.7 RBAC (Controle de Acesso)
**Localização**: `/convex/domains/rbac/`

**Funcionalidades:**
- Gestão de permissões por asset
- Validação de acesso em tempo real
- Auditoria de permissões

## 5. Sistema de Permissões Granulares

### 5.1 Permissões por Asset (Employee)

Os Partners podem conceder permissões específicas aos seus Employees para cada asset:

```typescript
interface AssetPermissions {
  canView: boolean;           // Visualizar informações do asset
  canEdit: boolean;           // Editar dados básicos
  canDelete: boolean;         // Deletar asset
  canManageBookings: boolean; // Gerenciar reservas
  canManagePricing: boolean;  // Alterar preços
  canManageAvailability: boolean; // Alterar disponibilidade
}
```

### 5.2 Fluxo de Validação

1. **Autenticação**: Verificação via Clerk
2. **Identificação**: Busca do usuário no Convex via `clerkId`
3. **Autorização por Role**: Verificação do papel base
4. **Autorização Granular**: Para employees, verificação de permissões específicas por asset
5. **Execução**: Operação autorizada é executada

## 6. Rotas e Proteção (Frontend)

### 6.1 Middleware de Autenticação
**Arquivo**: `/src/middleware.ts`

Protege rotas baseado na autenticação Clerk e redireciona conforme necessário.

### 6.2 Rotas Protegidas
**Estrutura**: `/src/app/(protected)/`

- `/admin/dashboard/`: Apenas Masters
- `/meu-painel/`: Usuários autenticados
- `/reservas/`: Gestão de reservas do usuário

### 6.3 Componentes Condicionais

Renderização baseada em role usando hooks do Clerk:

```typescript
import { useUser } from "@clerk/nextjs";

function AdminPanel() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role;
  
  if (userRole !== 'master') {
    return <AccessDenied />;
  }
  
  return <AdminDashboard />;
}
```

## 7. Dashboard e Analytics

### 7.1 Dashboard por Role

#### Traveler Dashboard
- Histórico de reservas
- Lista de desejos
- Preferências pessoais
- Status de reservas

#### Partner Dashboard
- Métricas de negócio
- Gestão de ativos
- Reservas recebidas
- Gestão de equipe

#### Employee Dashboard
- Assets designados
- Reservas dos assets permitidos
- Tarefas operacionais

#### Master Dashboard
- Analytics globais
- Gestão de usuários
- Moderação de conteúdo
- Configurações da plataforma

### 7.2 Métricas e Relatórios

- **Reservas**: Por período, status, tipo de serviço
- **Revenue**: Por partner, por serviço
- **Ocupação**: Taxa de ocupação por asset
- **Performance**: Métricas de conversão

## 8. Segurança e Boas Práticas

### 8.1 Validação de Dados
- Schemas rigorosos em todas as funções Convex
- Sanitização de inputs
- Validação de tipos TypeScript

### 8.2 Proteção de Dados
- Princípio do menor privilégio
- Segregação de dados por proprietário
- Logs de auditoria para ações sensíveis

### 8.3 Performance
- Índices otimizados no Convex
- Paginação em listagens
- Cache inteligente no frontend

## 9. Fluxos de Trabalho Típicos

### 9.1 Partner Gerenciando Employee

1. Partner acessa "Gestão de Equipe"
2. Convida novo Employee via email
3. Employee cria conta e é associado à organização
4. Partner define permissões por asset
5. Employee acessa apenas funcionalidades permitidas

### 9.2 Traveler Fazendo Reserva

1. Traveler busca serviços
2. Seleciona atividade/evento/restaurante/veículo
3. Preenche dados da reserva
4. Sistema valida disponibilidade
5. Reserva é criada com código de confirmação
6. Partner/Employee recebe notificação

### 9.3 Admin Moderando Conteúdo

1. Master acessa dashboard administrativo
2. Visualiza conteúdo reportado
3. Analisa violações de política
4. Toma ação (aprovação/rejeição/suspensão)
5. Notifica usuários envolvidos

## 10. Evolução e Roadmap

### 10.1 Funcionalidades Implementadas ✅
- Sistema RBAC completo
- Dashboard por role
- Sistema de reservas unificado
- Gestão de mídia
- Integração Sympla (eventos)

### 10.2 Próximas Funcionalidades 🚧
- Sistema de avaliações
- Notificações em tempo real
- Chat entre usuários
- Sistema de pagamentos
- Analytics avançados

### 10.3 Melhorias Futuras 🔮
- Machine Learning para recomendações
- Integração com mais plataformas externas
- App mobile
- Sistema de gamificação

---

Este documento serve como referência completa para entender o funcionamento do sistema RBAC da plataforma Tuca Noronha, incluindo implementação técnica, estrutura de dados e fluxos de trabalho.