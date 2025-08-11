import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/app/lib/hmac';

export async function GET(request: NextRequest) {
  // Obtener parámetros de la solicitud
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const signature = url.searchParams.get('sig');
  
  // Validar parámetros
  if (!id || !signature) {
    return NextResponse.json(
      { success: false, error: 'Parámetros incompletos' }, 
      { status: 400 }
    );
  }
  
  // Verificar la firma
  const isValid = verifySignature(id, signature);
  
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: 'Firma inválida' },
      { status: 403 }
    );
  }
  
  // La firma es válida
  return NextResponse.json({ success: true, id });
}
