import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configurar dayjs con los plugins necesarios
dayjs.extend(utc);
dayjs.extend(timezone);

// Esquema para validar las variables de entorno
const envSchema = z.object({
  // Variables públicas (accesibles desde el cliente)
  NEXT_PUBLIC_EVENT_TZ: z.string().min(1).default('America/Lima'),
  
  // Variables privadas (solo accesibles desde el servidor)
  EVENT_START_ISO: z.string().refine(
    (val) => dayjs(val).isValid(),
    { message: 'EVENT_START_ISO debe ser una fecha ISO válida' }
  ),
  QR_BASE_URL: z.string().url().or(z.string().min(1)),
  SIGNING_SECRET: z.string().min(32, 'SIGNING_SECRET debe tener al menos 32 caracteres'),
});

// Función para procesar y validar las variables de entorno
function processEnv() {
  // En producción usamos process.env
  // En desarrollo podemos usar process.env directamente si está disponible
  const env = process.env;
  
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((e: z.ZodIssue) => e.message.includes('Required'))
        .map((e: z.ZodIssue) => e.path.join('.'))
        .join(', ');
      
      const invalidVars = error.issues
        .filter((e: z.ZodIssue) => !e.message.includes('Required'))
        .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      
      const errorMessage = [
        'Error en la validación de variables de entorno:',
        missingVars ? `Variables faltantes: ${missingVars}` : null,
        invalidVars ? `Variables inválidas: ${invalidVars}` : null,
      ].filter(Boolean).join('\n');
      
      throw new Error(errorMessage);
    }
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
