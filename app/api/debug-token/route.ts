import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  try {
    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
    }
    
    const dateMatch = id.match(/ktd-(\d{4}-\d{2}-\d{2})-\d+/);
    if (!dateMatch || !dateMatch[1]) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }
    
    const date = dateMatch[1];
    const csvPath = `/tokens/${date}.csv`;
    
    // For debugging purposes
    return NextResponse.json({
      id,
      date,
      csvPath,
      publicFolderStructure: true,
      status: 'Debug token info retrieved successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
