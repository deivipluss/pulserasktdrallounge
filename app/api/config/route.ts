import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Endpoint para obtener los valores actuales de configuración
export async function GET(request: Request) {
  // Obtener valores desde las cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMap = new Map(
    cookieHeader.split(';')
      .map(cookie => cookie.trim().split('=') as [string, string])
      .filter(([name]) => name)
  );
  
  const config = {
    retryProbability: parseFloat(cookieMap.get('ktdlounge_retry_probability') || '0.2'),
    maxRetries: parseInt(cookieMap.get('ktdlounge_max_retries') || '1', 10),
    activeDay: cookieMap.get('ktdlounge_active_day') || new Date().toISOString().split('T')[0],
    eventMode: cookieMap.get('ktdlounge_event_mode') || 'during'
  };
  
  return NextResponse.json(config);
}

// Endpoint para actualizar la configuración
export async function POST(request: Request) {
  try {
    // Parsear la solicitud JSON
    const data = await request.json();
    
    // Validar los datos recibidos
    const retryProbability = parseFloat(data.retryProbability);
    const maxRetries = parseInt(data.maxRetries, 10);
    const activeDay = data.activeDay;
    const eventMode = data.eventMode;
    
    if (
      isNaN(retryProbability) || retryProbability < 0.15 || retryProbability > 0.25 ||
      isNaN(maxRetries) || maxRetries < 1 || maxRetries > 3 ||
      !activeDay || !eventMode
    ) {
      return NextResponse.json({ success: false, error: 'Valores inválidos' }, { status: 400 });
    }
    
    // Guardar en cookies con tiempo de expiración largo (1 semana)
    // Crear respuesta con cookies
    const response = NextResponse.json({ success: true });
    
    // Añadir cookies a la respuesta
    const maxAge = 60 * 60 * 24 * 7; // 1 semana en segundos
    response.cookies.set('ktdlounge_retry_probability', retryProbability.toString(), { 
      maxAge, 
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    response.cookies.set('ktdlounge_max_retries', maxRetries.toString(), { 
      maxAge, 
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    response.cookies.set('ktdlounge_active_day', activeDay, { 
      maxAge, 
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    response.cookies.set('ktdlounge_event_mode', eventMode, { 
      maxAge, 
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    return response;
    
    // No usar esta línea, ya que las cookies están configuradas en la respuesta anterior
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
