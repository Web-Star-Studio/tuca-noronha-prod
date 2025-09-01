import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";

// RAG instance with OpenAI embeddings
export const rag = new RAG(components.rag, {
  // Add filter names you might use when ingesting/searching
  filterNames: ["category", "contentType", "categoryAndType"],
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});
