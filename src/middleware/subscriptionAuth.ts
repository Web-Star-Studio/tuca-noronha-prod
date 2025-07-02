import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware para verificar se o usuário tem uma assinatura ativa do guia
 */
export async function subscriptionMiddleware(request: NextRequest) {
  // Lista de rotas protegidas que requerem assinatura
  const protectedRoutes = [
    "/meu-painel/guia",
  ];

  // Verifica se a rota atual requer assinatura
  const pathname = request.nextUrl.pathname;
  const requiresSubscription = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!requiresSubscription) {
    return NextResponse.next();
  }

  // Se requer assinatura, redireciona para a página de checkout
  const checkoutUrl = new URL("/guia-assinatura", request.url);
  checkoutUrl.searchParams.set("redirect", pathname);
  
  // Adiciona header para indicar que precisa verificar assinatura no cliente
  const response = NextResponse.redirect(checkoutUrl);
  response.headers.set("x-subscription-check", "true");
  
  return response;
}

/**
 * Config para rotas que requerem assinatura
 */
export const subscriptionConfig = {
  // Rotas que requerem assinatura ativa
  protectedRoutes: [
    "/meu-painel/guia",
  ],
  
  // URL de redirect para checkout
  checkoutPath: "/guia-assinatura",
  
  // URL de sucesso após pagamento
  successPath: "/meu-painel/guia",
  
  // URL de cancelamento
  cancelPath: "/",
}; 