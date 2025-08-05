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
    const convexUserId = await convex.query(api.domains.users.queries.getUserByClerkId, { clerkId });
    console.log("API: Convex response:", convexUserId);
    
    if (!convexUserId) {
      console.log("API: User not found, suggesting manual sync");
      
      // If user not found, suggest client to perform a manual sync
      return NextResponse.json(
        { error: 'User not found', needsSync: true },
        { status: 404 }
      );
    }
    
    // Return the Convex user ID
    return NextResponse.json({ userId: convexUserId });
  } catch {
    console.error('Error resolving user ID:', error);
    return NextResponse.json(
      { error: 'Failed to resolve user ID', details: String(error) },
      { status: 500 }
    );
  }
}
