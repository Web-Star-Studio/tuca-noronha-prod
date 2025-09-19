# 🚀 Configuração Mercado Pago para Produção

## ✅ Status Atual das Credenciais

### Backend Convex (CONFIGURADO):
- **Produção**: `APP_USR-...` (Credenciais REAIS) ✅
- **Dev**: `TEST-...` (Credenciais de TESTE) ✅

### Frontend (.env.local):
```bash
# Para testar pagamentos REAIS:
MERCADO_PAGO_PUBLIC_KEY=APP_USR-c6615316-135e-4bae-a601-09ea74695458
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-4502131590791687-091910-8b2ae9f979b05fd51b5dd3f64dee711d-2702432900
MERCADO_PAGO_WEBHOOK_SECRET=0d78944083c32b3944bac8f9ec7856384b590912c366561f87d33194c469625e

# URLs de produção:
NEXT_PUBLIC_APP_URL=https://tucanoronha.com.br
NEXT_PUBLIC_URL=https://www.tucanoronha.com.br
SITE_URL=https://www.tucanoronha.com.br
```

## 🌐 URLs de Webhook Configuradas

### Produção:
```
https://wonderful-salmon-48.convex.site/mercadopago/webhook
```

### Desenvolvimento:
```
https://calculating-sockeye-278.convex.site/mercadopago/webhook
```

## 📋 Checklist para Pagamentos Reais

### ✅ Já Configurado:
- [x] Credenciais de produção no Convex
- [x] Credenciais de produção no frontend
- [x] Sistema de captura manual implementado
- [x] Fluxo: Autorização → Confirmação → Captura → Voucher

### 🔧 Precisa Fazer:
- [ ] Configurar webhook no painel do Mercado Pago
- [ ] Deploy do frontend para produção
- [ ] Testar fluxo completo

## 🎯 Fluxo de Pagamento Real

1. **Cliente faz reserva** → Credenciais de produção
2. **Pagamento autorizado** → Valor bloqueado no cartão REAL
3. **Admin confirma** → Sistema captura valor REAL
4. **Voucher gerado** → Cliente recebe confirmação

## ⚠️ IMPORTANTE

**Agora você pode testar pagamentos REAIS!**
- Valores serão cobrados no cartão
- Use cartões válidos para teste
- Admin precisa confirmar para capturar

## 🔗 Links Úteis

- [Painel Mercado Pago](https://www.mercadopago.com.br/developers/panel)
- [Dashboard Admin - Reservas](https://www.tucanoronha.com.br/admin/dashboard/reservas)
- [Webhook Test](https://wonderful-salmon-48.convex.site/mercadopago/test-webhook)
