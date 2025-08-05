# Guia de Remoção do Módulo de Acomodações

Este documento serve como um guia para a remoção completa do módulo de acomodações do sistema. Visto que o lançamento inicial não contará com essa funcionalidade, as seguintes seções detalham os arquivos e as alterações necessárias para desativar e remover todas as referências a `accommodations` e `accommodationBookings`.

## Passos para Remoção

A remoção será dividida em três etapas principais:

1.  **Remoção do Domínio Principal**: Excluir o diretório `convex/domains/accommodations`.
2.  **Atualização do Esquema do Banco de Dados**: Remover as tabelas `accommodations` e `accommodationBookings` do arquivo `convex/schema.ts`.
3.  **Refatoração dos Domínios Dependentes**: Modificar todos os arquivos que possuem referências a `accommodations` ou `accommodationBookings` para que o sistema continue funcionando sem erros.

---

## 1. Remoção do Domínio Principal

A primeira etapa consiste em remover o diretório que contém a lógica de negócios principal para o módulo de acomodações.

-   **Ação**: Excluir o diretório a seguir e todo o seu conteúdo.
-   **Caminho**: `convex/domains/accommodations/`

**Verificação**: Após a exclusão, nenhum arquivo relacionado a `accommodations` deve permanecer neste diretório.

---

## 2. Atualização do Esquema do Banco de Dados

A segunda etapa é remover as definições das tabelas de acomodações do esquema do banco de dados. Isso garantirá que o Convex não tente criar ou interagir com tabelas que não existem mais.

-   **Arquivo**: `convex/schema.ts`
-   **Ações**:
    1.  **Remover Tabela `accommodations`**: Localize e exclua a definição da tabela `accommodations`.
    2.  **Remover Tabela `accommodationBookings`**: Localize e exclua a definição da tabela `accommodationBookings`.
    3.  **Remover Referências em Outras Tabelas**: Procure por `v.id("accommodations")` e `v.id("accommodationBookings")` em outras definições de tabela e remova os campos correspondentes.

**Exemplo de código a ser removido de `convex/schema.ts`**:

```typescript
// Accommodations/Hospedagens
accommodations: defineTable({
  // ... todos os campos
}).index("by_partner", ["partnerId"]),

// Accommodation Bookings
accommodationBookings: defineTable({
  // ... todos os campos
}).index("by_accommodation", ["accommodationId"]),
```

**Verificação**: Após a edição, o arquivo `convex/schema.ts` não deve conter nenhuma menção a `accommodations` ou `accommodationBookings`.

---

## 3. Refatoração dos Domínios Dependentes

Esta é a etapa mais complexa, pois envolve a edição de múltiplos arquivos que dependem do módulo de acomodações. A seguir, uma lista detalhada de cada arquivo e as alterações necessárias.

### Domínio: `bookings`

-   **Arquivo**: `convex/domains/bookings/mutations.ts`
    -   **Remover `createAccommodationBookingValidator`**: Exclua a importação e o uso deste validador.
    -   **Remover `updateAccommodationBookingValidator`**: Exclua a importação e o uso deste validador.
    -   **Remover `createAccommodationBooking`**: Exclua toda a função `createAccommodationBooking`.
    -   **Remover `confirmAccommodationBooking`**: Exclua toda a função `confirmAccommodationBooking`.
    -   **Remover `cancelAccommodationBookingInternal`**: Exclua toda a função `cancelAccommodationBookingInternal`.
    -   **Remover Referências em `booking`**: Remova a lógica de `accommodation` em todas as funções que processam diferentes tipos de reserva.

-   **Arquivo**: `convex/domains/bookings/queries.ts`
    -   **Remover Lógica de `accommodation`**: Exclua todas as referências a `accommodationBookings` e lógica de consulta relacionada a acomodações.

-   **Arquivo**: `convex/domains/bookings/types.ts`
    -   **Remover Validadores**: Exclua `createAccommodationBookingValidator` e `updateAccommodationBookingValidator`.

### Domínio: `chat`

-   **Arquivos**: `convex/domains/chat/mutations.ts`, `convex/domains/chat/queries.ts`, `convex/domains/chat/templates.ts`
    -   **Remover `case "accommodations"`**: Exclua todos os blocos `case` que tratam do contexto de `accommodations`.

### Domínio: `coupons`

-   **Arquivos**: `convex/domains/coupons/actions.ts`, `convex/domains/coupons/mutations.ts`, `convex/domains/coupons/queries.ts`, `convex/domains/coupons/validators.ts`
    -   **Remover `v.literal("accommodations")`**: Exclua o tipo `accommodations` das uniões de validadores.
    -   **Remover Lógica de Consulta**: Remova a lógica que busca por acomodações ao listar ativos.

### Domínio: `email`

-   **Arquivos**: `convex/domains/email/actions.ts`, `convex/domains/email/types.ts`
    -   **Remover `accommodation` de `bookingType`**: Exclua a string `"accommodation"` dos tipos de reserva.

### Domínio: `packages`

-   **Arquivos**: `convex/domains/packages/mutations.ts`, `convex/domains/packages/queries.ts`, `convex/domains/packages/types.ts`, `convex/domains/packages/customPackageBuilder.ts`, `convex/domains/packages/matchingEngine.ts`, `convex/domains/packages/requestAnalysis.ts`
    -   **Remover `accommodationId`**: Exclua o campo `accommodationId` e toda a lógica associada a ele.
    -   **Remover Consultas a `accommodations`**: Remova todas as chamadas a `api.domains.accommodations.queries`.
    -   **Remover Lógica de Preços**: Exclua o cálculo de `accommodationPrice`.

### Domínio: `partners`

-   **Arquivos**: `convex/domains/partners/mutations.ts`, `convex/domains/partners/types.ts`
    -   **Remover `accommodation` de `bookingType`**: Exclua o tipo `accommodation` das listas de tipos de reserva.
    -   **Remover `Id<"accommodationBookings">`**: Remova a referência ao tipo de ID.

### Domínio: `rbac`

-   **Arquivos**: `convex/domains/rbac/mutations.ts`, `convex/domains/rbac/queries.ts`, `convex/domains/rbac/utils.ts`
    -   **Remover `assetType === "accommodations"`**: Exclua a lógica que verifica permissões para o tipo de ativo `accommodations`.
    -   **Remover Consultas a `accommodations`**: Remova as consultas que listam ou verificam acomodações.

### Domínio: `recommendations`

-   **Arquivo**: `convex/domains/recommendations/queries.ts`
    -   **Remover `accommodations` das Consultas**: Exclua `accommodations` da lista de tipos de ativos a serem consultados.

### Domínio: `reports`

-   **Arquivo**: `convex/domains/reports/queries.ts`
    -   **Remover `accommodationBookings`**: Exclua a consulta a `accommodationBookings`.
    -   **Remover `accommodations`**: Exclua `accommodations` da lista de ativos.

### Domínio: `reviews`

-   **Arquivos**: `convex/domains/reviews/mutations.ts`, `convex/domains/reviews/queries.ts`
    -   **Remover `case "accommodation"`**: Exclua a lógica que trata de avaliações para acomodações.
    -   **Remover `updateAccommodationRating`**: Exclua a função auxiliar.

### Domínio: `stripe`

-   **Arquivos**: `convex/domains/stripe/actions.ts`, `convex/domains/stripe/bookingActions.ts`, `convex/domains/stripe/mutations.ts`, `convex/domains/stripe/queries.ts`, `convex/domains/stripe/types.ts`, `convex/domains/stripe/utils.ts`
    -   **Remover `case "accommodation"`**: Exclua todos os blocos `case` que tratam de pagamentos para `accommodation`.
    -   **Remover Referências a `accommodationBookings`**: Exclua o nome da tabela das constantes e da lógica.
    -   **Remover `ACCOMMODATION` de Enums**: Exclua `ACCOMMODATION` dos tipos de produto.

### Domínio: `users`

-   **Arquivo**: `convex/domains/users/queries.ts`
    -   **Remover Consultas a `accommodations`**: Exclua `accommodations` das coletas de ativos do parceiro.
    -   **Remover `accommodationAssetValidator`**: Exclua o validador e a função `listAllAccommodations`.

### Domínio: `vouchers`

-   **Arquivos**: `convex/domains/vouchers/actions.ts`, `convex/domains/vouchers/mutations.ts`, `convex/domains/vouchers/queries.ts`, `convex/domains/vouchers/types.ts`, `convex/domains/vouchers/utils.ts`
    -   **Remover `case "accommodation"`**: Exclua a lógica que trata de vouchers para acomodações.
    -   **Remover `ACCOMMODATION` de Enums**: Exclua `ACCOMMODATION` dos tipos de reserva.

### Arquivos Raiz do `convex/`

-   **Arquivo**: `convex/schema.ts`
    -   **Ação**: Já mencionado na Seção 2.

-   **Arquivo**: `convex/wishlist.ts`
    -   **Remover `case "accommodation"`**: Exclua a lógica que trata de `accommodation` na lista de desejos.

-   **Arquivo**: `convex/userPreferences.ts`
    -   **Remover `accommodation`**: Exclua o campo `accommodation` das preferências do usuário.

-   **Arquivo**: `convex/_generated/api.d.ts`
    -   **Ação**: Este arquivo é gerado automaticamente. Após remover todas as referências e o domínio `accommodations`, execute `bunx convex dev` para que o Convex regenere este arquivo sem as referências ao módulo de acomodações.

---

## Conclusão

Após seguir todos os passos detalhados neste guia, o módulo de acomodações será completamente removido do backend. É crucial testar a aplicação exaustivamente após as alterações para garantir que nenhuma funcionalidade existente tenha sido quebrada. Recomenda-se executar todos os testes de integração e verificar manualmente os fluxos de reserva para outros tipos de ativos.