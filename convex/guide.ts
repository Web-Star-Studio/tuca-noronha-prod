import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { rag } from "./ai";
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
  },
  handler: async (ctx, args) => {
    // Split content into paragraph chunks (skip empties)
    const chunks = args.content
      .split(/\n{2,}/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await rag.add(ctx, {
      namespace: "tuca-guide",
      key: args.sectionTitle,
      chunks,
      filterValues: [
        { name: "category", value: "guide" },
        { name: "contentType", value: "text/markdown" },
      ],
    });
    return null;
  },
});

// Ask a question about the guide using RAG-augmented generation
export const askGuide = action({
  args: {
    prompt: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { text, context } = await rag.generateText(ctx, {
      search: {
        namespace: "tuca-guide",
        limit: args.limit ?? 8,
        chunkContext: { before: 1, after: 1 },
      },
      prompt: args.prompt,
      model: openai.chat("gpt-4o-mini"),
    });
    return { answer: text, context };
  },
});
