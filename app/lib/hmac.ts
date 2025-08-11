'use server';

import crypto from 'crypto';

// Clave secreta para la firma HMAC (en producción, usar variable de entorno)
const SECRET_KEY = process.env.HMAC_SECRET || 'pulserasktd-secure-secret-key-2025';

/**
 * Genera una firma HMAC para un ID
 * @param id - ID a firmar
 * @returns Firma hexadecimal
 */
export function generateSignature(id: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(id)
    .digest('hex');
}

/**
 * Crea una URL firmada para un ID
 * @param id - ID a incluir en la URL
 * @param baseUrl - URL base (opcional, por defecto /jugar)
 * @returns URL completa con ID y firma
 */
export function createSignedUrl(id: string, baseUrl = '/jugar'): string {
  const signature = generateSignature(id);
  return `${baseUrl}?id=${encodeURIComponent(id)}&sig=${signature}`;
}

/**
 * Verifica si una firma es válida para un ID
 * @param id - ID a verificar
 * @param signature - Firma a verificar
 * @returns true si la firma es válida, false en caso contrario
 */
export function verifySignature(id: string, signature: string): boolean {
  const expectedSignature = generateSignature(id);
  
  // Comparación de tiempo constante para evitar timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
