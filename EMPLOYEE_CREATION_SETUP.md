# Configuração de Criação Direta de Colaboradores

Este sistema permite que partners criem colaboradores (employees) diretamente no Clerk sem necessidade de confirmação por email.

## ✅ Funcionalidades Implementadas

- **Criação direta**: Partners podem criar employees com email/senha
- **Sem verificação de email**: Colaboradores podem acessar imediatamente
- **Status em tempo real**: Monitoramento do processo de criação
- **Controle de acesso**: Apenas partners podem criar employees
- **Tratamento de erros**: Falhas são registradas e reportadas

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente

Certifique-se de que sua variável `CLERK_SECRET_KEY` está configurada:

```env
CLERK_SECRET_KEY=sk_live_... # ou sk_test_... para desenvolvimento
```

### 2. Configuração do Clerk Dashboard

1. Acesse o [Clerk Dashboard](https://dashboard.clerk.com/)
2. Vá para **Configure > Settings**
3. Em **Authentication**, configure:
   - ✅ Email address
   - ✅ Password
   - ❌ Email verification (desabilitar para criação direta)

### 3. Dependências Node.js

O projeto já inclui as dependências necessárias:

```json
{
  "dependencies": {
    "@clerk/clerk-sdk-node": "^4.x.x"
  }
}
```

## 🚀 Como Usar

### 1. Criar Employee (Partner)

```typescript
const result = await createEmployee({
  email: "colaborador@empresa.com",
  password: "senha123forte", // Mínimo 8 caracteres
  name: "Nome do Colaborador",
  phone: "+55 11 99999-9999", // Opcional
  organizationId: "org_123", // Opcional
});

console.log("Employee criado:", result.employeeId);
```

### 2. Monitorar Status de Criação

```typescript
const status = await getEmployeeCreationStatus({
  employeeId: result.employeeId
});

console.log("Status:", status.status); // "pending" | "processing" | "completed" | "failed"
console.log("Pronto para usar:", status.isReady); // true quando employee pode fazer login
```

### 3. Listar Employees do Partner

```typescript
const employees = await listPartnerEmployees({
  limit: 50
});

employees.forEach(emp => {
  console.log(`${emp.name} (${emp.email}) - Status: ${emp.creationRequestStatus}`);
});
```

## 📊 Fluxo de Criação

1. **Partner chama `createEmployee`**
   - Valida dados (email único, senha forte)
   - Cria record temporário no Convex
   - Agenda criação no Clerk

2. **Action `createEmployeeInClerk` executa**
   - Chama Clerk API com `verify_email_address: false`
   - Atualiza record com Clerk ID real
   - Marca como concluído

3. **Employee pode fazer login**
   - Login direto com email/senha
   - Sem necessidade de confirmação por email
   - Acesso imediato ao sistema

## 🔒 Controles de Segurança

### Validações Implementadas

- **Email único**: Verifica se já existe usuário com o email
- **Senha forte**: Mínimo 8 caracteres
- **Formato de email**: Validação regex
- **Organização válida**: Se informada, deve pertencer ao partner
- **RBAC**: Apenas partners podem criar employees

### Logs e Auditoria

Todas as ações são logadas:

```javascript
// Logs de sucesso
console.log(`Employee created in Clerk: ${clerkId} for email: ${email}`);

// Logs de erro
console.error(`Failed to create employee in Clerk: ${email}`, error);
```

## 🛠️ Configuração Avançada

### Para Produção

1. **Configure domínio customizado** no Clerk para URLs profissionais
2. **Ative rate limiting** para prevenir abuso
3. **Configure logs** para monitoramento em produção
4. **Backups regulares** do database de requests

### Personalizações Opcionais

```typescript
// Adicionar campos customizados
const employee = await createEmployee({
  email: "emp@company.com",
  password: "password123",
  name: "Employee Name",
  // Campos adicionais podem ser adicionados aqui
  department: "TI",
  position: "Desenvolvedor",
});
```

## 🐛 Troubleshooting

### Erros Comuns

1. **"CLERK_SECRET_KEY is not configured"**
   - Solução: Adicione a variável de ambiente

2. **"Já existe um usuário com este email"**
   - Solução: Use email diferente ou gerencie usuário existente

3. **"Senha deve ter pelo menos 8 caracteres"**
   - Solução: Use senha mais forte

4. **"Employee deve estar associado a um partner"**
   - Solução: Verifique se o usuário atual é um partner válido

### Debug

Para debugar problemas de criação:

```typescript
// Verificar status específico
const status = await getEmployeeCreationStatus({ employeeId });
console.log("Detalhes do erro:", status.error);

// Verificar logs do Convex Dashboard
// Logs são visíveis na aba "Logs" do deployment
```

## 📝 Próximos Passos

1. **Implementar no Frontend**: Criar formulário de criação de employees
2. **Notificações**: Adicionar notificações de status para o partner
3. **Bulk Creation**: Permitir criação em lote de employees
4. **Integração Email**: Opcional - enviar credenciais por email
5. **Permissões Granulares**: Sistema de permissões por asset

---

> **Nota**: Este sistema foi projetado com base nas melhores práticas de segurança e experiência do usuário, permitindo criação rápida de colaboradores sem comprometer a segurança. 