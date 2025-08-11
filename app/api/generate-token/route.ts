import { NextResponse } from 'next/server';
import { generateSignedToken } from '@/app/lib/token-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || Math.random().toString(36).substring(2, 10);
  
  // Generar token firmado
  const token = generateSignedToken(id);
  
  // Construir URL para jugar
  const baseUrl = request.headers.get('host') || 'localhost:3000';
  const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
  const playUrl = `${protocol}://${baseUrl}/jugar?id=${token.id}&sig=${token.sig}`;
  
  return NextResponse.json({
    id: token.id,
    sig: token.sig,
    playUrl
  });
}
