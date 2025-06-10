import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { internal } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['traveler', 'partner', 'employee', 'master'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // TODO: Implement internal role update mutation
    // For now, return success without actually updating
    console.log(`Debug: Would update user ${userId} to role ${role}`);
    
    return NextResponse.json({ success: true, role, message: "Debug endpoint - role not actually updated" });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update role', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 