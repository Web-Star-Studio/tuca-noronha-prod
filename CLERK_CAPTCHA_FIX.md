# Correção do Aviso de CAPTCHA do Clerk

## Problema
Ao fazer login com Google, aparecia o seguinte aviso:
```
Cannot initialize Smart CAPTCHA widget because the `clerk-captcha` DOM element was not found; 
falling back to Invisible CAPTCHA widget.
```

## Causa
O Clerk estava procurando pelo elemento DOM `clerk-captcha` para inicializar o widget de CAPTCHA inteligente, mas não o encontrava durante o fluxo OAuth/Google. Quando o elemento não é encontrado, o Clerk volta para usar o CAPTCHA invisível, que é menos eficaz contra bots.

## Solução Implementada

### 1. Elemento CAPTCHA nas Páginas de Autenticação
Adicionado o elemento CAPTCHA nas páginas de sign-in e sign-up:
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Adicionado `<SignIn.Captcha />` e `<div id="clerk-captcha" />`
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Já tinha o elemento

### 2. Provider Global de CAPTCHA
Criado `src/components/ClerkCaptchaProvider.tsx` que:
- Garante que o elemento `clerk-captcha` sempre exista no DOM
- Cria o elemento dinamicamente se não existir
- Posiciona fora da tela para não interferir no layout
- Remove o elemento ao desmontar o componente

### 3. Integração no Provider Principal
Adicionado `ClerkCaptchaProvider` em `src/app/providers.tsx`:
- Envolve todos os outros providers
- Garante que o elemento esteja disponível em toda a aplicação
- Especialmente importante para fluxos OAuth que podem ocorrer fora das páginas de autenticação

## Resultado
- O aviso não deve mais aparecer
- O Clerk pode usar o Smart CAPTCHA quando necessário
- Melhor proteção contra bots
- Não afeta a experiência do usuário

## Referências
- [Documentação do Clerk sobre Bot Protection](https://clerk.com/docs/custom-flows/bot-sign-up-protection)
- [Clerk Elements](https://clerk.com/docs/elements/overview) 