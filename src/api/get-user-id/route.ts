import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

// Create a Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * API endpoint to resolve a Clerk ID to a Convex user ID
 */
export async function GET(request: NextRequest) {
  try {
    // Get the clerkId from query parameters
    const clerkId = request.nextUrl.searchParams.get('clerkId');
    
    if (!clerkId) {
      console.log("API: Missing clerkId parameter");
      return NextResponse.json(
        { error: 'Missing clerkId parameter' },
        { status: 400 }
      );
    }
    
    console.log("API: Fetching user with clerkId", clerkId);
    
    // Query Convex to find the user with the given clerkId
    const convexUserId = await convex.query(api.auth.getUserByClerkId, { clerkId });
    console.log("API: Convex response:", convexUserId);
    
    if (!convexUserId) {
      console.log("API: User not found, trying to trigger user sync");
      
      // Se o usuário não for encontrado, tenta forçar uma sincronização com o Clerk
      try {
        // Testar apenas a consulta para verificar se a conexão com o Convex está funcionando
        const testResponse = await convex.query(api.auth.getUser, {});
        console.log("API: Test query response:", testResponse);
        
        return NextResponse.json(
          { error: 'User not found', details: 'Convex connection is working but user ID not found' },
          { status: 404 }
        );
      } catch (testError) {
        console.error("API: Error during test query:", testError);
        return NextResponse.json(
          { error: 'Connection test failed', details: String(testError) },
          { status: 500 }
        );
      }
    }
    
    // Return the Convex user ID
    return NextResponse.json({ userId: convexUserId });
  } catch (error) {
    console.error('Error resolving user ID:', error);
    return NextResponse.json(
      { error: 'Failed to resolve user ID', details: String(error) },
      { status: 500 }
    );
  }
}
