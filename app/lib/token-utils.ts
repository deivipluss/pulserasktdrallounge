import crypto from 'crypto';
import { env } from '@/app/lib/env';
import fs from 'fs';
import path from 'path';

// Cache en memoria para metadatos de tokens (day, prize) necesarios para validar firmas legacy
let tokenMetaLoaded = false;
let tokenMeta: Record<string, { day: string; prize: string }> = {};

function loadTokenMetaOnce() {
  if (tokenMetaLoaded) return;
  tokenMetaLoaded = true;
  const dir = path.join(process.cwd(), 'tokens');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
    for (const file of files) {
      const full = path.join(dir, file);
      const data = fs.readFileSync(full, 'utf8');
      const lines = data.split(/\r?\n/).slice(1); // skip header
      for (const line of lines) {
        if (!line.trim()) continue;
        // id,day,prize,sig,url
        const [id, day, prize] = line.split(',');
        if (id && day && prize) {
          tokenMeta[id] = { day, prize };
        }
      }
    }
  } catch (e) {
    // Silencioso: si no se pueden cargar, la validación legacy simplemente no se hará
    if (process.env.DEBUG_TOKENS === '1') {
      console.warn('[token-utils] No se pudieron cargar metadatos CSV para validación legacy:', e);
    }
  }
}

/**
 * Valida un token firmado utilizando HMAC SHA-256
 * @param id Identificador único del token
 * @param sig Firma proporcionada para validar
 * @returns {boolean} true si la firma es válida, false en caso contrario
 */
export function validateSignedToken(id: string, sig: string): boolean {
  if (!id || !sig) return false;
  try {
    // 1. Firma actual (solo id)
    const currentSig = crypto.createHmac('sha256', env.SIGNING_SECRET).update(id).digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(currentSig, 'hex'))) {
        return true;
      }
    } catch {
      // Si timingSafeEqual falla por longitudes distintas, ignorar y seguir
    }

    // 2. Fallback legacy (id|day|prizeKey) si disponemos de metadatos
    loadTokenMetaOnce();
    const meta = tokenMeta[id];
    if (meta) {
      const legacyData = `${id}|${meta.day}|${meta.prize}`; // antigua concatenación
      const legacySig = crypto.createHmac('sha256', env.SIGNING_SECRET).update(legacyData).digest('hex');
      try {
        if (crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(legacySig, 'hex'))) {
          if (process.env.DEBUG_TOKENS === '1') {
            console.warn('[token-utils] Validación legacy aceptada para', id);
          }
          return true;
        }
      } catch {/* ignorar */}
    }

    return false;
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
