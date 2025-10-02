# Mapeamento de Funções Convex - Correções Necessárias

## ✅ Funções que já existem mas com nomes ligeiramente diferentes:

### Activities:
- ❌ `api.domains.activities.mutations.createTicket` 
- ✅ `api.domains.activities.mutations.createActivityTicket`

- ❌ `api.domains.activities.mutations.updateTicket`
- ✅ `api.domains.activities.mutations.updateActivityTicket`

- ❌ `api.domains.activities.mutations.removeTicket`
- ✅ `api.domains.activities.mutations.removeActivityTicket`

### Users:
- ❌ `api.domains.users.queries.getAll`
- ✅ `api.domains.users.queries.getAllUsers` ou `api.domains.users.queries.listAllUsers`

## ✅ Funções que existem e estão corretas (não precisam mudança):

### Packages (via api.packages.*):
- ✅ `api.packages.createPackageRequest`
- ✅ `api.packages.getPackages`
- ✅ `api.packages.updatePackageRequestStatus`
- ✅ `api.packages.sendPackageRequestReply`
- ✅ `api.packages.markPackageRequestMessageAsRead`
- ✅ `api.packages.getPackageRequestStats`
- ✅ `api.packages.listPackageRequests`
- ✅ `api.packages.createPackageRequestMessage`
- ✅ `api.packages.getMyPackageRequests`
- ✅ `api.packages.getPackageBySlug`

### Vehicles:
- ✅ `api.domains.vehicles.requestVehicleBooking`
- ✅ `api.domains.vehicles.getBookingById`
- ✅ `api.domains.vehicles.processVehiclePayment`
- ✅ `api.domains.vehicles.getPendingBookingRequests`
- ✅ `api.domains.vehicles.confirmBookingWithPrice`
- ✅ `api.domains.vehicles.rejectBookingRequest`

## ❌ Funções que NÃO existem e precisam ser criadas:

### Subscriptions:
- `api.domains.subscriptions.actions.createPortalSession` (Stripe customer portal)

### Chat:
- `api.domains.chat.queries.listMessages` (provavelmente deveria ser `listChatMessages`)

### Support:
- `api.domains.support.mutations.createSupportMessage`
- `api.domains.support.mutations.updateSupportMessageStatus`

### Partners:
- `api.domains.partners.queries.getMyPartnerRecord`
- `api.domains.partners.mutations.updatePartnerTaxa`
- `api.domains.partners.mutations.deactivateMultiplePartners`

### Recommendations:
- `api.recommendations.getCacheStats`
- `api.recommendations.cacheRecommendations`
- `api.recommendations.invalidateUserCache`
- `api.recommendations.getCachedRecommendations`
- `api.recommendations.getAssetsForRecommendations`

### Restaurants:
- `api.domains.restaurants.mutations.createReservation`
- `api.domains.restaurants.mutations.updateReservationStatus`
- `api.domains.restaurants.queries.getReservationsByRestaurant`
- `api.domains.restaurants.queries.getReservationsByUser`
- `api.domains.restaurants.queries.getReservationsByDate`

## 📋 Plano de Ação:

### 1. Criar aliases/exports para funções com nomes diferentes
### 2. Criar funções que não existem
### 3. Atualizar chamadas no frontend quando necessário
### 4. Rodar script de verificação novamente
