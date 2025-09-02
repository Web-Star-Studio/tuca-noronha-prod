import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// RAG instance with OpenAI embeddings
export const rag = new RAG(components.rag, {
  // Add filter names you might use when ingesting/searching
  filterNames: ["category", "contentType", "section", "chapter"],
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

// Enhanced AI Agent with threads, tools, and RAG integration
export const tucaGuideAgent = new Agent(components.agent, {
  name: "tucaGuideAgent",
  languageModel: openai.chat("gpt-4o-mini"),
  
  // System instructions for the Tuca Noronha guide assistant
  instructions: `Você é Tuca Noronha, um assistente especializado no guia completo de Fernando de Noronha. 
    
Você tem acesso a informações detalhadas sobre:
- Praias e atividades em Fernando de Noronha
- Hospedagem e onde ficar
- Gastronomia local e restaurantes
- História e cultura da ilha
- Dicas de planejamento de viagem
- Trilhas e passeios
- Mergulho e atividades aquáticas

Use suas ferramentas para buscar informações específicas quando necessário. 
Sempre responda de forma calorosa, pessoal e com as "Dicas do Tuca" quando apropriado.
Mantenha o tom amigável e local, como se fosse o próprio Tuca falando.`,

  // Tools for enhanced functionality
  tools: {
    // Tool-based RAG for dynamic context search
    searchGuideContext: createTool({
      description: "Buscar informações específicas no guia de Fernando de Noronha baseado na pergunta do usuário",
      args: z.object({ 
        query: z.string().describe("Descreva o contexto que você está procurando no guia")
      }),
      handler: async (ctx, { query }): Promise<string> => {
        const context = await rag.search(ctx, { 
          namespace: "tuca-guide", 
          query,
          limit: 8,
          chunkContext: { before: 2, after: 1 }
        });
        return context.text || "Nenhuma informação específica encontrada no guia.";
      },
    }),

    // Tool for searching specific sections
    searchBySection: createTool({
      description: "Buscar informações em seções específicas do guia (praias, restaurantes, atividades, etc.)",
      args: z.object({ 
        section: z.enum(["praias", "restaurantes", "atividades", "hospedagem", "planejamento", "historia", "cultura", "trilhas", "mergulho"]).describe("Seção específica para buscar"),
        query: z.string().describe("O que buscar nesta seção")
      }),
      handler: async (ctx, { section, query }): Promise<string> => {
        const context = await rag.search(ctx, {
          namespace: "tuca-guide",
          query,
          limit: 5,
          chunkContext: { before: 1, after: 1 }
        });
        return context.text || `Nenhuma informação encontrada na seção ${section}.`;
      },
    }),
  },
});
