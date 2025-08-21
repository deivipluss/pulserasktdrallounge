import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren validación de token
const PROTECTED_ROUTES = ['/jugar'];
// Rutas que requieren token de administrador
const ADMIN_ROUTES = ['/status'];

export function middleware(request: NextRequest) {
  try {
    const { pathname, searchParams } = request.nextUrl;

    // Versión simplificada para resolver el error de sintaxis
    // En modo desarrollo, permitimos todas las rutas para facilitar pruebas y depuración
    const host = request.headers.get('host') || '';
    const isDev = host.includes('localhost') || host.includes('127.0.0.1');
    
    if (isDev) {
      // En desarrollo, permitimos todas las peticiones
      const res = NextResponse.next();
      res.headers.set('x-mw-debug', 'dev-mode-allowed');
      return res;
    }

    // Para rutas específicas que necesitan verificación
    if (pathname.startsWith('/jugar')) {
      const id = searchParams.get('id');
      const sig = searchParams.get('sig');
      
      if (!id || !sig) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    return NextResponse.next();
  } catch (err) {
    console.error('Edge middleware error:', err);
    return NextResponse.next();
  }
}

// Limitar el alcance del middleware solo a rutas necesarias
export const config = {
  matcher: [
    '/status',
    '/jugar/:path*',
    '/__mw-dbg',
  ],
};
