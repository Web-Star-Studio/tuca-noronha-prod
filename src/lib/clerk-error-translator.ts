/**
 * Traduz erros do Clerk para Português
 * 
 * Baseado na documentação do Clerk sobre erros:
 * https://clerk.com/docs/custom-flows/error-handling
 */

export interface ClerkError {
  code?: string;
  message?: string;
  longMessage?: string;
  meta?: {
    paramName?: string;
  };
}

/**
 * Mapa de traduções de erros comuns do Clerk
 */
const errorTranslations: Record<string, string> = {
  // Erros de formulário
  "form_identifier_not_found": "Email não encontrado. Verifique se está cadastrado.",
  "form_password_incorrect": "Senha incorreta. Tente novamente.",
  "form_username_invalid_length": "Nome de usuário deve ter entre 4 e 64 caracteres.",
  "form_username_invalid_character": "Nome de usuário contém caracteres inválidos.",
  "form_param_nil": "Este campo é obrigatório.",
  "form_param_missing": "Este campo é obrigatório.",
  "form_param_format_invalid": "Formato inválido. Verifique o valor informado.",
  "form_param_value_invalid": "Valor inválido para este campo.",
  "form_param_max_length_exceeded": "Valor muito longo para este campo.",
  "form_param_min_length_not_met": "Valor muito curto para este campo.",
  
  // Erros de senha
  "form_password_pwned": "Esta senha foi comprometida. Escolha outra senha mais segura.",
  "form_password_length_too_short": "Senha muito curta. Use no mínimo 8 caracteres.",
  "form_password_not_strong_enough": "Senha fraca. Use letras, números e caracteres especiais.",
  "form_password_validation_failed": "Senha não atende aos requisitos de segurança.",
  "password_invalid": "Senha inválida. Verifique e tente novamente.",
  
  // Erros de email
  "form_identifier_exists": "Este email já está cadastrado. Faça login ou use outro email.",
  "form_param_format_invalid_email": "Email inválido. Verifique o formato (exemplo@dominio.com).",
  "email_address_not_found": "Email não encontrado em nossos registros.",
  "email_address_exists": "Este email já está em uso.",
  
  // Erros de código de verificação
  "form_code_incorrect": "Código incorreto. Verifique o código enviado ao seu email.",
  "verification_expired": "Código expirado. Solicite um novo código.",
  "verification_failed": "Falha na verificação. Tente novamente.",
  
  // Erros de autenticação
  "session_exists": "Você já está conectado.",
  "not_allowed_access": "Acesso não permitido. Entre em contato com o suporte.",
  "oauth_access_denied": "Acesso negado. Você precisa autorizar o acesso.",
  "clerk_account_exists_different_auth_method": "Já existe uma conta com este email usando outro método de login.",
  
  // Erros de limite de taxa
  "too_many_requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "rate_limit_exceeded": "Limite de tentativas excedido. Aguarde um momento.",
  
  // Erros de rede
  "network_error": "Erro de conexão. Verifique sua internet e tente novamente.",
  "server_error": "Erro no servidor. Tente novamente em alguns instantes.",
  
  // Erros gerais
  "bad_request": "Requisição inválida. Verifique os dados informados.",
  "resource_not_found": "Recurso não encontrado.",
  "unauthorized": "Não autorizado. Faça login para continuar.",
  "forbidden": "Acesso negado. Você não tem permissão para esta ação.",
};

/**
 * Palavras-chave para identificar tipos de erro
 */
const keywordTranslations: Record<string, string> = {
  "password": "senha",
  "email": "email",
  "username": "nome de usuário",
  "code": "código",
  "verification": "verificação",
  "blocked": "bloqueado",
  "locked": "bloqueado",
  "expired": "expirado",
  "invalid": "inválido",
  "incorrect": "incorreto",
  "not found": "não encontrado",
  "already exists": "já existe",
  "too short": "muito curto",
  "too long": "muito longo",
  "required": "obrigatório",
};

/**
 * Traduz um erro do Clerk para português
 */
export function translateClerkError(error: ClerkError | Error | any): string {
  // Se for um erro padrão do JS
  if (error instanceof Error) {
    return translateGenericError(error.message);
  }

  // Se for um erro do Clerk com código
  if (error?.code) {
    const translated = errorTranslations[error.code];
    if (translated) {
      return translated;
    }
  }

  // Se tiver longMessage, tentar traduzir
  if (error?.longMessage) {
    return translateGenericError(error.longMessage);
  }

  // Se tiver message, tentar traduzir
  if (error?.message) {
    return translateGenericError(error.message);
  }

  // Mensagem padrão
  return "Ocorreu um erro. Por favor, tente novamente.";
}

/**
 * Traduz erros genéricos baseados em palavras-chave
 */
function translateGenericError(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Verificar traduções diretas
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Verificar palavras-chave e tentar criar uma tradução
  for (const [keyword, translation] of Object.entries(keywordTranslations)) {
    if (lowerMessage.includes(keyword)) {
      if (lowerMessage.includes("invalid")) {
        return `${translation.charAt(0).toUpperCase() + translation.slice(1)} inválido(a).`;
      }
      if (lowerMessage.includes("required")) {
        return `${translation.charAt(0).toUpperCase() + translation.slice(1)} é obrigatório(a).`;
      }
      if (lowerMessage.includes("incorrect") || lowerMessage.includes("wrong")) {
        return `${translation.charAt(0).toUpperCase() + translation.slice(1)} incorreto(a).`;
      }
      if (lowerMessage.includes("not found") || lowerMessage.includes("couldn't be found")) {
        return `${translation.charAt(0).toUpperCase() + translation.slice(1)} não encontrado(a).`;
      }
      if (lowerMessage.includes("already exists") || lowerMessage.includes("taken")) {
        return `${translation.charAt(0).toUpperCase() + translation.slice(1)} já existe.`;
      }
    }
  }

  // Se não encontrou tradução específica, retornar mensagem genérica
  return "Ocorreu um erro. Por favor, verifique os dados e tente novamente.";
}

/**
 * Extrai erros de arrays de erros do Clerk
 */
export function extractClerkErrorMessage(errors: ClerkError[]): string {
  if (!errors || errors.length === 0) {
    return "Ocorreu um erro. Por favor, tente novamente.";
  }

  // Pegar o primeiro erro
  const firstError = errors[0];
  return translateClerkError(firstError);
}

/**
 * Hook para usar nos componentes
 */
export function useClerkErrorTranslator() {
  const translateError = (error: any): string => {
    // Se for um objeto com errors (resposta da API do Clerk)
    if (error?.errors && Array.isArray(error.errors)) {
      return extractClerkErrorMessage(error.errors);
    }

    // Se for um erro direto
    return translateClerkError(error);
  };

  return { translateError };
}
