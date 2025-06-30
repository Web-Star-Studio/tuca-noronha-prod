import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Registrar configuração do servidor Node.js
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  // Registrar configuração do Edge Runtime
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura de erros de componentes React Server (Next.js 15+)
export const onRequestError = Sentry.captureRequestError; 