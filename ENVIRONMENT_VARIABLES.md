# Variáveis de Ambiente Necessárias para Produção

## Mercado Pago (Obrigatórias para Produção)

```bash
# Token de acesso do Mercado Pago (PRODUÇÃO)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx...

# Secret do webhook (recomendado para segurança)
MERCADO_PAGO_WEBHOOK_SECRET=sua_webhook_secret_aqui

# URL do site para webhooks e redirect URLs
CONVEX_SITE_URL=https://sua-url-de-producao.com
```

## Como Obter as Credenciais

### 1. MERCADO_PAGO_ACCESS_TOKEN
- Acesse [Mercado Pago Developers](https://developers.mercadopago.com/)
- Vá em "Suas credenciais"
- Copie o **Access Token de PRODUÇÃO**
- ⚠️ **IMPORTANTE**: Use credenciais de PRODUÇÃO, não TESTE

### 2. MERCADO_PAGO_WEBHOOK_SECRET
- No dashboard do Mercado Pago
- Vá em "Webhooks"
- Configure o endpoint: `https://sua-url.com/mercadopago/webhook`
- Eventos recomendados: `payment.*`
- Gere/copie o secret fornecido

### 3. CONVEX_SITE_URL
- URL base do seu site em produção
- Exemplo: `https://tuca-noronha.vercel.app`
- Usado para construir URLs de redirecionamento e notificações

## Verificação Pós-Deploy

Após configurar e fazer deploy:

1. **Teste de pagamento**:
   - Faça uma reserva teste
   - Pague com cartão teste do MP
   - Verifique se webhook é recebido

2. **Logs do webhook**:
   - Monitore logs no Convex dashboard
   - Verifique se eventos são processados

3. **Fluxo completo**:
   - Reserva → Pagamento → Webhook → Aprovação → Voucher → Email

## Status Atual

✅ **Sistema implementado e testado**
✅ **Migração do Stripe completa**
✅ **Todos os formulários integrados**
✅ **Webhooks configurados**
✅ **Dashboard administrativo funcional**

**Próximo passo**: Configurar as variáveis e fazer deploy em produção! 🚀
