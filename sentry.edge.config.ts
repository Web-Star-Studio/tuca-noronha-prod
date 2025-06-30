import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2fa855a9b2e6ddf31610e9bf6251478f@o4509588857421824.ingest.us.sentry.io/4509588910243840",

  // Performance monitoring para Edge
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Configurações de ambiente
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  
  // Tags globais para Edge Runtime
  initialScope: {
    tags: {
      next_runtime: "edge",
    },
  },

  // Filtros de erro para Edge
  beforeSend(event, hint) {
    // Ignorar erros de desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry edge error:", hint.originalException);
      return null;
    }
    
    // Ignorar erros específicos do Edge
    const error = hint.originalException;
    if (error && error instanceof Error) {
      // Ignorar erros de rate limiting
      if (error.message?.includes("rate limit") || 
          error.message?.includes("quota")) {
        return null;
      }
    }
    
    return event;
  },

  // Integração específica para Edge Runtime
  integrations: [
    // HTTP tracking para Edge
    Sentry.httpIntegration({
      breadcrumbs: true,
    }),
  ],
}); 