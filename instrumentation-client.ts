import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2fa855a9b2e6ddf31610e9bf6251478f@o4509588857421824.ingest.us.sentry.io/4509588910243840",

  // Adiciona headers de requisição e IP dos usuários
  sendDefaultPii: true,

  // Performance monitoring
  // Ajuste este valor em produção - 1.0 captura 100%
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Session Replay
  integrations: [
    Sentry.replayIntegration({
      // Mascarar todos os textos por padrão
      maskAllText: true,
      // Bloquear todas as mídias
      blockAllMedia: true,
    }),
    // User Feedback
    Sentry.feedbackIntegration({
      colorScheme: "system",
      showBranding: false,
      buttonLabel: "Reportar problema",
      submitButtonLabel: "Enviar",
      messagePlaceholder: "Descreva o que aconteceu...",
      successMessageText: "Obrigado pelo feedback!",
    }),
  ],

  // Captura Replay para 10% de todas as sessões,
  // e 100% das sessões com erro
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filtros de erro
  beforeSend(event, hint) {
    // Ignorar erros de desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry error:", hint.originalException);
      return null;
    }
    
    // Ignorar erros específicos
    const error = hint.originalException;
    if (error && error instanceof Error) {
      // Ignorar erros de rede/CORS
      if (error.message?.includes("NetworkError") || 
          error.message?.includes("CORS")) {
        return null;
      }
      
      // Ignorar erros de extensões do navegador
      if (error.stack?.includes("chrome-extension://") ||
          error.stack?.includes("moz-extension://")) {
        return null;
      }
    }
    
    return event;
  },

  // Ambiente
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  
  // Tags globais
  initialScope: {
    tags: {
      next_runtime: "client",
    },
  },
});

// Exportar para instrumentação de navegação do roteador
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart; 