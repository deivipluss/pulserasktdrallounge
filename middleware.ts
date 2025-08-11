import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren validación de token
const PROTECTED_ROUTES = ['/jugar'];
// Rutas que requieren token de administrador
const ADMIN_ROUTES = ['/status'];

export function middleware(request: NextRequest) {
  // Comprobar si es una ruta protegida
  const pathname = request.nextUrl.pathname;
  
  // Comprobar si es una ruta de administración
  if (ADMIN_ROUTES.some(route => pathname === route)) {
    // Extraer token de administrador de la URL
    const token = request.nextUrl.searchParams.get('token');
    
    // Verificar si el token de administrador es válido (verificación simplificada)
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-2025';
    if (!token || token !== ADMIN_TOKEN) {
      // Si no hay token o es inválido, redirigir a la página de inicio
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Para rutas de usuario normal que requieren validación de token
  if (!PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar si estamos en modo desarrollo
  const host = request.headers.get('host') || '';
  const isDev = host.includes('localhost') || host.includes('127.0.0.1');
  
  // Obtener parámetros de consulta
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const sig = searchParams.get('sig');
  
  // Si falta algún parámetro, redirigir a la página principal o de prueba en desarrollo
  if (!id || !sig) {
    if (isDev) {
      // En desarrollo, redirigir a la página de prueba de tokens
      return NextResponse.redirect(new URL('/dev/test-tokens', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // En desarrollo, simplemente permitir cualquier token para facilitar las pruebas
  // En producción, la validación ocurriría en el servidor
  if (isDev) {
    return NextResponse.next();
  }

  // En producción, redirigiremos a la API de verificación
  // Esta es una solución temporal hasta que migremos la validación de tokens
  // fuera del Edge Runtime
  const verifyUrl = new URL('/api/verify-token', request.url);
  verifyUrl.searchParams.set('id', id);
  verifyUrl.searchParams.set('sig', sig);
  verifyUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  
  return NextResponse.redirect(verifyUrl);
}
