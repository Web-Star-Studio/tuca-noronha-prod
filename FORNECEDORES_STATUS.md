# Sistema de Fornecedores - Status da Implementação

## ✅ **BACKEND COMPLETO - Convex (100%)**

### **1. Schema Convex** ✅
**Arquivo**: `/convex/schema.ts`

#### **Campos Públicos** (aparecem no voucher):
- ✅ `name` - Nome do fornecedor (OBRIGATÓRIO)
- ✅ `address` - Endereço (opcional)
- ✅ `cnpj` - CNPJ (opcional)
- ✅ `emergencyPhone` - Fone de plantão (opcional)

#### **Campos Privados** (apenas admin):
- ✅ `bankDetails` - Dados bancários completos
  - `bankName` - Nome do banco
  - `accountType` - Tipo de conta
  - `agency` - Agência
  - `accountNumber` - Número da conta
- ✅ `financialEmail` - E-mail do financeiro
- ✅ `contactPerson` - Contato principal
- ✅ `financialPhone` - Fone do financeiro
- ✅ `pixKey` - Chave PIX

#### **Metadata**:
- ✅ `isActive` - Status ativo/inativo
- ✅ `partnerId` - Partner que criou (filtragem)
- ✅ `organizationId` - Organização
- ✅ `createdBy` - Quem criou
- ✅ `updatedBy` - Quem atualizou por último
- ✅ `createdAt` / `updatedAt` - Timestamps
- ✅ `notes` - Notas internas

#### **Índices Criados**:
- ✅ `by_partner` - Busca por parceiro
- ✅ `by_organization` - Busca por organização
- ✅ `by_active` - Busca por status
- ✅ `by_name` - Busca por nome
- ✅ `by_created_at` - Ordenação por data
- ✅ `by_email` - Busca por email (legacy)
- ✅ `by_createdBy` - Busca por criador

### **2. Types** ✅
**Arquivo**: `/convex/domains/suppliers/types.ts`

- ✅ `Supplier` - Interface completa
- ✅ `SupplierPublicInfo` - Apenas campos públicos (voucher)
- ✅ `SupplierBankDetails` - Estrutura bancária
- ✅ `CreateSupplierArgs` - Validator para criar
- ✅ `UpdateSupplierArgs` - Validator para atualizar
- ✅ `SupplierBankDetailsValidator` - Validator aninhado

### **3. Mutations** ✅
**Arquivo**: `/convex/domains/suppliers/mutations.ts`

#### **`createSupplier`**
- ✅ Roles: `master`, `partner`
- ✅ Valida todos os campos novos
- ✅ Cria fornecedor com timestamps
- ✅ Associa partnerId e organizationId
- ✅ Retorna ID do fornecedor criado

#### **`updateSupplier`**
- ✅ Roles: `master`, `partner`
- ✅ Atualiza qualquer campo (todos opcionais)
- ✅ Registra `updatedBy` e `updatedAt`
- ✅ Validação de existência do fornecedor

#### **`setSupplierStatus`**
- ✅ Role: `master`
- ✅ Ativa/desativa fornecedores
- ✅ Evita atualizações desnecessárias

### **4. Queries** ✅
**Arquivo**: `/convex/domains/suppliers/queries.ts`

#### **`listSuppliers`**
- ✅ Roles: `master`, `partner`
- ✅ Filtros: `search`, `isActive`, `partnerId`, `organizationId`
- ✅ Busca por nome, email, phone, address, CNPJ, contato, notas
- ✅ Ordenação por data de criação (mais recentes primeiro)

#### **`getSupplier`**
- ✅ Role: `master`
- ✅ Retorna fornecedor completo por ID
- ✅ Inclui todos os campos privados

#### **`listSupplierOptions`**
- ✅ Roles: `master`, `partner`
- ✅ Lista simplificada para selects/dropdowns
- ✅ Retorna apenas: `_id`, `name`, `isActive`
- ✅ Filtro por `isActive` opcional

#### **`getSupplierPublicInfo`** ⭐
- ✅ **Query pública** (sem role check)
- ✅ Retorna apenas campos públicos
- ✅ **Para uso no voucher**
- ✅ Retorna: `name`, `address`, `cnpj`, `emergencyPhone`

### **5. Deploy** ✅
- ✅ Schema deployado com sucesso
- ✅ Novos índices criados:
  - `suppliers.by_created_at`
  - `suppliers.by_organization`
  - `suppliers.by_partner`
- ✅ Mutations e queries deployadas
- ✅ Ambiente: `wonderful-salmon-48.convex.cloud`

---

## ⏳ **FRONTEND - Pendente**

### **Próximas Implementações Necessárias:**

#### **1. Formulário de Cadastro/Edição** 🔨
**Arquivo**: `/src/components/dashboard/suppliers/SupplierForm.tsx` (criar)

**Campos do Formulário**:
- [ ] **Nome do Fornecedor** (required) - Input text
- [ ] **Endereço** (opcional) - Textarea
- [ ] **CNPJ** (opcional) - Input formatado
- [ ] **Fone de Plantão** (opcional) - Input phone

**Seção "Dados Privados" (Acordeon/Collapse)**:
- [ ] **Dados Bancários** (acordeon)
  - Banco
  - Tipo de Conta (select: checking/savings)
  - Agência
  - Conta
- [ ] **E-mail do Financeiro** - Input email
- [ ] **Contato Principal** - Input text
- [ ] **Fone do Financeiro** - Input phone
- [ ] **PIX** - Input text
- [ ] **Notas Internas** - Textarea

**Features**:
- [ ] Validação em tempo real
- [ ] Formatação automática (CNPJ, telefones)
- [ ] Preview dos dados públicos
- [ ] Botões: Salvar, Cancelar
- [ ] Toast de sucesso/erro

#### **2. Listagem de Fornecedores** 🔨
**Arquivo**: `/src/app/(protected)/admin/dashboard/fornecedores/page.tsx` (criar)

**Features**:
- [ ] Tabela com fornecedores
- [ ] Busca por nome, CNPJ, contato
- [ ] Filtro por status (ativo/inativo)
- [ ] Colunas: Nome, CNPJ, Contato, Fone, Status, Ações
- [ ] Botão "Novo Fornecedor"
- [ ] Ações: Editar, Ativar/Desativar, Ver Detalhes
- [ ] Paginação
- [ ] Badges de status

#### **3. Modal de Seleção de Fornecedor ao Confirmar Reserva** 🔨
**Arquivos a Atualizar**:
- `/src/components/dashboard/bookings/ActivityBookingRow.tsx`
- `/src/components/dashboard/bookings/EventBookingRow.tsx`
- `/src/components/dashboard/bookings/RestaurantReservationRow.tsx`
- `/src/components/dashboard/bookings/VehicleBookingRow.tsx`

**Funcionalidade**:
- [ ] Ao clicar "Confirmar Reserva"
- [ ] Modal abre com select de fornecedores
- [ ] Lista apenas fornecedores ativos
- [ ] Campo opcional (pode confirmar sem fornecedor)
- [ ] Salva `supplierId` na reserva

#### **4. Atualizar VoucherTemplate** 🔨
**Arquivo**: `/src/components/vouchers/VoucherTemplate.tsx`

**Adicionar no Cabeçalho**:
```tsx
{supplier && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="font-semibold text-blue-900 mb-2">Fornecedor</h3>
    <div className="text-sm text-blue-800 space-y-1">
      <p><strong>{supplier.name}</strong></p>
      {supplier.address && <p>📍 {supplier.address}</p>}
      {supplier.cnpj && <p>CNPJ: {supplier.cnpj}</p>}
      {supplier.emergencyPhone && (
        <p>📞 Plantão: {supplier.emergencyPhone}</p>
      )}
    </div>
  </div>
)}
```

**Queries a Adicionar**:
- [ ] Buscar `supplierId` da reserva
- [ ] Usar `getSupplierPublicInfo` para pegar dados públicos
- [ ] Passar como prop para `VoucherTemplate`

#### **5. Atualizar Queries de Voucher** 🔨
**Arquivo**: `/convex/domains/vouchers/queries.ts`

**Adicionar**:
```typescript
// Buscar supplier se existir
let supplierInfo = null;
if (booking.supplierId) {
  supplierInfo = await ctx.db
    .query("suppliers")
    .filter(q => q.eq(q.field("_id"), booking.supplierId))
    .first();
  
  // Mapear apenas campos públicos
  if (supplierInfo) {
    supplierInfo = {
      name: supplierInfo.name,
      address: supplierInfo.address,
      cnpj: supplierInfo.cnpj,
      emergencyPhone: supplierInfo.emergencyPhone,
    };
  }
}
```

#### **6. Atualizar Types de Voucher** 🔨
**Arquivo**: `/convex/domains/vouchers/types.ts`

**Adicionar**:
```typescript
supplier?: {
  name: string;
  address?: string;
  cnpj?: string;
  emergencyPhone?: string;
};
```

---

## 📋 **Checklist Completa**

### **Backend** ✅
- [x] Schema Convex com campos públicos e privados
- [x] Types e validators
- [x] Mutations: create, update, setStatus
- [x] Queries: list, get, options, publicInfo
- [x] Deploy Convex realizado

### **Frontend**
- [ ] Formulário de cadastro/edição
- [ ] Página de listagem
- [ ] Modal de seleção ao confirmar reserva
- [ ] Integração com VoucherTemplate
- [ ] Atualizar queries de voucher
- [ ] Atualizar types de voucher
- [ ] Testes end-to-end

### **Integrações**
- [ ] Mutations de confirmação de bookings
  - [ ] `confirmActivityBooking` - adicionar supplierId
  - [ ] `confirmEventBooking` - adicionar supplierId
  - [ ] `confirmRestaurantReservation` - adicionar supplierId
  - [ ] `confirmVehicleBooking` - adicionar supplierId

---

## 🎯 **Resultado Esperado**

### **Fluxo Completo**:
1. **Admin cadastra fornecedor**
   - Preenche nome (obrigatório) e demais campos opcionais
   - Dados privados ficam visíveis apenas para admin
   
2. **Admin confirma reserva**
   - Modal abre com lista de fornecedores
   - Seleciona fornecedor (opcional)
   - Reserva é confirmada com `supplierId`

3. **Cliente vê voucher**
   - **Cabeçalho mostra dados do fornecedor** ⭐
   - Nome, endereço, CNPJ, fone de plantão
   - Dados privados NÃO aparecem

4. **Admin gerencia fornecedores**
   - Lista, busca, filtra
   - Edita qualquer campo
   - Ativa/desativa fornecedores

---

## 🚀 **Status Atual**

✅ **Backend 100% pronto e deployado**
⏳ **Frontend 0% implementado**

**Total: 50% Completo**

---

## 📝 **Observações Importantes**

1. **Apenas o nome é obrigatório** - Todos os demais campos são opcionais
2. **Todos os campos são editáveis** - Incluindo o nome
3. **Dados públicos vs privados** claramente separados
4. **Query pública** para voucher não requer autenticação
5. **Filtros por partner/organization** para multi-tenancy
6. **Backward compatible** - Mantém campos legacy (phone, email, assetAssociations)
