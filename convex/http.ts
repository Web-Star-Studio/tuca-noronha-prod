import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { handleStripeWebhook, testWebhook } from "./domains/stripe/webhooks";
import { handleMercadoPagoWebhook, testWebhook as testMpWebhook } from "./domains/mercadoPago/webhooks";

// Tipo para os eventos do webhook Clerk
type ClerkWebhookEvent = {
  data: {
    id: string;
    email_addresses?: {
      email_address: string;
      id: string;
      verification: {
        status: string;
      };
    }[];
    phone_numbers?: {
      phone_number: string;
      id: string;
      verification: {
        status: string;
      };
    }[];
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    profile_image_url?: string;
    created_at: number;
    updated_at: number;
  };
  object: string;
  type: string; // 'user.created', 'user.updated', 'user.deleted'
};

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Extrair os dados da requisição
      const payload = await request.json();
      
      // Em produção, você deveria validar as assinaturas aqui com a chave secreta do Clerk
      // Exemplo: usar svix para validar o webhook
      
      // Processar o evento diretamente
      const event = payload as ClerkWebhookEvent;
      console.log(`Received Clerk webhook event: ${event.type}`);
      
      if (event.type === "user.created" || event.type === "user.updated") {
        const clerkUser = event.data;
        const email = clerkUser.email_addresses?.[0]?.email_address;
        const phone = clerkUser.phone_numbers?.[0]?.phone_number;
        const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") || clerkUser.username;
        const image = clerkUser.image_url || clerkUser.profile_image_url;
        
        console.log(`Syncing user with ID: ${clerkUser.id}, email: ${email || 'not provided'}`);
        
        // Criar os argumentos para a mutation syncUser
        const args = {
          clerkId: clerkUser.id,
          email,
          name: name || undefined,
          image: image || undefined,
          phone: phone || undefined,
          createdAt: clerkUser.created_at,
          updatedAt: clerkUser.updated_at,
        };
        
        // Chamar a mutation diretamente passando a referência da função
        const result = await ctx.runMutation(internal.clerk.syncUser, args);
        console.log(`User sync result:`, result);
        
        return new Response(
          JSON.stringify({ success: true, message: "User synchronized" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      if (event.type === "user.deleted") {
        const clerkUser = event.data;
        const email = clerkUser.email_addresses?.[0]?.email_address;
        
        console.log(`Deleting user with ID: ${clerkUser.id}, email: ${email || 'not provided'}`);
        
        const args = {
          email,
          clerkId: clerkUser.id,
        };
        
        // Chamar a mutation diretamente
        const result = await ctx.runMutation(internal.clerk.deleteUser, args);
        console.log(`User deletion result:`, result);
        
        return new Response(
          JSON.stringify(result), // Result already has success and message properties
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      console.log(`Unhandled event type: ${event.type}`);
      return new Response(
        JSON.stringify({ success: false, message: "Unhandled event type" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Stripe webhook routes
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: handleStripeWebhook,
});

http.route({
  path: "/stripe/test-webhook",
  method: "POST",
  handler: testWebhook,
});

// Stripe Connect webhook endpoint
http.route({
  path: "/stripe/connect-webhook",
  method: "POST",
  handler: handleStripeWebhook, // Reutiliza o mesmo handler, mas pode ser configurado com eventos diferentes no Stripe Dashboard
});

// Mercado Pago webhook routes
http.route({
  path: "/mercadopago/webhook",
  method: "POST",
  handler: handleMercadoPagoWebhook,
});

http.route({
  path: "/mercadopago/test-webhook",
  method: "POST",
  handler: testMpWebhook,
});

export default http;