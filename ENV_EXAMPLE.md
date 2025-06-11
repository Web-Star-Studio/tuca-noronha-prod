# 🔧 Configuração de Variáveis de Ambiente

## Arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# Convex deployment URL
CONVEX_DEPLOYMENT=your-deployment-url

# Clerk authentication keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI API key para recomendações inteligentes
OPENAI_API_KEY=sk-your-openai-api-key-here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/meu-painel
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/personalizacao
```

## 🚀 Como Obter as Chaves

### OpenAI API Key
1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá para "API Keys" no menu
4. Clique em "Create new secret key"
5. Copie a chave que começa com `sk-`

### Clerk Keys
1. Acesse [clerk.com](https://clerk.com)
2. Crie um projeto
3. Vá para "API Keys" no dashboard
4. Copie as chaves `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`

### Convex Deployment
1. Execute `npx convex dev` para desenvolvimento
2. Para produção, execute `npx convex deploy`
3. Copie a URL de deployment

## 🔒 Segurança

- **NUNCA** commite o arquivo `.env.local`
- Mantenha as chaves seguras
- Use variáveis de ambiente no deploy
- Revogue chaves comprometidas imediatamente

## ✅ Testando a Configuração

Após configurar as variáveis, o sistema:
- Detecta automaticamente se OpenAI está disponível
- Mostra badges visuais de status
- Faz fallback graceful se não configurado
- Funciona perfeitamente em ambos os modos

**Status**: 🟢 Sistema pronto para usar OpenAI real! 