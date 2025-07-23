# Correção de Overlay "Fantasma" em Modais

## Problema Identificado

Quando modais (Dialog) eram fechados na aplicação, especialmente na página `/admin/dashboard/cupons/`, a tela ficava "não clicável" com apenas o elemento `<html>` sendo selecionável no inspetor. Isso indicava a presença de um overlay invisível bloqueando a interação.

## Possíveis Causas

1. **Radix UI Dialog Overlay não sendo removido corretamente**
2. **Conflitos de z-index entre componentes**  
3. **Body scroll lock não sendo liberado**
4. **Animações não completando adequadamente**
5. **Event propagation issues**

## Solução Implementada

### 1. Melhorias no Componente Dialog (`src/components/ui/dialog.tsx`)

- **Cleanup automático**: Adicionado `useEffect` no `DialogContent` para limpar scroll locks residuais
- **Animation fill mode**: Adicionado `animationFillMode: 'forwards'` para garantir que animações completem
- **Event handling**: Melhorado `onCloseAutoFocus` e `onPointerDownOutside`

```typescript
// Effect para garantir limpeza do body scroll lock
React.useEffect(() => {
  return () => {
    const body = document.body;
    const html = document.documentElement;
    
    // Remover classes que podem estar bloqueando o scroll
    body.style.removeProperty('overflow');
    body.style.removeProperty('padding-right');
    html.style.removeProperty('overflow');
    
    // Remover atributos data que podem estar interferindo
    body.removeAttribute('data-scroll-locked');
    body.removeAttribute('data-radix-scroll-lock-disabled');
    
    // Forçar reflow
    body.offsetHeight;
  };
}, []);
```

### 2. Hook Personalizado (`src/hooks/use-modal-cleanup.ts`)

Criado hook `useModalCleanup` para gerenciar adequadamente a limpeza de modais:

```typescript
export function useModalCleanup(isOpen: boolean) {
  const cleanupModal = useCallback(() => {
    setTimeout(() => {
      // Limpar overlays órfãos, scroll locks, etc.
    }, 300); // Aguardar animações do Radix
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupModal();
    }
  }, [isOpen, cleanupModal]);
}
```

### 3. Estilos CSS Adicionais (`src/app/globals.css`)

```css
/* Dialog overlay fixes para prevenir overlay "fantasma" */
[data-radix-dialog-overlay] {
  pointer-events: auto !important;
}

[data-radix-dialog-overlay][data-state="closed"] {
  pointer-events: none !important;
  opacity: 0 !important;
  animation-fill-mode: forwards !important;
}

/* Garantir que portals vazios não interfiram */
[data-radix-portal]:empty {
  display: none !important;
  pointer-events: none !important;
}
```

### 4. Botão de Emergência (`src/components/ui/modal-cleanup-button.tsx`)

Para desenvolvimento e casos extremos, criado botão que força limpeza de overlays órfãos:

```typescript
export function EmergencyModalCleanupButton() {
  const { forceCleanup } = useForceModalCleanup();
  // Remove todos os overlays, scroll locks e portals órfãos
}
```

### 5. Melhorias nos Handlers de Modal

No `CouponsGrid.tsx` e outros componentes que usam modais:

```typescript
// Aguardar um frame antes de fechar para garantir estado atualizado
const handleCreateCoupon = async (data: any) => {
  try {
    await createCoupon(data);
    await new Promise(resolve => requestAnimationFrame(resolve));
    setIsCreateDialogOpen(false);
  } catch (error) {
    // tratamento de erro
  }
};
```

## Como Usar

### Para Desenvolvedores

1. **Usar o hook** em componentes com modais:
```typescript
import { useModalCleanup } from "@/hooks/use-modal-cleanup";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  useModalCleanup(isOpen); // Automatiza a limpeza
}
```

2. **Botão de emergência** (apenas em desenvolvimento):
```typescript
import { EmergencyModalCleanupButton } from "@/components/ui/modal-cleanup-button";

// Aparece apenas em dev mode
{process.env.NODE_ENV === 'development' && (
  <EmergencyModalCleanupButton />
)}
```

### Para Usuários Finais

Se a tela ficar "travada" após fechar um modal:

1. **Tente pressionar ESC** para fechar qualquer modal aberto
2. **Recarregue a página** como último recurso
3. **Em dev mode**: Use o botão "Emergência" que aparece na interface

## Prevenção

Para eviter o problema em novos componentes:

1. **Sempre use o hook `useModalCleanup`** em componentes com modais
2. **Aguarde um frame** antes de alterar estado de modal nos handlers
3. **Teste fechamento** por múltiplos métodos (ESC, clique fora, botão X)
4. **Monitore elementos órfãos** no dev tools

## Teste da Correção

1. Abrir `/admin/dashboard/cupons/`
2. Clicar em "Editar" em qualquer cupom
3. Fechar o modal (ESC, clique fora, ou botão X)
4. Verificar se a tela continua clicável
5. Repetir várias vezes para garantir robustez

A correção foi testada e resolve o problema de overlay "fantasma" que bloqueava a interação após fechar modais. 