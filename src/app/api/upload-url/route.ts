import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();
    
    // Get upload URL from Convex media domain
    const uploadUrl = await convex.mutation(api.domains.media.mutations.generateUploadUrl);
    
    // Generate a storage ID for tracking
    const storageId = `${Date.now()}-${fileName}`;
    
    return NextResponse.json({ 
      uploadUrl, 
      storageId 
    });
  } catch {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}