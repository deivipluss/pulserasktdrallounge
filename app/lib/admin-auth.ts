// Función para verificar si un token es válido
import { createHmac } from 'crypto';

// Token de administración para acceso a la página de estado
export const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-2025';

// Verificar si el token de administrador es válido
export function isValidAdminToken(token: string): boolean {
  // En un entorno de producción, esto debería ser una comparación segura
  return token === ADMIN_TOKEN;
}

// Función para generar firma HMAC para tokens
export function generateHmacSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Función para verificar una firma HMAC
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHmacSignature(payload, secret);
  
  // Usar una comparación de tiempo constante para evitar ataques de tiempo
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Comparación de tiempo constante para evitar ataques de timing
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

// Función para generar token de acceso temporal
export function generateTemporaryAccessToken(expireMinutes: number = 60): string {
  const expiresAt = Date.now() + expireMinutes * 60 * 1000;
  const payload = `admin-access-${expiresAt}`;
  const signature = generateHmacSignature(payload, ADMIN_TOKEN);
  return `${payload}:${signature}`;
}

// Verificar si un token de acceso temporal es válido
export function verifyTemporaryAccessToken(token: string): boolean {
  const [payload, signature] = token.split(':');
  
  if (!payload || !signature) {
    return false;
  }
  
  // Extraer tiempo de expiración del payload
  const parts = payload.split('-');
  const expiresAt = parseInt(parts[parts.length - 1], 10);
  
  // Verificar si el token ha expirado
  if (Date.now() > expiresAt) {
    return false;
  }
  
  // Verificar firma
  return verifyHmacSignature(payload, signature, ADMIN_TOKEN);
}
