'use client';

import Cookies from 'js-cookie';

const PLAYED_IDS_KEY = 'pulseraFiesta_played_ids';
const COOKIE_EXPIRY = 365; // Días (1 año)

/**
 * Guarda un ID de pulsera como jugado
 * @param id Identificador de la pulsera
 */
export function markIdAsPlayed(id: string): void {
  try {
    // Intentar usar localStorage primero
    if (typeof window !== 'undefined' && window.localStorage) {
      const playedIds = getPlayedIds();
      if (!playedIds.includes(id)) {
        playedIds.push(id);
        localStorage.setItem(PLAYED_IDS_KEY, JSON.stringify(playedIds));
      }
    }
    
    // Como respaldo, también usar cookies
    Cookies.set(`pulseraFiesta_${id}`, 'played', { 
      expires: COOKIE_EXPIRY,
      sameSite: 'strict'
    });
  } catch (error) {
    console.error('Error al guardar ID jugado:', error);
  }
}

/**
 * Verifica si un ID ya ha sido jugado
 * @param id Identificador de la pulsera
 * @returns {boolean} true si el ID ya ha sido jugado, false en caso contrario
 */
export function hasIdPlayed(id: string): boolean {
  try {
    // Verificar en localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const playedIds = getPlayedIds();
      if (playedIds.includes(id)) {
        return true;
      }
    }
    
    // Verificar en cookies como respaldo
    const hasCookie = Cookies.get(`pulseraFiesta_${id}`);
    return hasCookie === 'played';
  } catch (error) {
    console.error('Error al verificar ID jugado:', error);
    return false;
  }
}

/**
 * Obtiene la lista de IDs jugados desde localStorage
 */
function getPlayedIds(): string[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedIds = localStorage.getItem(PLAYED_IDS_KEY);
      if (storedIds) {
        return JSON.parse(storedIds);
      }
    }
  } catch (error) {
    console.error('Error al leer IDs jugados:', error);
  }
  
  return [];
}
