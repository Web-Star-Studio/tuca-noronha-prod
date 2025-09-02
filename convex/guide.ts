import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { rag, tucaGuideAgent } from "./ai";
import { openai } from "@ai-sdk/openai";

export const addSection = mutation({
  args: {
    sectionTitle: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("guideContent", {
      sectionTitle: args.sectionTitle,
      content: args.content,
      tags: args.tags,
    });
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("guideContent")
      .withSearchIndex("by_content", (q) => q.search("content", args.query))
      .collect();
    return results;
  },
});

// Ingest a guide section into the RAG index for semantic search
export const ingestGuideSectionToRAG = action({
  args: {
    sectionTitle: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    section: v.optional(v.string()),
    chapter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Split content into paragraph chunks (skip empties)
    const chunks = args.content
      .split(/\n{2,}/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const filterValues = [
      { name: "category", value: "guide" },
      { name: "contentType", value: "text/markdown" },
    ];

    if (args.section) {
      filterValues.push({ name: "section", value: args.section });
    }

    if (args.chapter) {
      filterValues.push({ name: "chapter", value: args.chapter });
    }

    await rag.add(ctx, {
      namespace: "tuca-guide",
      key: args.sectionTitle,
      chunks,
      filterValues,
    });
    return { success: true, chunksIngested: chunks.length };
  },
});

// Create a new thread for the enhanced AI agent
export const createThread = action({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { threadId } = await tucaGuideAgent.createThread(ctx, {
      userId: args.userId,
      title: args.title || "Chat com Tuca Noronha",
    });
    return { threadId, success: true };
  },
});

// Continue a thread conversation (simplified approach to avoid validation issues)
export const askGuideWithThread = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Use direct RAG search instead of full agent to avoid validation issues
      const context = await rag.search(ctx, { 
        namespace: "tuca-guide", 
        query: args.prompt,
        limit: 8,
        chunkContext: { before: 2, after: 1 }
      });

      // Generate response using OpenAI directly with the retrieved context
      const { generateText } = await import("ai");
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: `Você é Tuca Noronha, um assistente especializado no guia completo de Fernando de Noronha. 
        
Você tem acesso a informações detalhadas sobre:
- Praias e atividades em Fernando de Noronha
- Hospedagem e onde ficar
- Gastronomia local e restaurantes
- História e cultura da ilha
- Dicas de planejamento de viagem
- Trilhas e passeios
- Mergulho e atividades aquáticas

Use o contexto fornecido para responder de forma calorosa, pessoal e com as "Dicas do Tuca" quando apropriado.
Mantenha o tom amigável e local, como se fosse o próprio Tuca falando.

Contexto do guia:
${context.text || "Nenhum contexto específico encontrado."}`,
        prompt: args.prompt,
      });

      return { 
        answer: result.text, 
        threadId: args.threadId,
        success: true 
      };
    } catch (error) {
      console.error("Error in askGuideWithThread:", error);
      throw error;
    }
  },
});

// List messages in a thread
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: v.optional(v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 50 };
    // Fix cursor type issue by handling undefined
    const fixedPaginationOpts = {
      ...paginationOpts,
      cursor: paginationOpts.cursor || null
    };
    
    const messages = await tucaGuideAgent.listMessages(ctx, { 
      threadId: args.threadId,
      paginationOpts: fixedPaginationOpts 
    });
    return messages;
  },
});

// Legacy function for backwards compatibility
export const askGuide = action({
  args: {
    prompt: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Create a temporary thread for one-off questions
    const { threadId } = await tucaGuideAgent.createThread(ctx, {
      title: "Consulta rápida"
    });

    const { thread } = await tucaGuideAgent.continueThread(ctx, { threadId });
    const result = await thread.generateText({ 
      prompt: args.prompt,
    });

    return { 
      answer: result.text, 
      context: null // Legacy compatibility
    };
  },
});
