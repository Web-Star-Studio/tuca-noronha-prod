# Sistema de Onboarding para Travelers

## Visão Geral

Implementamos um sistema completo de onboarding para usuários do tipo "Traveler" que redireciona automaticamente novos usuários para uma página de cadastro de dados pessoais após o registro inicial no Clerk.

## Funcionalidades Implementadas

### 1. **Campos Adicionais no Schema**
- `fullName`: Nome completo do usuário
- `dateOfBirth`: Data de nascimento (formato YYYY-MM-DD)
- `phoneNumber`: Telefone formatado (XX) XXXXX-XXXX
- `onboardingCompleted`: Flag indicando se o onboarding foi concluído
- `onboardingCompletedAt`: Timestamp de quando foi concluído

### 2. **Backend (Convex)**

#### Mutations:
- **`completeOnboarding`**: Completa o processo de onboarding
  - Valida dados de entrada
  - Verifica idade mínima (13 anos)
  - Formata e valida telefone
  - Marca onboarding como concluído

- **`updateUserProfile`**: Atualiza dados do perfil após onboarding
  - Permite atualizar nome completo e telefone
  - Valida se onboarding foi concluído

#### Queries:
- **`getOnboardingStatus`**: Retorna status do onboarding do usuário
- **`getUserProfile`**: Retorna dados completos do perfil
- **`shouldRedirectToOnboarding`**: Verifica se deve redirecionar para onboarding

### 3. **Frontend (Next.js + React)**

#### Componentes:
- **`OnboardingPage`**: Página principal de onboarding
  - Formulário com validação em tempo real
  - Máscara automática para telefone
  - Validação de idade e formato de dados
  - Interface responsiva e acessível

- **`OnboardingRedirect`**: Componente de redirecionamento automático
  - Verifica se usuário precisa completar onboarding
  - Redireciona automaticamente quando necessário
  - Exclui paths específicos do redirecionamento

#### Hook Personalizado:
- **`useOnboarding`**: Hook para gerenciar estado do onboarding
  - Centraliza lógica de onboarding
  - Fornece funções utilitárias
  - Gerencia toasts e redirecionamentos

## Fluxo de Funcionamento

### 1. **Registro Inicial**
1. Usuário se registra via Clerk (email/senha ou OAuth)
2. Sistema cria registro básico na tabela `users`
3. Role é definida como "traveler" automaticamente

### 2. **Redirecionamento Automático**
1. `OnboardingRedirect` verifica se usuário precisa de onboarding
2. Se necessário, redireciona para `/onboarding`
3. Paths excluídos: `/onboarding`, `/sign-in`, `/sign-up`, `/api`

### 3. **Processo de Onboarding**
1. Usuário preenche formulário com:
   - Nome completo (mínimo 2 palavras)
   - Data de nascimento (idade mínima 13 anos)
   - Telefone (formato brasileiro com máscara)
2. Validação em tempo real
3. Submissão e sincronização com Convex
4. Redirecionamento para página inicial

### 4. **Pós-Onboarding**
1. Flag `onboardingCompleted` marcada como `true`
2. Usuário não é mais redirecionado
3. Dados disponíveis em todo o sistema

## Validações Implementadas

### Nome Completo:
- Obrigatório
- Mínimo 2 palavras (nome e sobrenome)
- Trim automático

### Data de Nascimento:
- Obrigatório
- Formato YYYY-MM-DD
- Não pode ser futura
- Idade mínima: 13 anos
- Idade máxima: 120 anos

### Telefone:
- Obrigatório
- Formato: (XX) XXXXX-XXXX
- Máscara automática durante digitação
- Validação com regex

## Arquivos Modificados/Criados

### Backend (Convex):
- `convex/schema.ts` - Adicionados campos de onboarding
- `convex/domains/users/mutations.ts` - Mutations de onboarding
- `convex/domains/users/queries.ts` - Queries de onboarding

### Frontend:
- `src/app/(protected)/onboarding/page.tsx` - Página de onboarding
- `src/components/onboarding/OnboardingRedirect.tsx` - Redirecionamento
- `src/hooks/useOnboarding.ts` - Hook personalizado
- `src/app/providers.tsx` - Integração do redirecionamento

## Configuração de Segurança

### Permissões:
- Apenas travelers podem acessar onboarding
- Usuários só podem completar próprio onboarding
- Validação de autenticação em todas as operações

### Validação de Dados:
- Sanitização de inputs
- Validação server-side e client-side
- Prevenção de dados inválidos

## Como Usar

### Para Desenvolvedores:

```typescript
// Verificar status de onboarding
const { isCompleted, needsOnboarding } = useOnboarding()

// Completar onboarding
const result = await completeOnboarding({
  fullName: "João Silva Santos",
  dateOfBirth: "1990-01-01",
  phoneNumber: "(11) 99999-9999"
})

// Atualizar perfil
const result = await updateProfile({
  fullName: "Novo Nome",
  phoneNumber: "(11) 88888-8888"
})
```

### Para Usuários:
1. Registre-se normalmente via Clerk
2. Será redirecionado automaticamente para completar perfil
3. Preencha os dados solicitados
4. Continue usando a plataforma normalmente

## Melhorias Futuras

### Possíveis Extensões:
- [ ] Foto de perfil durante onboarding
- [ ] Preferências de viagem
- [ ] Integração com redes sociais
- [ ] Verificação de telefone via SMS
- [ ] Onboarding em múltiplas etapas
- [ ] Progresso visual do onboarding
- [ ] Dados opcionais vs obrigatórios
- [ ] Localização/endereço

### Otimizações:
- [ ] Cache de dados de onboarding
- [ ] Lazy loading de componentes
- [ ] Otimização de queries
- [ ] Batch updates
- [ ] Offline support

## Monitoramento

### Métricas Importantes:
- Taxa de conclusão de onboarding
- Tempo médio para completar
- Pontos de abandono
- Erros de validação mais comuns

### Logs:
- Tentativas de onboarding
- Erros de validação
- Redirecionamentos automáticos
- Atualizações de perfil

## Suporte e Manutenção

### Troubleshooting Comum:
1. **Usuário não é redirecionado**: Verificar role e status de onboarding
2. **Erro de validação**: Verificar formato dos dados
3. **Onboarding não salva**: Verificar autenticação e permissões

### Comandos Úteis:
```bash
# Deploy das funções Convex
npx convex dev --once

# Verificar tipos TypeScript
npx tsc --noEmit --skipLibCheck

# Iniciar desenvolvimento
npm run dev
```

---

**Implementado por**: Sistema de Onboarding Tuca Noronha  
**Data**: Janeiro 2025  
**Versão**: 1.0.0 