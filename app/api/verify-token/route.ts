import { NextRequest, NextResponse } from 'next/server';
import { validateSignedToken } from '@/app/lib/token-utils';

/**
 * API para verificar tokens y redirigir adecuadamente.
 * Esto nos permite hacer la validación en el lado del servidor (Node.js)
 * en lugar de en el middleware (Edge Runtime) que no soporta crypto.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const sig = searchParams.get('sig');
  const redirect = searchParams.get('redirect') || '/jugar';
  
  // Si falta algún parámetro, redirigir a la página principal
  if (!id || !sig) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Validar token
  const isValid = validateSignedToken(id, sig);
  
  // Si el token no es válido, redirigir con mensaje de error
  if (!isValid) {
    const errorUrl = new URL('/acceso-denegado', request.url);
    return NextResponse.redirect(errorUrl);
  }
  
  // El token es válido, continuar a la página original
  const finalRedirect = redirect.startsWith('/')
    ? new URL(redirect, request.url)
    : new URL('/' + redirect, request.url);
    
  return NextResponse.redirect(finalRedirect);
}
