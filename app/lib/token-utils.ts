import crypto from 'crypto';
import { env } from '@/app/lib/env';

/**
 * Valida un token firmado utilizando HMAC SHA-256
 * @param id Identificador único del token
 * @param sig Firma proporcionada para validar
 * @returns {boolean} true si la firma es válida, false en caso contrario
 */
export function validateSignedToken(id: string, sig: string): boolean {
  if (!id || !sig) return false;
  try {
    const expected = crypto.createHmac('sha256', env.SIGNING_SECRET).update(id).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false; // Longitud inválida u otro detalle
    }
  } catch (error) {
    console.error('Error al validar token:', error);
    return false;
  }
}

/**
 * Genera un token firmado para un ID
 * @param id Identificador único para firmar
 * @returns {{ id: string, sig: string }} Objeto con el ID y la firma
 */
export function generateSignedToken(id: string): { id: string; sig: string } {
  const signature = crypto
    .createHmac('sha256', env.SIGNING_SECRET)
    .update(id)
    .digest('hex');

  return { id, sig: signature };
}
