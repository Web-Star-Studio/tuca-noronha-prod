# 📧 Guia de Configuração de Emails - Tucano Noronha

## ✅ **Status Atual**
Seu sistema Nodemailer está **PRONTO PARA PRODUÇÃO** e bem implementado com:
- Arquitetura robusta
- Templates HTML responsivos
- Sistema de logs completo
- Monitoramento de falhas
- Diferentes tipos de emails

## 🚀 **Configuração Rápida**

### **1. Crie o arquivo `.env.local`**
```bash
# Copie este conteúdo para .env.local na raiz do projeto

# === CONFIGURAÇÃO CONVEX ===
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-convex-deploy-key

# === CONFIGURAÇÃO SMTP ===
# OPÇÃO 1: Gmail (Mais fácil para testes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tucanoronha@gmail.com
SMTP_PASS=sua-senha-de-app-gmail

# === EMAILS DO SISTEMA ===
EMAIL_FROM_NAME=Tucano Noronha
EMAIL_FROM=noreply@tucanoronha.com
ADMIN_EMAIL=admin@tucanoronha.com
SUPPORT_EMAIL=suporte@tucanoronha.com
MASTER_EMAIL=master@tucanoronha.com
```

### **2. Configuração Gmail (Recomendado)**

#### **Passos Detalhados:**

1. **Ative 2FA** na sua conta Google:
   - Acesse: https://myaccount.google.com/security
   - Ative "2-Step Verification"

2. **Gere uma Senha de App:**
   - Na mesma página, procure "App passwords"
   - Selecione "Mail" como aplicativo
   - Copie a senha gerada (16 caracteres)
   - Cole em `SMTP_PASS` no `.env.local`

3. **Configure o domínio:**
   - Use um email da sua organização
   - Exemplo: `tucanoronha@gmail.com`

## 🧪 **Testando o Sistema**

### **Via Dashboard (Recomendado)**
1. Acesse: `http://localhost:3000/admin/dashboard`
2. Clique em **"Testar Email"**
3. Digite seu email e envie
4. Verifique sua caixa de entrada

### **Via Script CLI**
```bash
# Teste rápido
npm run test:email seu-email@exemplo.com

# Ou diretamente
node scripts/test-email.js seu-email@exemplo.com
```

### **Teste Real**
- Crie uma reserva no sistema
- Confirme o email de confirmação

## 📊 **Monitoramento**

### **Logs Automáticos**
- Todos os emails são logados na tabela `emailLogs`
- Acesse: `/admin/dashboard/logs`

### **Estatísticas Disponíveis**
- Taxa de sucesso/falha
- Volume por tipo de email
- Timestamps de envio
- Mensagens de erro detalhadas

## 🔧 **Provedores Recomendados**

### **Para Desenvolvimento:**
- **Ethereal Email** (já configurado)
  - Emails não chegam de verdade
  - URLs de preview no console

### **Para Produção:**

#### **1. Gmail (Grátis)**
✅ **Pros:** Fácil configuração, confiável  
❌ **Contras:** Limite de 500 emails/dia  

#### **2. Mailtrap (Recomendado)**
✅ **Pros:** Profissional, analytics avançado  
✅ **Pricing:** Plano gratuito generoso  
📧 **Config:**
```bash
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=seu-username-mailtrap
SMTP_PASS=sua-senha-mailtrap
```

#### **3. SendGrid**
✅ **Pros:** 100 emails/dia grátis  
📧 **Config:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sua-api-key-sendgrid
```

## 🛠️ **Troubleshooting**

### **Erro: "Missing credentials"**
✅ **Solução:** Configure SMTP_USER e SMTP_PASS no .env.local

### **Erro: "EAUTH"**
✅ **Solução:** Verifique se a senha de app do Gmail está correta

### **Emails indo para spam**
✅ **Soluções:**
- Configure SPF/DKIM no seu domínio
- Use domínio próprio para envio
- Evite palavras suspeitas no assunto

### **Rate limiting**
✅ **Soluções:**
- Implemente delays entre envios
- Use provedor SMTP profissional
- Monitore volumes de envio

## 📈 **Escalabilidade**

### **Desenvolvimento → Produção**
```bash
# Desenvolvimento (atual)
NODE_ENV=development # → Usa Ethereal (fake SMTP)

# Produção
NODE_ENV=production # → Usa SMTP real configurado
```

### **Próximos Passos**
1. **Configure domínio próprio** para emails
2. **Implemente fila de emails** para alto volume
3. **Configure monitoramento** de entregabilidade
4. **Implemente templates** personalizados por cliente

## 🎯 **Checklist de Produção**

- [ ] Variáveis de ambiente configuradas
- [ ] Provedor SMTP escolhido e configurado
- [ ] Teste de envio realizado com sucesso
- [ ] Domínio próprio configurado (opcional)
- [ ] SPF/DKIM configurados (recomendado)
- [ ] Monitoramento de logs implementado
- [ ] Backup de templates criado

## 🆘 **Suporte**

**Problema com configuração?**
1. Verifique o arquivo `.env.local`
2. Teste a conexão SMTP
3. Consulte os logs do Convex
4. Verifique o README do sistema: `EMAIL_SYSTEM_README.md`

---

**🎉 Parabéns! Seu sistema de emails está pronto para produção!** 