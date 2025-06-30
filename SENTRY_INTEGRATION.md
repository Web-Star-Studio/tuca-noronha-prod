# 🛡️ Integração Sentry - TN Next Convex

## ✅ Status da Integração

A integração do Sentry foi configurada com sucesso no projeto! 🎉

## 📋 Informações do Projeto

- **Organização**: `web-star-studio`
- **Projeto**: `tn-next-convex`
- **DSN**: `https://2fa855a9b2e6ddf31610e9bf6251478f@o4509588857421824.ingest.us.sentry.io/4509588910243840`
- **Dashboard**: https://web-star-studio.sentry.io/projects/tn-next-convex/

## 🚀 Funcionalidades Ativadas

### 1. **Monitoramento de Erros**
- ✅ Captura automática de erros JavaScript
- ✅ Stack traces com source maps
- ✅ Contexto de usuário e navegador
- ✅ Breadcrumbs para rastreamento

### 2. **Performance Monitoring**
- ✅ Rastreamento de transações
- ✅ Core Web Vitals
- ✅ Monitoramento de API routes
- ✅ Instrumentação automática

### 3. **Session Replay**
- ✅ Gravação de sessões com erro
- ✅ 10% de sessões aleatórias
- ✅ Mascaramento de dados sensíveis
- ✅ Bloqueio de mídia

### 4. **User Feedback**
- ✅ Widget de feedback integrado
- ✅ Interface em português
- ✅ Captura de contexto

## 📁 Arquivos Criados

```
├── instrumentation.ts          # Registro das configurações
├── instrumentation-client.ts   # Config do cliente
├── sentry.server.config.ts     # Config do servidor
├── sentry.edge.config.ts       # Config do Edge Runtime
├── src/app/global-error.tsx    # Página de erro global
├── src/lib/sentry.ts          # Funções utilitárias
└── next.config.mjs            # Configuração do Next.js
```

## 🔧 Configurações Aplicadas

### Filtros de Erro
- Ignora erros em desenvolvimento
- Filtra erros de extensões do navegador
- Remove erros de CORS/Network
- Ignora health checks

### Performance
- 10% de amostragem em produção
- 100% em desenvolvimento
- Perfilamento ativado
- Source maps deletados após upload

### Segurança
- Túnel `/monitoring` para evitar ad-blockers
- Dados sensíveis mascarados
- IPs de usuários capturados (GDPR compliance)

## 🎯 Como Usar

### 1. Capturar Erros Customizados

```typescript
import { captureException, addBreadcrumb } from '@/lib/sentry';

try {
  // Seu código
  addBreadcrumb('Iniciando operação', 'custom');
} catch (error) {
  captureException(error, { 
    context: 'payment_processing',
    userId: user.id 
  });
}
```

### 2. Definir Contexto de Usuário

```typescript
import { setUser, clearUser } from '@/lib/sentry';

// Login
setUser({
  id: user.id,
  email: user.email,
  name: user.name
});

// Logout
clearUser();
```

### 3. Monitorar Performance

```typescript
import { withSentry } from '@/lib/sentry';

const result = await withSentry(
  async () => {
    // Operação assíncrona
    return await api.fetchData();
  },
  {
    name: 'fetch_user_data',
    op: 'api.call',
    data: { endpoint: '/api/users' }
  }
);
```

## 🔐 Variáveis de Ambiente

Adicione ao seu `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN="https://2fa855a9b2e6ddf31610e9bf6251478f@o4509588857421824.ingest.us.sentry.io/4509588910243840"
SENTRY_ORG="web-star-studio"
SENTRY_PROJECT="tn-next-convex"

# Para upload de source maps (opcional)
# SENTRY_AUTH_TOKEN="seu_token_aqui"
```

## 📊 Próximos Passos

1. **Criar Auth Token** (opcional)
   - Acesse: https://sentry.io/orgredirect/organizations/web-star-studio/settings/auth-tokens/
   - Crie um token com escopo `project:releases`
   - Adicione ao `.env.local` como `SENTRY_AUTH_TOKEN`

2. **Configurar Alertas**
   - Acesse o dashboard do Sentry
   - Configure regras de alerta por email/Slack
   - Defina thresholds de erro

3. **Integrar com CI/CD**
   - Adicione variáveis no Vercel/seu CI
   - Configure release tracking
   - Ative deploys automáticos

4. **Monitorar Métricas**
   - Acompanhe taxa de erros
   - Analise performance
   - Revise session replays

## 🐛 Debug

Para testar a integração:

```typescript
// Força um erro para teste
throw new Error('Teste do Sentry');

// Ou use o botão de feedback
// Clique em "Reportar problema" no canto da tela
```

## 📚 Recursos

- [Dashboard do Projeto](https://web-star-studio.sentry.io/projects/tn-next-convex/)
- [Documentação Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Guia de Performance](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

**Nota**: A integração está totalmente funcional! Os erros em produção serão automaticamente capturados e enviados para o Sentry. 