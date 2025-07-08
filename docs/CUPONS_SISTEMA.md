# Sistema de Cupons - Tuca Noronha Tourism Platform

## Visão Geral

O Sistema de Cupons é uma funcionalidade completa que permite criar, gerenciar e aplicar cupons de desconto em toda a plataforma de turismo. O sistema oferece flexibilidade para diferentes tipos de desconto, regras de aplicação e controle granular de uso.

## Arquitetura do Sistema

### 1. Estrutura de Banco de Dados

#### Tabela `coupons`
Armazena as informações principais dos cupons:

```typescript
interface Coupon {
  _id: Id<"coupons">;
  code: string;                    // Código único (ex: "DESCONTO20")
  name: string;                    // Nome descritivo
  description: string;             // Descrição detalhada
  discountType: "percentage" | "fixed_amount";
  discountValue: number;           // Valor do desconto
  maxDiscountAmount?: number;      // Limite máximo para % 
  minimumOrderValue?: number;      // Valor mínimo do pedido
  maximumOrderValue?: number;      // Valor máximo do pedido
  usageLimit?: number;             // Limite total de usos
  usageCount: number;              // Quantidade já utilizada
  userUsageLimit?: number;         // Limite por usuário
  validFrom: number;               // Data de início (timestamp)
  validUntil: number;              // Data de fim (timestamp)
  type: "public" | "private" | "first_purchase" | "returning_customer";
  isActive: boolean;
  isPubliclyVisible: boolean;
  // ... outros campos
}
```

#### Tabela `couponUsages`
Registra cada uso de cupom:

```typescript
interface CouponUsage {
  _id: Id<"couponUsages">;
  couponId: Id<"coupons">;
  userId: Id<"users">;
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle" | "accommodation" | "package";
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedAt: number;
  status: "applied" | "refunded" | "cancelled";
  // ... outros campos
}
```

#### Tabela `couponAuditLogs`
Logs de auditoria para rastreamento:

```typescript
interface CouponAuditLog {
  _id: Id<"couponAuditLogs">;
  couponId: Id<"coupons">;
  actionType: "created" | "updated" | "activated" | "deactivated" | "deleted" | "applied" | "refunded";
  performedBy: Id<"users">;
  performedAt: number;
  actionData?: any;
  // ... outros campos
}
```

### 2. Funcionalidades Backend

#### Queries (`convex/domains/coupons/queries.ts`)
- `listCoupons` - Lista cupons com filtros
- `getCouponById` - Busca cupom por ID
- `getCouponByCode` - Busca cupom por código
- `getPublicCoupons` - Lista cupons públicos válidos
- `checkCouponEligibility` - Verifica elegibilidade
- `getCouponStats` - Estatísticas de uso
- `getCouponUsageHistory` - Histórico de uso

#### Mutations (`convex/domains/coupons/mutations.ts`)
- `createCoupon` - Criar novo cupom
- `updateCoupon` - Atualizar cupom existente
- `toggleCouponStatus` - Ativar/desativar cupom
- `deleteCoupon` - Excluir cupom (soft delete)
- `applyCoupon` - Aplicar cupom a uma compra
- `refundCouponUsage` - Estornar uso de cupom

#### Actions (`convex/domains/coupons/actions.ts`)
- `validateCouponRealTime` - Validação em tempo real
- `calculateCouponDiscount` - Calcular desconto
- `sendExpirationNotifications` - Notificações de expiração
- `processExpiredCoupons` - Processar cupons expirados
- `generateCouponUsageReport` - Gerar relatórios
- `applyAutomaticCoupons` - Aplicar cupons automáticos

### 3. Componentes Frontend

#### Painel Administrativo
- `CouponCard` - Card individual de cupom
- `CouponForm` - Formulário de criação/edição
- `CouponsGrid` - Grid principal com filtros
- `CouponFilters` - Componente de filtros
- `CouponStats` - Estatísticas e métricas

#### Validação e Aplicação
- `CouponValidator` - Validador de cupom único
- `MultipleCouponValidator` - Validador de múltiplos cupons
- `CheckoutCouponIntegration` - Integração com checkout

#### Hooks Personalizados
- `useCouponValidation` - Hook para validação
- `useCouponIntegration` - Hook para integração com pagamento
- `useAutomaticCoupons` - Hook para cupons automáticos

## Tipos de Cupons

### 1. Por Tipo de Desconto
- **Percentual**: Desconto em porcentagem do valor
- **Valor Fixo**: Desconto em valor monetário fixo

### 2. Por Público-Alvo
- **Público**: Qualquer usuário pode usar
- **Privado**: Apenas usuários específicos
- **Primeira Compra**: Novos clientes apenas
- **Cliente Recorrente**: Clientes que já compraram

### 3. Por Aplicabilidade
- **Global**: Aplica a tipos de serviços
- **Específico**: Aplica a assets individuais

## Regras de Negócio

### Validações de Cupom
1. **Período de Validade**: Cupom deve estar dentro do período
2. **Status Ativo**: Cupom deve estar ativo
3. **Limite de Uso**: Verificar limites totais e por usuário
4. **Valor do Pedido**: Verificar valores mínimo e máximo
5. **Aplicabilidade**: Verificar se aplica ao asset/serviço
6. **Elegibilidade do Usuário**: Verificar se usuário pode usar

### Cálculo de Desconto
```typescript
// Desconto percentual
if (discountType === "percentage") {
  discountAmount = (orderAmount * discountValue) / 100;
  if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
    discountAmount = maxDiscountAmount;
  }
}

// Valor fixo
if (discountType === "fixed_amount") {
  discountAmount = Math.min(discountValue, orderAmount);
}

finalAmount = Math.max(0, orderAmount - discountAmount);
```

### Cupons Empilháveis
- Cupons podem ser configurados como empilháveis
- Sistema verifica conflitos automaticamente
- Aplicação em ordem de maior desconto

## Segurança e Auditoria

### Controle de Acesso
- **Master**: Acesso completo
- **Partner**: Gerencia apenas seus cupons
- **Employee**: Acesso delegado via permissões

### Logs de Auditoria
Todas as ações são registradas:
- Criação, edição, exclusão de cupons
- Aplicação e estorno de cupons
- Mudanças de status
- Tentativas de uso inválido

### Prevenção de Fraudes
- Códigos únicos obrigatórios
- Validação de elegibilidade em tempo real
- Controle de limite de uso
- Rastreamento de usuário

## Integração com Sistema de Pagamento

### Fluxo de Aplicação
1. Usuário insere código do cupom
2. Sistema valida em tempo real
3. Calcula desconto aplicável
4. Atualiza valor final do pedido
5. Registra uso do cupom
6. Processa pagamento com valor ajustado

### Estorno de Cupons
- Cupons podem ser estornados em caso de cancelamento
- Decrementa contador de uso
- Registra motivo do estorno
- Permite reutilização se dentro dos limites

## Performance e Otimização

### Indexação
- Índices otimizados para consultas frequentes
- Busca por código (principal)
- Filtros por partner, organização, status
- Ordenação por data de criação

### Cache
- Cupons públicos em cache para performance
- Validações frequentes otimizadas
- Estatísticas calculadas sob demanda

## Notificações e Alertas

### Notificações Automáticas
- Cupons próximos ao vencimento (3 dias)
- Limite de uso atingido
- Cupons inativos automaticamente

### Alertas no Painel
- Dashboard com métricas importantes
- Alertas visuais para ação necessária
- Relatórios de uso e performance

## Relatórios e Analytics

### Métricas Disponíveis
- Total de cupons criados
- Taxa de uso por cupom
- Valor total de desconto concedido
- Cupons mais populares
- Análise por período

### Exportação
- Relatórios em formato CSV/Excel
- Dados filtráveis por período
- Métricas agregadas por partner

## Configuração e Deployment

### Variáveis de Ambiente
```bash
# Configurações do sistema de cupons
COUPON_MAX_USAGE_LIMIT=10000
COUPON_DEFAULT_EXPIRATION_DAYS=30
COUPON_NOTIFICATION_THRESHOLD_DAYS=3
```

### Deploy
1. Aplicar migrations do schema
2. Configurar permissões de acesso
3. Executar testes de validação
4. Monitorar logs de uso

## Testes

### Testes Unitários
- Validação de códigos
- Cálculo de descontos
- Regras de negócio
- Utilitários de formatação

### Testes de Integração
- Fluxo completo de aplicação
- Integração com sistema de pagamento
- Validação em tempo real
- Estorno de cupons

### Testes de Performance
- Carga de validação simultânea
- Performance de consultas
- Stress test de aplicação

## Manutenção

### Limpeza Automática
- Cupons expirados são desativados automaticamente
- Logs antigos são arquivados
- Cache é limpo periodicamente

### Monitoramento
- Logs de erro detalhados
- Métricas de performance
- Alertas de falhas
- Dashboard de saúde do sistema

## Roadmap Futuro

### Funcionalidades Planejadas
- Cupons por geolocalização
- Desconto progressivo por fidelidade
- Integração com programa de pontos
- Cupons para grupos/eventos especiais
- A/B testing de cupons
- Machine learning para sugestões

### Melhorias Técnicas
- Cache distribuído
- Processamento assíncrono
- API externa para parceiros
- Webhooks para integrações

## Suporte e Troubleshooting

### Problemas Comuns
1. **Cupom não encontrado**: Verificar código e status
2. **Desconto não aplicado**: Verificar elegibilidade
3. **Erro de validação**: Verificar regras de negócio
4. **Performance lenta**: Verificar índices e cache

### Logs de Debug
```typescript
// Ativar logs detalhados
console.log("Validando cupom:", {
  code: couponCode,
  userId,
  orderValue,
  assetType
});
```

### Contato
- Documentação: `/docs/cupons`
- Issues: GitHub Issues
- Suporte: suporte@tucanoronha.com

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Autor**: Sistema de Desenvolvimento Tuca Noronha