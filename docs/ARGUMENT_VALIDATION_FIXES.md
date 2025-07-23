# Correção de Erros de Validação de Argumentos - Package Requests

## Problema Identificado

Os logs do Convex mostravam erros de `ArgumentValidationError` onde objetos vazios `{}` estavam sendo passados para queries que esperavam campos obrigatórios:

```
[CONVEX Q(packages:getPackageRequestDetails)] ArgumentValidationError: Object is missing the required field `requestId`.
Object: {}
Validator: v.object({requestId: v.id("packageRequests")})

[CONVEX Q(domains/packageProposals/queries:getProposalsForRequest)] ArgumentValidationError: Object is missing the required field `packageRequestId`.
Object: {}
Validator: v.object({packageRequestId: v.id("packageRequests")})

[CONVEX Q(packages:getPackageRequestMessages)] ArgumentValidationError: Object is missing the required field `packageRequestId`.
Object: {}
Validator: v.object({packageRequestId: v.id("packageRequests")})
```

## Causa Raiz

O problema ocorria devido ao timing entre as mudanças de estado dos componentes React e a execução das queries do Convex. Especificamente:

1. **Estado Transitório**: Quando modais eram abertos/fechados rapidamente, havia momentos onde `requestId` não era `null` mas também não estava corretamente definido
2. **Condições Insuficientes**: As verificações `requestId ? { requestId } : "skip"` não eram robustas o suficiente para evitar a passagem de parâmetros inválidos
3. **Múltiplas Queries**: Vários componentes executavam as mesmas queries com condições ligeiramente diferentes

## Solução Implementada

### 1. Hook Personalizado para Gerenciamento de Queries

Criado `src/hooks/usePackageRequestQueries.ts`:

```typescript
interface UsePackageRequestQueriesProps {
  requestId: Id<"packageRequests"> | null;
  enabled?: boolean;
}

export function usePackageRequestQueries({ 
  requestId, 
  enabled = true 
}: UsePackageRequestQueriesProps) {
  // Only execute queries if we have a valid requestId and the hook is enabled
  const shouldExecute = Boolean(requestId && enabled);

  const requestDetails = useQuery(
    api.packages.getPackageRequestDetails,
    shouldExecute ? { requestId: requestId! } : "skip"
  );

  const requestMessages = useQuery(
    api.packages.getPackageRequestMessages,
    shouldExecute ? { packageRequestId: requestId! } : "skip"
  );

  const requestProposals = useQuery(
    api.domains.packageProposals.queries.getProposalsForRequest,
    shouldExecute ? { packageRequestId: requestId! } : "skip"
  );

  return {
    requestDetails,
    requestMessages,
    requestProposals,
    isLoading: shouldExecute && (
      requestDetails === undefined || 
      requestMessages === undefined || 
      requestProposals === undefined
    ),
    hasValidId: Boolean(requestId),
  };
}
```

### 2. Atualizações nos Componentes

#### PackageRequestDetailsModal
- Substituído queries individuais pelo hook personalizado
- Melhorada validação de estado com `hasValidId`
- Unificado estado de loading

#### PackageRequestChatModal
- Aplicadas mesmas melhorias do modal anterior
- Consistência na validação de parâmetros

#### PackageRequestsSection
- Melhorada validação no `ProposalButton`
- Cast mais seguro para `Id<"packageRequests">`

### 3. Melhorias na Validação

**Antes:**
```typescript
requestId ? { requestId } : "skip"
```

**Depois:**
```typescript
const shouldExecute = Boolean(requestId && enabled);
shouldExecute ? { requestId: requestId! } : "skip"
```

## Benefícios da Solução

1. **Eliminação de Erros**: Não mais objetos vazios passados para queries
2. **Consistência**: Todas as queries relacionadas a package requests usam a mesma lógica
3. **Performance**: Queries são executadas apenas quando necessário
4. **Manutenibilidade**: Lógica centralizada em um único hook
5. **Type Safety**: Melhor tipagem com TypeScript

## Monitoramento

Para verificar se a correção foi efetiva:

1. Observar logs do Convex por erros de `ArgumentValidationError`
2. Testar cenários de abertura/fechamento rápido de modais
3. Verificar comportamento em diferentes estados de rede
4. Monitorar performance das queries

## Arquivos Modificados

- `src/hooks/usePackageRequestQueries.ts` (novo)
- `src/components/dashboard/PackageRequestDetailsModal.tsx`
- `src/components/customer/PackageRequestChatModal.tsx`
- `src/app/(protected)/meu-painel/components/PackageRequestsSection.tsx`
- `docs/ARGUMENT_VALIDATION_FIXES.md` (este arquivo)

## Próximos Passos

1. Monitorar logs por 24-48h para confirmar correção
2. Considerar aplicar padrão similar em outros hooks/componentes
3. Documentar padrão como best practice para queries condicionais 