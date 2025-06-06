# Módulo de Pacotes

## Visão Geral

O módulo de pacotes permite que administradores criem pacotes completos de viagem combinando diferentes serviços (hospedagens, veículos, atividades, restaurantes e eventos) em ofertas estruturadas com preços personalizados.

## Características Principais

### 1. **Pacotes Flexíveis**
- Hospedagem opcional
- Veículo opcional  
- Múltiplas atividades incluídas
- Múltiplos restaurantes incluídos
- Múltiplos eventos incluídos
- Duração específica configurável

### 2. **Preços Inteligentes**
- Cálculo automático baseado nos serviços incluídos
- Possibilidade de override manual do preço
- Sistema de descontos
- Transparência de breakdown de preços

### 3. **Gestão de Disponibilidade**
- Datas de disponibilidade configuráveis
- Sistema de blackout dates
- Status ativo/inativo
- Sistema de destaque

### 4. **Reservas de Pacotes**
- Reserva do pacote como um todo
- Gestão centralizada de reservas
- Códigos de confirmação únicos
- Status de pagamento

## Estrutura Técnica

### Backend (Convex)

#### Schema
```typescript
packages: defineTable({
  // Informações básicas
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  description_long: v.string(),
  category: v.string(),
  
  // Configurações
  duration: v.number(),
  maxGuests: v.number(),
  basePrice: v.number(),
  discountPercentage: v.optional(v.number()),
  currency: v.string(),
  
  // Serviços incluídos
  accommodationId: v.optional(v.id("accommodations")),
  vehicleId: v.optional(v.id("vehicles")),
  includedActivityIds: v.array(v.id("activities")),
  includedRestaurantIds: v.array(v.id("restaurants")),
  includedEventIds: v.array(v.id("events")),
  
  // Detalhes
  highlights: v.array(v.string()),
  includes: v.array(v.string()),
  excludes: v.array(v.string()),
  itinerary: v.array(v.object({
    day: v.number(),
    title: v.string(),
    description: v.string(),
    activities: v.array(v.string())
  })),
  
  // Media
  mainImage: v.string(),
  galleryImages: v.array(v.string()),
  
  // Políticas
  cancellationPolicy: v.string(),
  terms: v.array(v.string()),
  
  // Disponibilidade
  availableFromDate: v.string(),
  availableToDate: v.string(),
  blackoutDates: v.array(v.string()),
  
  // Status
  isActive: v.boolean(),
  isFeatured: v.boolean(),
  
  // Metadados
  tags: v.array(v.string()),
  partnerId: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})

packageBookings: defineTable({
  packageId: v.id("packages"),
  userId: v.id("users"),
  startDate: v.string(),
  endDate: v.string(),
  guests: v.number(),
  totalPrice: v.number(),
  
  breakdown: v.object({
    accommodationPrice: v.number(),
    vehiclePrice: v.optional(v.number()),
    activitiesPrice: v.number(),
    restaurantsPrice: v.number(),
    eventsPrice: v.number(),
    discount: v.number(),
  }),
  
  status: v.string(), // "pending", "confirmed", "in_progress", "completed", "canceled", "refunded"
  paymentStatus: v.string(), // "pending", "paid", "refunded"
  
  relatedBookings: v.object({
    activityBookingIds: v.array(v.id("activityBookings")),
    restaurantReservationIds: v.array(v.id("restaurantReservations")),
    eventBookingIds: v.array(v.id("eventBookings")),
  }),
  
  customerInfo: v.object({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  }),
  
  specialRequests: v.optional(v.string()),
  partnerNotes: v.optional(v.string()),
  confirmationCode: v.string(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

#### Queries Principais
- `getPackages` - Lista pacotes com filtros
- `getPackageBySlug` - Busca pacote por slug
- `getPackageBookings` - Lista reservas de pacotes
- `getPackageBookingByCode` - Busca reserva por código

#### Mutations Principais
- `createPackage` - Cria novo pacote
- `updatePackage` - Atualiza pacote existente
- `deletePackage` - Remove pacote (se sem reservas ativas)
- `togglePackageStatus` - Ativa/desativa pacote
- `togglePackageFeatured` - Destaca/remove destaque
- `calculatePackagePricing` - Calcula preços automaticamente
- `duplicatePackage` - Duplica pacote existente
- `createPackageBooking` - Cria reserva de pacote
- `updatePackageBookingStatus` - Atualiza status da reserva

### Frontend

#### Página Admin (`/admin/dashboard/pacotes`)
- Lista todos os pacotes do sistema
- Filtros por status, categoria, etc.
- Busca por nome/descrição
- Estatísticas em tempo real
- Formulário completo de criação/edição
- Ações de gerenciamento (ativar, destacar, duplicar, excluir)

#### Página Pública (`/pacotes`)
- Lista pacotes ativos
- Filtros por categoria, preço, duração
- Ordenação por relevância, preço, etc.
- Cards informativos com preços
- Links para páginas de detalhes

#### Componentes Criados
- `PackageCard` - Card de exibição de pacote
- `PackagesStats` - Estatísticas dos pacotes  
- `PackageForm` - Formulário de criação/edição

## Funcionalidades por Tipo de Usuário

### Administrador/Partner
- ✅ Criar pacotes combinando serviços existentes
- ✅ Definir preços personalizados ou usar cálculo automático
- ✅ Configurar disponibilidade e datas
- ✅ Gerenciar status (ativo/inativo/destaque)
- ✅ Duplicar pacotes existentes
- ✅ Visualizar estatísticas de pacotes
- ✅ Gerenciar reservas de pacotes

### Cliente Final
- ✅ Visualizar pacotes disponíveis
- ✅ Filtrar por categoria, preço, duração
- ✅ Ver detalhes completos dos pacotes
- 🔄 Reservar pacotes (em desenvolvimento)
- 🔄 Acompanhar status da reserva (em desenvolvimento)

## Próximos Passos

1. **Página de Detalhes do Pacote** (`/pacotes/[slug]`)
   - Informações completas do pacote
   - Galeria de imagens
   - Itinerário detalhado
   - Formulário de reserva

2. **Sistema de Reservas**
   - Fluxo completo de reserva
   - Seleção de datas
   - Informações do cliente
   - Integração com pagamento

3. **Dashboard de Reservas**
   - Gestão de reservas de pacotes
   - Comunicação com clientes
   - Relatórios financeiros

4. **Melhorias na Interface**
   - Filtros avançados
   - Comparação de pacotes
   - Sistema de favoritos
   - Avaliações e comentários

## Arquivos Criados/Modificados

### Backend
- `convex/schema.ts` - Adicionadas tabelas packages e packageBookings
- `convex/domains/packages/types.ts` - Tipos TypeScript
- `convex/domains/packages/queries.ts` - Queries do domínio
- `convex/domains/packages/mutations.ts` - Mutations do domínio
- `convex/domains/packages/index.ts` - Exports do domínio
- `convex/domains/index.ts` - Export do domínio packages

### Frontend
- `src/app/(protected)/admin/dashboard/pacotes/page.tsx` - Página admin
- `src/app/pacotes/page.tsx` - Página pública
- `src/components/dashboard/packages/PackageCard.tsx` - Componente card
- `src/components/dashboard/packages/PackagesStats.tsx` - Componente stats
- `src/components/dashboard/packages/PackageForm.tsx` - Componente form
- `src/components/dashboard/packages/index.ts` - Exports dos componentes

## Considerações de Escalabilidade

### Performance
- Queries otimizadas com índices apropriados
- Paginação implementada na interface admin
- Filtros realizados no lado cliente para melhor UX

### Manutenibilidade
- Código modular seguindo padrões do projeto
- Tipos TypeScript bem definidos
- Separação clara entre domínios
- Componentes reutilizáveis

### Segurança
- Validação de dados no backend
- Verificação de permissões por usuário
- Sanitização de inputs do usuário
- Proteção contra operações não autorizadas

O módulo está pronto para uso e pode ser expandido conforme as necessidades do negócio evoluem. 