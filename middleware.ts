import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren validación de token
const PROTECTED_ROUTES = ['/jugar'];
// Rutas que requieren token de administrador
const ADMIN_ROUTES = ['/status'];

export function middleware(request: NextRequest) {
  try {
    const { pathname, searchParams } = request.nextUrl;

    // Saltar rápidamente si no es ruta de app relevante
    // (el matcher también limita, pero mantenemos esta guarda)
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/robots') || pathname.startsWith('/sitemap')) {
      return NextResponse.next();
    }

    // Rutas de administración: validar token simple en query (?token=)
    if (ADMIN_ROUTES.some(route => pathname === route)) {
      const token = searchParams.get('token');
      // En Edge Middleware solo NEXT_PUBLIC_* está garantizado
      const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-token-2025';
      if (!token || token !== ADMIN_TOKEN) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }

    // Si no es una ruta protegida, continuar
    if (!PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Detectar entorno dev de forma segura
    const nodeEnv = process.env.NODE_ENV;
    const host = request.headers.get('host') || '';
    const isDev = (nodeEnv && nodeEnv !== 'production') || host.includes('localhost') || host.includes('127.0.0.1');

    const id = searchParams.get('id');
    const sig = searchParams.get('sig');

    // Si faltan parámetros, redirigir
    if (!id || !sig) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // En desarrollo, permitir pasar para facilitar pruebas
    if (isDev) {
      return NextResponse.next();
    }

    // En producción, redirigir a API de verificación (Node runtime)
    const verifyUrl = new URL('/api/verify-token', request.url);
    verifyUrl.searchParams.set('id', id);
    verifyUrl.searchParams.set('sig', sig);
    verifyUrl.searchParams.set('redirect', pathname + request.nextUrl.search);

    return NextResponse.redirect(verifyUrl);
  } catch (err) {
    // Nunca tirar el sitio en Edge: continuar la request y adjuntar header para depurar
    const res = NextResponse.next();
    res.headers.set('x-mw-error', '1');
    return res;
  }
}

// Limitar el alcance del middleware para evitar invocaciones en estáticos y APIs
export const config = {
  matcher: [
    // Todas las rutas excepto API y assets comunes
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
