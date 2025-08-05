import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { internal } from '../../../convex/_generated/api';
import { Webhook } from 'svix';

// Create a Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * Clerk webhook handler
 * Docs: https://clerk.com/docs/users/sync-data-to-your-backend
 */
export async function POST(request: NextRequest) {
  // Get the webhook signature from the headers
  const headerPayload = request.headers;
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');
  
  // If there's no signature, return 400
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers');
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }
  
  // Get the webhook secret from the environment
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  // Get the raw body
  let payload: string;
  try {
    payload = await request.text();
    
    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret);
    
    // Verify the webhook payload
    const evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
    
    // Handle the webhook event
    await handleWebhookEvent(evt);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Invalid webhook payload' },
      { status: 400 }
    );
  }
}

/**
 * Handle Clerk webhook events
 */
async function handleWebhookEvent(evt: WebhookEvent) {
  const eventType = evt.type;
  console.log(`Processing webhook event: ${eventType}`);
  
  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  } catch (error: unknown) {
    console.error(`Error handling ${eventType}:`, error);
    throw error;
  }
}

/**
 * Handle user.created event
 */
async function handleUserCreated(data: WebhookEvent['data']) {
  // Cast to UserJSON since we know this is a user.created event
  const userData = data as any; // Using any to bypass strict type checking for webhook data
  const { id, email_addresses, first_name, last_name, profile_image_url, phone_numbers, created_at } = userData;
  
  // Extract the primary email if available
  const primaryEmail = email_addresses
    ?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id)
    ?.email_address;
  
  // Extract the primary phone if available
  const primaryPhone = phone_numbers
    ?.find((phone: { id: string; phone_number: string }) => phone.id === data.primary_phone_number_id)
    ?.phone_number;
  
  // Generate the full name if available
  const name = first_name && last_name 
    ? `${first_name} ${last_name}` 
    : first_name || last_name || undefined;
  
  try {
    // Sync the user to Convex
    const result = await convex.mutation(internal.domains.users.mutations.syncUserFromClerk, {
      clerkId: id,
      email: primaryEmail,
      name,
      image: profile_image_url,
      phone: primaryPhone,
      createdAt: created_at ? Date.parse(created_at) : Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('User created in Convex:', result);
    
    // Após sincronizar usuário, marcar convites pendentes do e-mail como usados
    if (primaryEmail) {
      try {
        const count = await convex.mutation(
          internal.domains.rbac.mutations.markInvitesUsedByEmail,
          { email: primaryEmail }
        );
        console.log(`Marked ${count} invites used for email ${primaryEmail}`);
      } catch (err: unknown) {
        console.error('Error marking invites used:', err);
      }
    }
  } catch (error: unknown) {
    console.error('Error syncing user to Convex:', error);
    throw error;
  }
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data: WebhookEvent['data']) {
  const { id, email_addresses, first_name, last_name, profile_image_url, phone_numbers, updated_at } = data;
  
  // Extract the primary email if available
  const primaryEmail = email_addresses
    ?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id)
    ?.email_address;
  
  // Extract the primary phone if available
  const primaryPhone = phone_numbers
    ?.find((phone: { id: string; phone_number: string }) => phone.id === data.primary_phone_number_id)
    ?.phone_number;
  
  // Generate the full name if available
  const name = first_name && last_name 
    ? `${first_name} ${last_name}` 
    : first_name || last_name || undefined;
  
  try {
    // Update the user in Convex
    const result = await convex.mutation(internal.domains.users.mutations.syncUserFromClerk, {
      clerkId: id,
      email: primaryEmail,
      name,
      image: profile_image_url,
      phone: primaryPhone,
      updatedAt: updated_at ? Date.parse(updated_at) : Date.now(),
    });
    
    console.log('User updated in Convex:', result);
  } catch (error: unknown) {
    console.error('Error updating user in Convex:', error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data: WebhookEvent['data']) {
  const { id, email_addresses } = data;
  
  // Extract the primary email if available
  const primaryEmail = email_addresses
    ?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id)
    ?.email_address;
  
  try {
    // Delete the user from Convex
    const result = await convex.mutation(internal.domains.users.mutations.deleteUserFromClerk, {
      clerkId: id,
      email: primaryEmail,
    });
    
    console.log('User deleted from Convex:', result);
  } catch (error: unknown) {
    console.error('Error deleting user from Convex:', error);
    throw error;
  }
} 