# Sistema de Pacotes Simplificado

## Visão Geral

O sistema de pacotes foi simplificado para um fluxo de solicitação onde:

1. **Usuários** preenchem um formulário detalhado na página pública
2. **Admins** recebem as solicitações e criam pacotes offline
3. **Usuários** acompanham o status através de um número de rastreamento

## Arquitetura

### Backend (Convex)

#### Schema
- **`packageRequests`**: Nova tabela para armazenar solicitações de pacotes
  - Informações do cliente (nome, email, telefone, idade, profissão)
  - Detalhes da viagem (destino, datas, duração, grupo, orçamento)
  - Preferências (hospedagem, atividades, transporte, gastronomia)
  - Status de acompanhamento
  - Observações do admin e propostas

#### Funções Convex
- **`createPackageRequest`**: Cria nova solicitação (público)
- **`getPackageRequestByNumber`**: Busca por número de rastreamento (público)
- **`listPackageRequests`**: Lista solicitações para admin
- **`updatePackageRequestStatus`**: Atualiza status (admin)
- **`getPackageRequestStats`**: Estatísticas do dashboard

### Frontend

#### Páginas Públicas
- **`/pacotes/solicitar`**: Formulário de solicitação em 4 etapas
- **`/pacotes/acompanhar`**: Rastreamento por número da solicitação

#### Páginas Admin
- **`/admin/dashboard/solicitacoes-pacotes`**: Gerenciamento de solicitações

#### Componentes
- **`PackageRequestForm`**: Formulário multi-etapa para solicitação
- **`PackageRequestTracker`**: Componente de rastreamento
- **`PackageRequestsAdmin`**: Dashboard administrativo

## Fluxo de Trabalho

### 1. Solicitação do Cliente
```
Cliente acessa /pacotes/solicitar
↓
Preenche formulário em 4 etapas:
  - Informações pessoais
  - Detalhes da viagem
  - Preferências
  - Informações adicionais
↓
Recebe número de rastreamento (ex: PKG-ABC123-XYZ)
```

### 2. Processamento Admin
```
Admin acessa /admin/dashboard/solicitacoes-pacotes
↓
Visualiza lista de solicitações pendentes
↓
Abre detalhes da solicitação
↓
Atualiza status:
  - pending → in_review
  - in_review → proposal_sent (com proposta)
  - proposal_sent → confirmed
```

### 3. Acompanhamento do Cliente
```
Cliente acessa /pacotes/acompanhar
↓
Insere número de rastreamento
↓
Visualiza status atual e timeline
↓
Recebe proposta quando disponível
```

## Status da Solicitação

- **`pending`**: Solicitação recebida, aguardando análise
- **`in_review`**: Em análise pela equipe
- **`proposal_sent`**: Proposta personalizada enviada
- **`confirmed`**: Cliente confirmou a viagem
- **`cancelled`**: Solicitação cancelada

## Tipos de Dados

### PackageRequest
```typescript
interface PackageRequest {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    age?: number;
    occupation?: string;
  };
  tripDetails: {
    destination: string;
    startDate: string;
    endDate: string;
    duration: number;
    groupSize: number;
    companions: string;
    budget: number;
    budgetFlexibility: string;
  };
  preferences: {
    accommodationType: string[];
    activities: string[];
    transportation: string[];
    foodPreferences: string[];
    accessibility?: string[];
  };
  status: PackageRequestStatus;
  requestNumber: string;
  adminNotes?: string;
  proposalDetails?: string;
  // ... outros campos
}
```

## Funcionalidades

### Para Clientes
- ✅ Formulário intuitivo em múltiplas etapas
- ✅ Validação de dados em tempo real
- ✅ Número de rastreamento único
- ✅ Acompanhamento de status em tempo real
- ✅ Timeline visual do progresso
- ✅ Visualização da proposta quando disponível

### Para Admins
- ✅ Dashboard com estatísticas
- ✅ Lista filtrada de solicitações
- ✅ Visualização detalhada de cada solicitação
- ✅ Atualização de status
- ✅ Adição de observações internas
- ✅ Envio de propostas personalizadas

## Próximos Passos

### Melhorias Futuras
1. **Notificações por Email**
   - Confirmação de recebimento
   - Notificação de mudança de status
   - Envio da proposta

2. **Integração com WhatsApp**
   - Notificações via WhatsApp
   - Chat direto com o cliente

3. **Sistema de Templates**
   - Templates de propostas
   - Respostas automáticas

4. **Analytics**
   - Métricas de conversão
   - Tempo médio de resposta
   - Satisfação do cliente

5. **Exportação de Dados**
   - Relatórios em PDF
   - Exportação para Excel
   - Integração com CRM

## Arquivos Criados/Modificados

### Backend
- `convex/schema.ts` - Adicionada tabela `packageRequests`
- `convex/domains/packages/packageRequests.ts` - Funções Convex
- `convex/domains/packages/packageRequestTypes.ts` - Tipos TypeScript

### Frontend
- `src/components/packages/PackageRequestForm.tsx` - Formulário de solicitação
- `src/components/packages/PackageRequestTracker.tsx` - Rastreamento
- `src/components/dashboard/PackageRequestsAdmin.tsx` - Dashboard admin
- `src/app/pacotes/solicitar/page.tsx` - Página de solicitação
- `src/app/pacotes/acompanhar/page.tsx` - Página de rastreamento
- `src/app/(protected)/admin/dashboard/solicitacoes-pacotes/page.tsx` - Admin
- `src/app/(protected)/admin/dashboard/layout.tsx` - Menu atualizado

## Benefícios da Simplificação

1. **Redução de Complexidade**: Elimina a necessidade de gerenciar inventário complexo
2. **Flexibilidade**: Permite criação de pacotes totalmente personalizados
3. **Melhor UX**: Processo mais simples e direto para o cliente
4. **Eficiência Operacional**: Admin pode focar na criação de experiências únicas
5. **Escalabilidade**: Sistema mais fácil de manter e expandir

## Considerações Técnicas

- Todas as funções Convex seguem as melhores práticas
- TypeScript 100% tipado
- Componentes reutilizáveis e modulares
- Design responsivo e acessível
- Validação de dados robusta
- Tratamento de erros adequado 