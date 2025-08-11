'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configurar dayjs con los plugins necesarios
dayjs.extend(utc);
dayjs.extend(timezone);

// Variables de entorno públicas
const EVENT_TZ = process.env.NEXT_PUBLIC_EVENT_TZ || 'America/Lima';

// Helpers para el cliente
export function getEventTZ() {
  return EVENT_TZ;
}

// Función para verificar si el evento ha comenzado (versión cliente)
// Nota: Esta función depende de la fecha del servidor para mayor precisión
export function getTimeUntilEvent() {
  const now = dayjs().tz(getEventTZ());
  
  // Obtenemos la fecha del evento desde la API en producción
  // Para desarrollo, usamos una fecha hardcodeada
  const eventDateISO = '2025-08-11T19:00:00-05:00'; // Fecha de desarrollo
  const eventDate = dayjs(eventDateISO).tz(getEventTZ());
  
  if (now.isAfter(eventDate)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: true };
  }
  
  const diff = eventDate.diff(now, 'second');
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  return { days, hours, minutes, seconds, hasStarted: false };
}
