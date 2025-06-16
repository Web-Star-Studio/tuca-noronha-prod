# 🔧 Troubleshooting: Senha não funciona no login do Clerk

## 🚨 **Problema Relatado**
Colaboradores estão sendo criados pelo partner, mas a senha definida na criação não funciona para login através do Clerk.

## 🔍 **Possíveis Causas e Soluções**

### 1. **Configuração do Clerk Dashboard**

Verifique as seguintes configurações no seu **Clerk Dashboard**:

1. **Acesse:** [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. **Vá para:** `User & Authentication` → `Email, phone, username`
3. **Verifique se:**
   - ✅ Email address está habilitado
   - ✅ Password está habilitado como método de autenticação
   - ✅ "Require email verification" está **DESABILITADO** (importante!)

### 2. **Configuração de Senhas**

No Clerk Dashboard:
1. **Vá para:** `User & Authentication` → `Restrictions`
2. **Verifique se:**
   - Password strength requirements não são muito restritivos
   - Minimum password length está configurado (recomendado: 8 caracteres)

### 3. **Verificar Logs do Convex**

Para ver os logs detalhados:
1. Execute: `npx convex dev`
2. Tente criar um colaborador
3. Verifique os logs que mostram:
   - Request body enviado para Clerk
   - Resposta do Clerk (status e detalhes)
   - Qualquer erro específico

### 4. **Testar Manualmente**

Para testar se a integração com Clerk está funcionando:

```bash
# Teste direto com a API do Clerk (substitua YOUR_SECRET_KEY pelo seu)
curl 'https://api.clerk.com/v1/users' \
  -X POST \
  -H 'Authorization: Bearer YOUR_SECRET_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email_address": ["teste@exemplo.com"],
    "password": "senha123456",
    "first_name": "Teste",
    "last_name": "Usuario"
  }'
```

### 5. **Verificar Variáveis de Ambiente**

Confirme que a `CLERK_SECRET_KEY` está configurada corretamente:
1. Arquivo `.env.local` deve conter:
   ```
   CLERK_SECRET_KEY=sk_test_...
   ```
2. A chave deve ser a **Secret Key**, não a Publishable Key

### 6. **Configuração de Instância**

No Clerk Dashboard, verifique:
1. **Settings** → **General**
2. Confirme que está em uma instância de **Development** para testes
3. Se estiver em Production, verifique se todas as configurações estão corretas

## 🔧 **Passos para Diagnóstico**

### Passo 1: Verificar se o usuário foi criado no Clerk
1. Acesse o Clerk Dashboard
2. Vá para `Users`
3. Procure pelo email do colaborador criado
4. Verifique se o usuário aparece na lista

### Passo 2: Verificar status do usuário
Se o usuário foi criado:
- ✅ **Status:** Active
- ✅ **Email:** Verified (deve aparecer como verificado)
- ✅ **Password:** Set (deve mostrar que tem senha)

### Passo 3: Testar login manualmente
1. Vá para a página de login da sua aplicação
2. Use o email e senha do colaborador
3. Observe mensagens de erro específicas

## 🚨 **Erros Comuns e Soluções**

### Error: "Email not verified"
**Solução:** No Clerk Dashboard, desabilite "Require email verification" em `Email, phone, username`

### Error: "Invalid password"
**Solução:** 
1. Verifique se a senha atende aos requisitos mínimos
2. Teste com uma senha mais forte (ex: `MinhaSenh@123!`)

### Error: "User not found"
**Solução:** 
1. Verificar se o usuário foi criado no Clerk
2. Verificar logs do Convex para erros na criação

### Error: "Account locked" ou "Too many attempts"
**Solução:** No Clerk Dashboard, reset o status do usuário

## 🔄 **Ações Imediatas**

1. **Execute** o sistema com logs habilitados:
   ```bash
   npx convex dev
   ```

2. **Crie** um colaborador teste e observe os logs

3. **Verifique** se apareceu no Clerk Dashboard

4. **Teste** o login com as credenciais

5. **Reporte** os logs e erros específicos encontrados

## 📞 **Próximos Passos**
Após verificar essas configurações, se o problema persistir, cole aqui:
1. Os logs completos da criação do usuário
2. Screenshot das configurações do Clerk Dashboard
3. Mensagem de erro específica no login 