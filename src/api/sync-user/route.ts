import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

// Create a Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * API endpoint to manually sync a user from Clerk to Convex
 * Should be called when a user is not found in Convex
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user data from the request body
    const userData = await request.json();
    
    if (!userData.clerkId) {
      return NextResponse.json(
        { error: 'Missing clerkId in request body' },
        { status: 400 }
      );
    }
    
    console.log("API: Manual sync request for user:", userData.clerkId);
    
    // Check if the user already exists in Convex
    const existingUser = await convex.query(api.domains.users.queries.getUserByClerkId, { 
      clerkId: userData.clerkId 
    });
    
    if (existingUser) {
      console.log("API: User already exists in Convex:", existingUser);
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists in Convex',
        userId: existingUser 
      });
    }
    
    // Prepare data for user creation
    const syncArgs = {
      clerkId: userData.clerkId,
      email: userData.email,
      name: userData.name || undefined,
      image: userData.image || undefined,
      phone: userData.phone || undefined,
      createdAt: userData.createdAt || Date.now(),
      updatedAt: userData.updatedAt || Date.now(),
    };
    
    console.log("API: Creating user in Convex with data:", syncArgs);
    
    // Create the user in Convex using the domain mutation
    try {
      const newUserId = await convex.mutation(api.domains.users.mutations.createUser, syncArgs);
      
      console.log("API: User successfully created in Convex:", newUserId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'User successfully created in Convex',
        userId: newUserId 
      });
    } catch (syncError) {
      console.error("API: Error creating user in Convex:", syncError);
      return NextResponse.json(
        { error: 'Failed to create user in Convex', details: String(syncError) },
        { status: 500 }
      );
    }
  } catch {
    console.error('Error in sync-user API:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
} 