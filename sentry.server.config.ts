import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2fa855a9b2e6ddf31610e9bf6251478f@o4509588857421824.ingest.us.sentry.io/4509588910243840",

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Adiciona informações contextuais do servidor
  sendDefaultPii: true,

  // Filtros de erro para servidor
  beforeSend(event, hint) {
    // Ignorar erros de desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry server error:", hint.originalException);
      return null;
    }
    
    // Ignorar erros específicos do servidor
    const error = hint.originalException;
    if (error && error instanceof Error) {
      // Ignorar erros de health checks
      if (error.message?.includes("health") || 
          error.message?.includes("ping")) {
        return null;
      }
    }
    
    return event;
  },

  // Configurações de ambiente
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  
  // Tags globais para o servidor
  initialScope: {
    tags: {
      next_runtime: "nodejs",
      node_version: process.version,
    },
  },

  // Integração com Convex e outras APIs
  integrations: [
    // Rastreamento de HTTP
    Sentry.httpIntegration({
      breadcrumbs: true,
    }),
    // Captura de exceções não tratadas
    Sentry.onUncaughtExceptionIntegration(),
    // Captura de promises rejeitadas
    Sentry.onUnhandledRejectionIntegration(),
  ],

  // Configurações de performance
  profilesSampleRate: 0.1, // Perfilamento em 10% das transações
  
  // Ignorar rotas específicas
  ignoreTransactions: [
    "/api/health",
    "/api/ping",
    "/_next",
    "/favicon.ico",
  ],
}); 