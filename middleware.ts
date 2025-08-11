import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren validación de token
const PROTECTED_ROUTES = ['/jugar'];
// Rutas que requieren token de administrador
const ADMIN_ROUTES = ['/status'];

export function middleware(request: NextRequest) {
  try {
    const { pathname, searchParams } = request.nextUrl;

    // Redirigir raíz explícitamente para evitar 404 si fallan redirects de build
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/imprimir-pulseras', request.url));
    }

    // Endpoint de diagnóstico: /__mw-dbg
    // No expone valores sensibles, solo estado general
    const nodeEnv = process.env.NODE_ENV;
    const host = request.headers.get('host') || '';
    const isDev = (nodeEnv && nodeEnv !== 'production') || host.includes('localhost') || host.includes('127.0.0.1');
    if (pathname === '/__mw-dbg') {
      const debugPayload = {
        nodeEnv: nodeEnv || 'undefined',
        host,
        isDev,
        pathname,
        adminRoute: ADMIN_ROUTES.some((r) => pathname === r),
        protectedRoute: PROTECTED_ROUTES.some((r) => pathname.startsWith(r)),
        hasId: searchParams.has('id'),
        hasSig: searchParams.has('sig'),
        hasAdminToken: searchParams.has('token'),
      };
      return new Response(JSON.stringify(debugPayload, null, 2), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

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
        const res = NextResponse.redirect(new URL('/', request.url));
        res.headers.set('x-mw', 'redir:admin-deny');
        return res;
      }
      return NextResponse.next();
    }

    // Si no es una ruta protegida, continuar
    if (!PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    const id = searchParams.get('id');
    const sig = searchParams.get('sig');

    // Si faltan parámetros, redirigir
    if (!id || !sig) {
      const res = NextResponse.redirect(new URL('/', request.url));
      res.headers.set('x-mw', 'redir:missing-params');
      return res;
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

    const res = NextResponse.redirect(verifyUrl);
    res.headers.set('x-mw', 'redir:verify');
    return res;
  } catch (err) {
    console.error('Edge middleware error:', err);
    const res = NextResponse.next();
    res.headers.set('x-mw-error', '1');
    return res;
  }
}

// Limitar el alcance del middleware solo a rutas necesarias
export const config = {
  matcher: [
    '/',
    '/status',
    '/jugar/:path*',
    '/__mw-dbg',
  ],
};
