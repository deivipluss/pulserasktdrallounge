'use client';

// Prefijos para las claves de localStorage
const STORAGE_PREFIX = 'ktdlounge:';
const RETRY_STATUS_KEY = `${STORAGE_PREFIX}retry`;
const USER_TOKEN_KEY = `${STORAGE_PREFIX}token`;

// Interface para el estado de reintento
interface RetryState {
  retryPending: boolean;  // ¿Hay un reintento pendiente?
  retryCount: number;     // Número de reintentos realizados
  preasignedPrizeId?: number; // ID del premio preasignado para el segundo giro
}

// Guardar el estado del reintento para una pulsera
export function saveRetryState(pulseraId: string, state: RetryState): void {
  if (typeof window === 'undefined' || !pulseraId) return;
  
  try {
    localStorage.setItem(`${RETRY_STATUS_KEY}:${pulseraId}`, JSON.stringify(state));
  } catch (error) {
    console.error('Error al guardar estado de reintento:', error);
  }
}

// Obtener el estado del reintento para una pulsera
export function getRetryState(pulseraId: string): RetryState | null {
  if (typeof window === 'undefined' || !pulseraId) return null;
  
  try {
    const storedState = localStorage.getItem(`${RETRY_STATUS_KEY}:${pulseraId}`);
    return storedState ? JSON.parse(storedState) : null;
  } catch (error) {
    console.error('Error al obtener estado de reintento:', error);
    return null;
  }
}

// Guardar el token de una pulsera para verificación
export function saveUserToken(pulseraId: string, token: string): void {
  if (typeof window === 'undefined' || !pulseraId || !token) return;
  
  try {
    localStorage.setItem(`${USER_TOKEN_KEY}:${pulseraId}`, token);
  } catch (error) {
    console.error('Error al guardar token de usuario:', error);
  }
}

// Verificar si un token es válido para una pulsera
export function isValidToken(pulseraId: string, token: string): boolean {
  if (typeof window === 'undefined' || !pulseraId || !token) return false;
  
  try {
    const storedToken = localStorage.getItem(`${USER_TOKEN_KEY}:${pulseraId}`);
    return storedToken === token;
  } catch (error) {
    console.error('Error al verificar token de usuario:', error);
    return false;
  }
}

// Marcar un token como usado (bloquea futuros usos)
export function markTokenUsed(pulseraId: string): void {
  if (typeof window === 'undefined' || !pulseraId) return;
  
  try {
    // Eliminar el token para evitar reuso
    localStorage.removeItem(`${USER_TOKEN_KEY}:${pulseraId}`);
    // Eliminar también el estado de reintento
    localStorage.removeItem(`${RETRY_STATUS_KEY}:${pulseraId}`);
  } catch (error) {
    console.error('Error al marcar token como usado:', error);
  }
}
