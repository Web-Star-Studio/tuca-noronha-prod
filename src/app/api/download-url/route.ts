import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get('storageId');
    const proposalId = searchParams.get('proposalId');
    
    if (!storageId || !proposalId) {
      return NextResponse.json(
        { error: 'Storage ID and Proposal ID are required' },
        { status: 400 }
      );
    }
    
    // Get download URL from Convex using the proposal documents function
    const url = await convex.query(api.domains.packageProposals.documents.getAttachmentDownloadUrl, { 
      proposalId,
      storageId 
    });
    
    return NextResponse.json({ url });
  } catch {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}