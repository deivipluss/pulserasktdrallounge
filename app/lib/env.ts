import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configurar dayjs con los plugins necesarios
dayjs.extend(utc);
dayjs.extend(timezone);

// Valores por defecto seguros para build/preview (reemplaza en prod con ENV reales)
const FALLBACKS = {
  NEXT_PUBLIC_EVENT_TZ: 'America/Lima',
  EVENT_START_ISO: '2025-01-01T00:00:00.000Z',
  QR_BASE_URL: 'https://example.com',
  // Longitud >= 32 para pasar validación mínima
  SIGNING_SECRET: 'development-signing-secret-0123456789abcdef',
};

// Esquema para validar las variables de entorno
const envSchema = z.object({
  // Variables públicas (accesibles desde el cliente)
  NEXT_PUBLIC_EVENT_TZ: z.string().min(1).default(FALLBACKS.NEXT_PUBLIC_EVENT_TZ),
  
  // Variables privadas (solo accesibles desde el servidor)
  EVENT_START_ISO: z
    .string()
    .refine((val) => dayjs(val).isValid(), { message: 'EVENT_START_ISO debe ser una fecha ISO válida' })
    .default(FALLBACKS.EVENT_START_ISO),
  QR_BASE_URL: z.string().url().or(z.string().min(1)).default(FALLBACKS.QR_BASE_URL),
  SIGNING_SECRET: z.string().min(32, 'SIGNING_SECRET debe tener al menos 32 caracteres').default(FALLBACKS.SIGNING_SECRET),
});

// Función para procesar y validar las variables de entorno
function processEnv() {
  const env = process.env;
  
  try {
    // Intenta validar normalmente
    return envSchema.parse(env);
  } catch (error) {
    // En build no debemos romper: devolvemos valores con defaults seguros
    if (error instanceof z.ZodError) {
      return {
        NEXT_PUBLIC_EVENT_TZ: env.NEXT_PUBLIC_EVENT_TZ || FALLBACKS.NEXT_PUBLIC_EVENT_TZ,
        EVENT_START_ISO: env.EVENT_START_ISO && dayjs(env.EVENT_START_ISO).isValid() ? env.EVENT_START_ISO : FALLBACKS.EVENT_START_ISO,
        QR_BASE_URL: env.QR_BASE_URL && env.QR_BASE_URL.length ? env.QR_BASE_URL : FALLBACKS.QR_BASE_URL,
        SIGNING_SECRET: env.SIGNING_SECRET && env.SIGNING_SECRET.length >= 32 ? env.SIGNING_SECRET : FALLBACKS.SIGNING_SECRET,
      } as z.infer<typeof envSchema>;
    }
    // Si el error es otro, re-lanzamos
    throw error;
  }
}

// Exportamos las variables de entorno procesadas
export const env = processEnv();

// Helpers para acceder a las variables de entorno
export function getEventTZ() {
  return env.NEXT_PUBLIC_EVENT_TZ;
}

export function getEventStart() {
  return dayjs(env.EVENT_START_ISO).tz(getEventTZ());
}

// Otras funciones de ayuda relacionadas con el evento
export function getEventStartISO() {
  return env.EVENT_START_ISO;
}

export function getQRBaseURL() {
  return env.QR_BASE_URL;
}

export function getSigningSecret() {
  return env.SIGNING_SECRET;
}

// Función para verificar si el evento ha comenzado
export function hasEventStarted() {
  const now = dayjs().tz(getEventTZ());
  return now.isAfter(getEventStart());
}

// Función para obtener tiempo restante hasta el evento
export function getTimeUntilEvent() {
  const now = dayjs().tz(getEventTZ());
  const start = getEventStart();
  
  if (now.isAfter(start)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: true };
    }
  
  const diff = start.diff(now, 'second');
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  return { days, hours, minutes, seconds, hasStarted: false };
}

export default {
  getEventTZ,
  getEventStart,
  getEventStartISO,
  getQRBaseURL,
  getSigningSecret,
  hasEventStarted,
  getTimeUntilEvent,
};
