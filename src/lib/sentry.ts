import * as Sentry from "@sentry/nextjs";

/**
 * Captura exceção com contexto adicional
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext("additional_info", context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Adiciona breadcrumb para rastreamento de ações do usuário
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    timestamp: Date.now() / 1000,
    data,
  });
}

/**
 * Define o contexto do usuário no Sentry
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  name?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.name,
  });
}

/**
 * Limpa o contexto do usuário (logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Captura mensagem personalizada
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
) {
  Sentry.captureMessage(message, level);
}

/**
 * Monitora performance de operações
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Wrapper para operações assíncronas com tratamento de erro
 */
export async function withSentry<T>(
  operation: () => Promise<T>,
  context?: {
    name: string;
    op?: string;
    data?: Record<string, any>;
  }
): Promise<T> {
  const span = context ? startTransaction(context.name, context.op || "operation") : null;
  
  try {
    if (context?.data) {
      addBreadcrumb(`Starting ${context.name}`, context.op || "operation", context.data);
    }
    
    const result = await operation();
    
    if (context) {
      addBreadcrumb(`Completed ${context.name}`, context.op || "operation", { success: true });
    }
    
    return result;
  } catch {
    captureException(error, context?.data);
    throw error;
  } finally {
    span?.end();
  }
}

/**
 * Hook para integração com React
 */
export function useSentryUser(user: any) {
  if (user) {
    setUser({
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      username: user.username,
    });
  } else {
    clearUser();
  }
} 