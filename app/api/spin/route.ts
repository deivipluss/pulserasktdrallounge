import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/app/lib/hmac';
import { RateLimiter } from '@/app/lib/rate-limiter';
import { cookies } from 'next/headers';

// Crear una instancia del rate limiter (5 solicitudes por minuto)
const rateLimiter = new RateLimiter(5, 60000);

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener la IP del cliente
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // 2. Verificar rate limiting
    if (!rateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429 }
      );
    }
    
    // 3. Obtener datos de la solicitud
    const body = await request.json();
    const { id, signature } = body;
    
    // 4. Validar datos
    if (!id || !signature) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }
    
    // 5. Verificar firma HMAC
    if (!verifySignature(id, signature)) {
      return NextResponse.json(
        { success: false, error: 'Firma inválida' },
        { status: 403 }
      );
    }
    
    // 6. Verificar si el usuario ya ha jugado (opcional, también se maneja en el cliente)
    // Nota: En un entorno real verificaríamos en una base de datos
    // Aquí usamos cookies para una solución simple
    const cookieHeader = request.headers.get('cookie');
    const hasPlayed = cookieHeader && cookieHeader.includes(`played_${id}=`);
    
    if (hasPlayed) {
      return NextResponse.json(
        { success: false, error: 'Ya has participado con esta pulsera' },
        { status: 403 }
      );
    }
    
    // 7. Procesar el giro y obtener resultado
    // En un entorno real, aquí se obtendría el premio de una base de datos
    // y se actualizaría el stock, pero aquí solo simulamos
    
    // 8. Establecer cookie para marcar como jugado
    const response = NextResponse.json({ 
      success: true,
      message: 'Giro procesado correctamente',
    });
    
    // Configurar cookie segura (HttpOnly + SameSite=Lax)
    response.cookies.set({
      name: `played_${id}`,
      value: 'true',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 año
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Error en /api/spin:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
