/**
 * Button Examples - Demonstração de Padrões de Botão
 * 
 * Este arquivo demonstra as melhores práticas para implementar botões
 * que seguem o padrão shadcnUI com hover states e cursor pointer apropriados.
 */

import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { buttonStyles } from '@/lib/ui-config';
import { Heart, Star, Edit, Trash2, ExternalLink } from 'lucide-react';

export function ButtonExamples() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Botões Padrão shadcnUI</h2>
        <p className="text-gray-600 mb-6">
          Use o componente Button sempre que possível. Ele já inclui cursor-pointer, 
          hover states e transições suaves.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Botão Padrão</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Sucesso</Button>
          <Button variant="warning">Atenção</Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Botões com Ícones</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Botões Customizados (Quando Necessário)</h2>
        <p className="text-gray-600 mb-6">
          Use apenas quando o componente Button padrão não atender às necessidades.
          Sempre inclua as classes essenciais demonstradas abaixo.
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Botão de Ação Circular</h3>
            <div className="flex gap-4">
              <button 
                className={cn(
                  // Classes essenciais para botões customizados
                  "cursor-pointer transition-all duration-200 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-offset-2",
                  // Estilo específico
                  "flex items-center justify-center h-10 w-10 rounded-full",
                  "bg-blue-50 text-blue-500 hover:bg-blue-100 hover:shadow-md",
                  "hover:scale-105 active:scale-95",
                  "focus-visible:ring-blue-500"
                )}
                aria-label="Curtir"
              >
                <Heart className="h-4 w-4" />
              </button>

              <button 
                className={cn(
                  "cursor-pointer transition-all duration-200 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-offset-2",
                  "flex items-center justify-center h-10 w-10 rounded-full",
                  "bg-amber-50 text-amber-500 hover:bg-amber-100 hover:shadow-md",
                  "hover:scale-105 active:scale-95",
                  "focus-visible:ring-amber-500"
                )}
                aria-label="Favoritar"
              >
                <Star className="h-4 w-4" />
              </button>

              <button 
                className={cn(
                  "cursor-pointer transition-all duration-200 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-offset-2",
                  "flex items-center justify-center h-10 w-10 rounded-full",
                  "bg-red-50 text-red-500 hover:bg-red-100 hover:shadow-md",
                  "hover:scale-105 active:scale-95",
                  "focus-visible:ring-red-500"
                )}
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Botão de Status Toggle</h3>
            <button
              className={cn(
                "cursor-pointer transition-all duration-200 outline-none",
                "focus-visible:ring-2 focus-visible:ring-offset-2",
                "px-4 py-2 rounded-full text-sm font-medium",
                "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                "hover:shadow-md hover:scale-105 active:scale-95",
                "focus-visible:ring-emerald-500"
              )}
              aria-label="Toggle status ativo"
            >
              Ativo
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Link como Botão</h3>
            <a
              href="#"
              className={cn(
                "cursor-pointer transition-all duration-200 outline-none inline-flex items-center",
                "focus-visible:ring-2 focus-visible:ring-offset-2",
                "h-10 w-10 rounded-full justify-center",
                "bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:shadow-md",
                "hover:scale-105 active:scale-95",
                "focus-visible:ring-indigo-500"
              )}
              aria-label="Abrir link externo"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Classes Essenciais para Botões Customizados</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Classes Obrigatórias:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><code>cursor-pointer</code> - Cursor de pointer ao hover</li>
            <li><code>transition-all duration-200</code> - Transições suaves</li>
            <li><code>outline-none</code> - Remove outline padrão</li>
            <li><code>focus-visible:ring-2 focus-visible:ring-offset-2</code> - Focus acessível</li>
            <li><code>hover:scale-105 active:scale-95</code> - Feedback visual de interação</li>
            <li><code>hover:shadow-md</code> - Sombra no hover</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">Acessibilidade:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><code>aria-label</code> - Descrição para leitores de tela</li>
            <li><code>focus-visible:ring-[color]</code> - Anel de foco na cor apropriada</li>
            <li>Evite usar apenas <code>sr-only</code>, prefira <code>aria-label</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook utilitário para criar estilos de botão customizado
 */
export function useCustomButtonStyles(variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary') {
  const baseClasses = "cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-105 active:scale-95 hover:shadow-md";
  
  const variants = {
    primary: "bg-blue-50 text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-500",
    secondary: "bg-gray-50 text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-500",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus-visible:ring-emerald-500",
    warning: "bg-amber-50 text-amber-600 hover:bg-amber-100 focus-visible:ring-amber-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-500",
  };

  return cn(baseClasses, variants[variant]);
} 