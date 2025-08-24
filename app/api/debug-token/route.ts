import { NextResponse } from 'next/server';

/**
 * API para depuración de tokens
 * @returns Información de depuración
 */
export async function GET() {
  // Solo permitir en modo desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoints disabled in production' }, { status: 403 });
  }

  return NextResponse.json({ 
    message: 'Token debug API', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    debug: true
  });
}
