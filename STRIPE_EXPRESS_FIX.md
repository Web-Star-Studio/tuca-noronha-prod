# Correção do Erro Stripe Express

## Problema Identificado

Erro ao criar conta conectada no Stripe:
```
StripeInvalidRequestError: You may not provide the `type` parameter and `controller` parameters simultaneously. They are mutually exclusive.
```

## Causa

O código estava enviando ambos os parâmetros `type: "express"` e `controller` ao criar a conta no Stripe. Esses parâmetros são mutuamente exclusivos:
- `type`: Define o tipo de conta (Express, Standard, ou Custom)
- `controller`: Usado apenas para contas Custom para controlar aspectos específicos

## Solução Aplicada

1. **Removido parâmetro `controller`** de `convex/domains/partners/actions.ts`
   - O parâmetro controller não é compatível com contas Express
   - Contas Express têm configurações pré-definidas pelo Stripe

2. **Atualizado URLs de callback** para nova localização:
   - De: `/meu-painel/configuracoes/onboarding`
   - Para: `/admin/dashboard/pagamentos/onboarding`

3. **Criado página de callback** em `/admin/dashboard/pagamentos/onboarding`

4. **Corrigido imports** em arquivos novos para usar caminhos relativos corretos

## Configurações do Stripe Express

Com contas Express:
- **Parceiro paga taxas do Stripe** (~2.9% + R$ 0,29)
- **Plataforma recebe application fee** sem deduções
- **Dashboard limitado** para parceiros
- **Onboarding automático** gerenciado pelo Stripe

## Próximos Passos

1. Testar criação de conta conectada
2. Verificar se o onboarding funciona corretamente
3. Confirmar que as taxas são aplicadas conforme esperado 