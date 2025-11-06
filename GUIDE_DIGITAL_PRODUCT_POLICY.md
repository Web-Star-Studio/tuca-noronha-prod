# 🛡️ Guia Digital - Configuração Anti-Reembolso

## ⚠️ Problema Identificado

Uma cliente conseguiu fazer reembolso do guia digital através do Mercado Pago, mesmo sendo produto intangível que não deveria estar coberto pela Compra Garantida.

## 🔍 Causa Raiz

A configuração anterior da preference do Mercado Pago **não marcava explicitamente o produto como digital**, permitindo que:
- Sistema tratasse como produto físico por padrão
- Compra Garantida do MP cobrisse inadvertidamente
- Clientes pudessem abrir disputas e receber reembolso

### O que estava faltando:
1. ❌ Campo `shipments.mode: "not_specified"` (indica ausência de envio físico)
2. ❌ Categoria `digital_content` nos items
3. ❌ Metadata explícita: `digital_product: true`, `intangible: true`
4. ❌ Aviso claro sobre política de não reembolso na interface

## ✅ Soluções Implementadas

### 1. Configuração da API do Mercado Pago

**Arquivo:** `convex/domains/guide/actions.ts`

```typescript
// ANTES (INCORRETO)
items: [{
  category_id: "digital_content", // Genérico demais
}]

// DEPOIS (CORRETO)
items: [{
  category_id: "digital_content", // Marca como conteúdo digital
}],
shipments: {
  mode: "not_specified", // Produto digital - sem envio físico
  local_pickup: false,
  dimensions: null,
  receiver_address: {
    zip_code: "00000000", // Obrigatório mas irrelevante
  }
},
metadata: {
  digital_product: true,    // Marca explicitamente como digital
  intangible: true,         // Produto intangível
  instant_delivery: true,   // Entrega instantânea
  no_refunds: true,        // Sem reembolsos
}
```

### 2. Aviso Legal na Interface de Compra

**Arquivo:** `src/app/(protected)/meu-painel/guia/assinar/page.tsx`

Adicionado aviso destacado ANTES do botão de compra:
- ⚠️ Border destacado em amarelo/âmbar
- ✅ Lista clara de políticas de não reembolso
- 📄 Link para termos completos
- 🔒 Botão alterado para "Aceito os termos e quero comprar"

### 3. Página de Termos e Política de Reembolso

**Arquivo:** `src/app/(protected)/meu-painel/guia/termos/page.tsx`

Página completa com:
- Explicação detalhada sobre produtos digitais
- Base legal (CDC Art. 49 e jurisprudência)
- Política oficial do Mercado Pago
- Garantias oferecidas
- Exceções (apenas problemas técnicos)

## 📋 Checklist de Conformidade

- [x] API configurada com `category_id: "digital_content"`
- [x] Campo `shipments.mode: "not_specified"` adicionado
- [x] Metadata com flags de produto digital
- [x] Aviso visual proeminente na página de compra
- [x] Link para termos completos
- [x] Botão de compra com aceitação explícita
- [x] Página de termos detalhada criada
- [x] Documentação atualizada

## 🔒 Proteções Legais Implementadas

### 1. Compra Garantida do Mercado Pago
Conforme [política oficial do MP](https://www.mercadopago.com.br/ajuda/23185):

> "O Programa 'Compra Garantida do Mercado Pago' não cobre:
> - **Contratações de serviços e/ou produtos intangíveis**"

**Nossa implementação:** Marcamos explicitamente como produto intangível.

### 2. Direito de Arrependimento (CDC)
Art. 49 do CDC prevê 7 dias de arrependimento, MAS:

**Jurisprudência:** Produtos digitais com entrega instantânea não se enquadram, pois:
- Impossibilidade de "devolução" de conteúdo digital
- Entrega e consumo instantâneos
- Facilidade de reprodução do material

**Nossa implementação:** Informamos claramente que é produto digital com entrega imediata.

### 3. Transparência com o Cliente
- ✅ Aviso destacado ANTES da compra
- ✅ Termos acessíveis e claros
- ✅ Botão de compra requer aceitação explícita
- ✅ Múltiplas menções sobre natureza digital

## 🚫 Como Responder a Pedidos de Reembolso

### Reembolso NÃO deve ser concedido se:
1. Cliente já acessou o conteúdo do guia
2. Pagamento foi aprovado e acesso liberado
3. Não há falha técnica que impeça o acesso
4. Cliente simplesmente "não gostou" do conteúdo

### Template de resposta:
```
Olá [Nome],

Agradecemos seu contato. 

Conforme informado na página de compra e nos nossos Termos de Serviço, 
o Guia Digital é um produto intangível com acesso imediato após o pagamento.

Por tratar-se de produto digital já entregue, não oferecemos reembolso 
conforme nossa política de não reembolso, que está de acordo com:

1. Política do Mercado Pago (produtos intangíveis não cobertos)
2. Art. 49 do CDC (produtos digitais com entrega instantânea)
3. Jurisprudência sobre produtos digitais

Estamos à disposição para auxiliar com qualquer dificuldade técnica 
de acesso ao conteúdo.

Atenciosamente,
Equipe Tuca Noronha
```

### Reembolso PODE ser concedido se:
1. ❌ Falha técnica que impede completamente o acesso
2. ❌ Erro no processamento (cobrado 2x, por exemplo)
3. ❌ Compra realizada por terceiro sem autorização

## 📊 Monitoramento

### Métricas a acompanhar:
1. Taxa de disputas abertas no Mercado Pago
2. Taxa de chargebacks
3. Feedback sobre clareza dos termos
4. Tickets de suporte sobre reembolso

### Red Flags (investigar se acontecer):
- ⚠️ Aumento súbito de disputas
- ⚠️ Mercado Pago processando reembolsos automaticamente
- ⚠️ Clientes relatando não ter visto os termos

## 🔄 Próximos Passos Recomendados

1. **Monitorar primeiras vendas** após implementação
2. **Verificar disputas no painel do MP** semanalmente
3. **Coletar feedback** sobre clareza dos termos
4. **Considerar adicionar checkbox** de aceite dos termos (mais explícito ainda)
5. **Email de confirmação** reforçando política de não reembolso

## 📞 Suporte

Em caso de dúvidas sobre esta política ou implementação:
- Revisar este documento
- Verificar código em `convex/domains/guide/actions.ts`
- Consultar página de termos em `/meu-painel/guia/termos`

---

**Data de Implementação:** 05/11/2024
**Versão:** 1.0
**Responsável:** Sistema de proteção anti-reembolso para produtos digitais
