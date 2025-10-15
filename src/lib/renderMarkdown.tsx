import React from "react";

/**
 * Renderiza texto markdown de forma legível, removendo asteriscos e formatando listas
 */
export function renderMarkdownText(text: string | null | undefined): React.ReactElement | null {
  if (!text) return null;
  
  return (
    <>
      {text.split('\n').map((line, index) => {
        // Remove asteriscos duplos (negrito)
        const processedLine = line.replace(/\*\*([^*]+)\*\*/g, '$1');
        
        // Identifica se é um item de lista
        const isListItem = processedLine.trim().startsWith('- ');
        
        if (isListItem) {
          // Remove o "- " e processa como item de lista
          const content = processedLine.trim().substring(2);
          return (
            <div key={index} className="flex gap-2 mb-1">
              <span className="text-gray-400">•</span>
              <span className="flex-1">{content}</span>
            </div>
          );
        } else if (processedLine.trim()) {
          // Linha normal de texto
          return (
            <p key={index} className="mb-2">{processedLine}</p>
          );
        } else {
          // Linha vazia
          return <div key={index} className="h-2" />;
        }
      })}
    </>
  );
}
