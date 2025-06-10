# Correção do Erro do ChatButton - findOrCreateChatRoom

## 🚨 Problema Identificado

O erro ocorria na query `findOrCreateChatRoom` do sistema de chat:

```
ArgumentValidationError: Object is missing the required field `contextId`. Consider wrapping the field validator in `v.optional(...)` if this is expected.

Object: {assetType: "restaurants", contextType: "asset", partnerId: "jx79typagyptt70pe1pnndc3dx7hg7j1"}
Validator: v.object({assetType: v.optional(v.string()), contextId: v.string(), contextType: v.union(v.literal("asset"), v.literal("booking")), partnerId: v.id("users")})
```

### Causa Raiz

O problema estava acontecendo porque:

1. **Inconsistência de IDs**: Os objetos retornados pelo Convex têm `_id` como chave primária, mas alguns componentes estavam tentando acessar `.id`
2. **ID undefined**: Quando `restaurant.id` era `undefined`, o `contextId` ficava `undefined`, causando o erro de validação
3. **Falta de validação**: Não havia validação adequada para garantir que sempre tivéssemos um ID válido

## ✅ Soluções Implementadas

### 1. Correção nas Páginas de Assets

**Antes:**
```typescript
<ChatButton
  assetId={restaurant.id as string}  // ❌ Pode ser undefined
  // ...
/>
```

**Depois:**
```typescript
<ChatButton
  assetId={(restaurant._id || restaurant.id) as string}  // ✅ Fallback seguro
  // ...
/>
```

### 2. Adição de Validação no ChatButton

Adicionada função utilitária para validar IDs:

```typescript
const ensureValidId = (id: string | undefined | null): string => {
  if (!id || id === "undefined" || id === "null") {
    throw new Error("Asset ID é obrigatório para iniciar uma conversa");
  }
  return id;
};
```

### 3. Tratamento de Erro Gracioso

Se o ID for inválido, o botão é renderizado como desabilitado:

```typescript
try {
  contextId = ensureValidId(bookingId || assetId);
} catch (error) {
  // Renderizar botão desabilitado com explicação
  return <Button disabled title="Informações insuficientes..." />;
}
```

## 📋 Arquivos Modificados

### Páginas de Assets
- ✅ `src/app/restaurantes/[slug]/page.tsx`
- ✅ `src/app/eventos/[id]/page.tsx`

### Componentes
- ✅ `src/components/chat/ChatButton.tsx`

## 🔍 Validação da Correção

### Como Testar
1. Acesse uma página de restaurante: `/restaurantes/[slug]`
2. Clique no botão "Tirar Dúvidas"
3. Verifique se não há mais erros no console
4. Teste a criação e abertura de conversas

### Cenários Testados
- ✅ Restaurante com `_id` válido
- ✅ Evento com `_id` válido  
- ✅ Fallback para `.id` quando `_id` não existe
- ✅ Botão desabilitado quando ID é inválido

## 🎯 Impacto da Correção

### Problemas Resolvidos
- ❌ **Erro ArgumentValidationError** no findOrCreateChatRoom
- ❌ **Contexto ID undefined** causando falhas na query
- ❌ **Experiência ruim do usuário** com erros JavaScript

### Melhorias Implementadas
- ✅ **Validação robusta** de IDs antes de usar
- ✅ **Fallback seguro** entre `_id` e `id`
- ✅ **UX melhorada** com botão desabilitado quando necessário
- ✅ **Mensagens de erro** claras para debugging

## 🔄 Próximos Passos

1. **Monitoramento**: Verificar se o erro foi completamente resolvido
2. **Testes**: Testar em diferentes tipos de assets (atividades, veículos, etc.)
3. **Padronização**: Considerar criar um hook unificado para buscar IDs de assets
4. **Documentação**: Atualizar documentação sobre uso correto do ChatButton

## 📝 Notas Técnicas

### Padrão de ID no Convex
- **Tabelas Convex**: Usam `_id` como chave primária
- **Tipos TypeScript**: Podem ter tanto `id?` quanto `_id?` para compatibilidade
- **Solução**: Sempre usar `(_id || id)` como fallback seguro

### Validação de Args no Convex
- **Obrigatório**: `contextId: v.string()` não aceita `undefined`
- **Solução**: Validar no frontend antes de chamar a query
- **Alternativa**: Poderia usar `v.optional(v.string())` mas isso quebraria a lógica de negócio 