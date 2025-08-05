import { useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar adequadamente a limpeza de modais
 * Previne problemas de overlay "fantasma" e tela não clicável
 */
export function useModalCleanup(isOpen: boolean) {
  // Função para limpar qualquer overlay residual
  const cleanupModal = useCallback(() => {
    // Aguardar animações terminarem
    setTimeout(() => {
      const body = document.body;
      const html = document.documentElement;
      
      // Remover estilos que podem estar bloqueando a interação
      body.style.removeProperty('overflow');
      body.style.removeProperty('padding-right');
      body.style.removeProperty('pointer-events');
      html.style.removeProperty('overflow');
      
      // Remover atributos data do Radix
      body.removeAttribute('data-scroll-locked');
      body.removeAttribute('data-radix-scroll-lock-disabled');
      body.removeAttribute('data-radix-popper-content-wrapper');
      
      // Procurar e remover overlays órfãos
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      overlays.forEach(overlay => {
        if (overlay.getAttribute('data-state') === 'closed') {
          overlay.remove();
        }
      });
      
      // Procurar e remover portals órfãos
      const portals = document.querySelectorAll('[data-radix-portal]');
      portals.forEach(portal => {
        if (!portal.children.length) {
          portal.remove();
        }
      });
      
      // Forçar reflow
      void body.offsetHeight;
    }, 300); // Aguardar tempo suficiente para animações do Radix
  }, []);

  // Cleanup quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      cleanupModal();
    }
  }, [isOpen, cleanupModal]);

  // Cleanup no unmount do componente
  useEffect(() => {
    return () => {
      cleanupModal();
    };
  }, [cleanupModal]);

  return { cleanupModal };
}

/**
 * Hook para forçar limpeza de todos os modais (para casos extremos)
 */
export function useForceModalCleanup() {
  const forceCleanup = useCallback(() => {
    const body = document.body;
    const html = document.documentElement;
    
    // Remover todos os estilos que podem estar interferindo
    body.style.removeProperty('overflow');
    body.style.removeProperty('padding-right');
    body.style.removeProperty('pointer-events');
    body.style.removeProperty('position');
    html.style.removeProperty('overflow');
    
    // Remover todos os atributos relacionados a modais
    const attributes = [
      'data-scroll-locked',
      'data-radix-scroll-lock-disabled',
      'data-radix-popper-content-wrapper',
      'data-overlay-container'
    ];
    
    attributes.forEach(attr => {
      body.removeAttribute(attr);
      html.removeAttribute(attr);
    });
    
    // Remover todos os overlays e portals órfãos
    const selectors = [
      '[data-radix-dialog-overlay]',
      '[data-radix-portal]:empty',
      '[data-overlay-container]:empty',
      '.fixed.inset-0.z-50.bg-black'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        try {
          element.remove();
        } catch {
          // Ignorar erros de elementos já removidos
        }
      });
    });
    
    // Reativar pointer events em todos os elementos
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      const el = element as HTMLElement;
      if (el.style.pointerEvents === 'none') {
        el.style.removeProperty('pointer-events');
      }
    });
    
    // Forçar reflow
    void body.offsetHeight;
  }, []);

  return { forceCleanup };
} 