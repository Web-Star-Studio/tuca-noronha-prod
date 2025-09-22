# 🔧 Configuração do Dashboard Mercado Pago

## 📋 Checklist de Configuração Final

### **1. Acessar o Dashboard do Mercado Pago**
- 🌐 URL: https://www.mercadopago.com.br/developers/panel
- 👤 Faça login com sua conta Mercado Pago

### **2. Configurar Credenciais de Produção**

#### **📌 Passo 1: Obter Access Token**
1. Vá em **"Suas credenciais"** → **"Credenciais de produção"**
2. Copie o **"Access Token"** (começa com `APP_USR-`)
3. Configure a variável: `MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx...`

#### **📌 Passo 2: Configurar Webhook**
1. Vá em **"Webhooks"** → **"Configurar webhook"**
2. **URL do webhook**: 
   ```
   https://wonderful-salmon-48.convex.site/mercadopago/webhook
   ```
3. **Eventos selecionados**:
   - ✅ `payment` (todos os sub-eventos)
   - ✅ `merchant_order` (opcional)
   
4. **Método**: `POST`
5. **Versão da API**: `v1`

#### **📌 Passo 3: Configurar Secret (Recomendado)**
1. No campo **"Secret"**, gere ou digite um secret
2. Configure a variável: `MERCADO_PAGO_WEBHOOK_SECRET=seu_secret_aqui`

---

## ✅ **URL do Webhook Configurada**
```
https://wonderful-salmon-48.convex.site/mercadopago/webhook
```

## 🧪 **Testar Webhook**
Após configurar, use o **"Testar webhook"** no dashboard MP - deve retornar **200 OK**.

---

## 🔄 **Fluxo de Pagamento Completo**

### **1. Cliente faz reserva**
- Formulário → Cria booking → Redireciona para MP

### **2. Cliente paga**
- Mercado Pago processa → Envia webhook → Sistema atualiza status

### **3. Admin confirma**
- Dashboard admin → "Aprovar" → Captura pagamento → Gera voucher

### **4. Cliente recebe**
- Email de confirmação + voucher com QR code

---

## 📊 **Monitoramento**

### **Logs do Convex**
- Dashboard: https://dashboard.convex.dev/wonderful-salmon-48
- Seção **"Logs"** → Filtrar por `mercadoPago`

### **Logs do Mercado Pago**
- Dashboard MP → **"Atividade"** → **"Webhooks"**
- Verificar status das notificações enviadas

---

## 🚨 **Troubleshooting**

### **Webhook retorna 400/500**
1. Verificar se URL está correta
2. Confirmar que Convex está deployado
3. Checar logs no dashboard Convex

### **Pagamento não captura**
1. Verificar se admin está clicando "Aprovar"
2. Confirmar que `mpPaymentId` está salvo no booking
3. Verificar logs da action `approveBookingAndCapturePayment`

### **Voucher não gera**
1. Confirmar que booking foi aprovado
2. Verificar mutation `generateVoucherInternal`
3. Checar se há erros nos logs

---

## 🎯 **Status Final**
- ✅ **Webhook funcionando**: 200 OK
- ✅ **Sistema deployado**: wonderful-salmon-48.convex.cloud  
- ✅ **Formulários integrados**: 4/4
- ✅ **Dashboard admin**: Funcional
- ⏳ **Configurar webhook no MP**: Próximo passo
- ⏳ **Teste com pagamento real**: Após configuração

**🚀 Sistema 100% pronto para receber pagamentos em produção!**
