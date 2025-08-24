'use client';

import { Prize } from '../types/prizes';

// Lista de premios disponibles con sus stocks iniciales
export const initialPrizes: Prize[] = [
  {
    id: 1,
    name: 'Bebida Gratis',
    color: '#FF5733',
    icon: '🍹',
    stock: 50
  },
  {
    id: 2,
    name: 'Entrada VIP',
    color: '#33A1FF',
    icon: '🎟️',
    stock: 20
  },
  {
    id: 3,
    name: 'Descuento 50%',
    color: '#33FF57',
    icon: '💰',
    stock: 30
  },
  {
    id: 4,
    name: 'Foto con DJ',
    color: '#9D33FF',
    icon: '📸',
    stock: 15
  },
  {
    id: 5,
    name: 'Merchandising',
    color: '#FF33E6',
    icon: '👕',
    stock: 40
  },
  {
    id: 6,
    name: 'Entrada para próximo evento',
    color: '#FFD700',
    icon: '🎭',
    stock: 10
  },
  {
    id: 7,
    name: 'Nuevo intento',
    color: '#9933FF',
    icon: '🎯',
    stock: 0  // Stock 0 para "Nuevo intento"
  }
];

// Prefijo para las claves en localStorage
const STORAGE_PREFIX = 'ktdlounge:';
const PRIZE_STOCK_KEY = `${STORAGE_PREFIX}prizeStock`;
const USER_PLAYED_KEY = `${STORAGE_PREFIX}played`;

// Obtiene el stock local actual para un ID de pulsera específico
export function getLocalStockForUser(pulseraId: string): Prize[] {
  if (typeof window === 'undefined') return [...initialPrizes];
  
  try {
    const stockKey = `${PRIZE_STOCK_KEY}:${pulseraId}`;
    const storedStock = localStorage.getItem(stockKey);
    
    if (storedStock) {
      return JSON.parse(storedStock);
    }
    
    // Si no existe, inicializa con los valores por defecto
    localStorage.setItem(stockKey, JSON.stringify(initialPrizes));
    return [...initialPrizes];
  } catch (error) {
    console.error('Error al obtener stock local:', error);
    return [...initialPrizes];
  }
}

// Contador de reintentos por pulsera
const RETRIES_COUNT_KEY = `${STORAGE_PREFIX}retries`;

// Verificar si una pulsera puede obtener "Nuevo intento"
export function canGetRetry(pulseraId: string, maxRetries: number = 1): boolean {
  if (typeof window === 'undefined' || !pulseraId) return false;
  
  try {
    const retriesKey = `${RETRIES_COUNT_KEY}:${pulseraId}`;
    const usedRetries = Number(localStorage.getItem(retriesKey) || '0');
    return usedRetries < maxRetries;
  } catch (error) {
    console.error('Error al verificar reintentos:', error);
    return false;
  }
}

// Incrementar el contador de reintentos para una pulsera
export function incrementRetryCount(pulseraId: string): void {
  if (typeof window === 'undefined' || !pulseraId) return;
  
  try {
    const retriesKey = `${RETRIES_COUNT_KEY}:${pulseraId}`;
    const usedRetries = Number(localStorage.getItem(retriesKey) || '0');
    localStorage.setItem(retriesKey, String(usedRetries + 1));
  } catch (error) {
    console.error('Error al incrementar reintentos:', error);
  }
}

// Sorteo ponderado por stock restante con manejo especial para "Nuevo intento"
export function weightedRandom(
  prizes: Prize[], 
  retryWeight: number = 0.15,
  customWeights: Record<number, number> = {}
): Prize {
  // Determinar si se debe incluir "Nuevo intento" basado en probabilidad configurable
  const includeRetry = Math.random() < retryWeight;
  
  // Obtener el premio "Nuevo intento" (id 7)
  const retryPrize = prizes.find(p => p.id === 7);
  
  // Si el sorteo decide "Nuevo intento" y existe, devolverlo
  if (includeRetry && retryPrize) {
    return retryPrize;
  }
  
  // Filtrar premios con stock disponible (excluyendo "Nuevo intento")
  const availablePrizes = prizes.filter(prize => 
    prize.id !== 7 && prize.stock && prize.stock > 0
  );
  
  // Si no hay premios disponibles, mostrar mensaje de error
  if (availablePrizes.length === 0) {
    throw new Error('No hay premios disponibles');
  }
  
  // Calcular pesos para cada premio disponible
  const prizeWeights = availablePrizes.map(prize => {
    // Usar peso personalizado si existe, si no usar el stock
    const baseWeight = customWeights[prize.id] !== undefined ? 
      customWeights[prize.id] : 
      prize.stock || 0;
    
    return {
      prize,
      weight: baseWeight
    };
  });
  
  // Calcular suma total de pesos
  const totalWeight = prizeWeights.reduce((sum, item) => sum + item.weight, 0);
  
  // Generar número aleatorio entre 0 y el peso total
  let random = Math.random() * totalWeight;
  
  // Seleccionar el premio según el peso
  for (const { prize, weight } of prizeWeights) {
    random -= weight;
    if (random <= 0) {
      return prize;
    }
  }
  
  // Por defecto, devolver el primer premio disponible
  return availablePrizes[0];
}

// Decrementa el stock de un premio específico para un usuario
export function decrementPrizeStock(pulseraId: string, prizeId: number): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stockKey = `${PRIZE_STOCK_KEY}:${pulseraId}`;
    const prizes = getLocalStockForUser(pulseraId);
    
    // Encontrar y decrementar el stock del premio
    const prizeIndex = prizes.findIndex(p => p.id === prizeId);
    if (prizeIndex === -1 || !prizes[prizeIndex].stock || prizes[prizeIndex].stock <= 0) {
      return false;
    }
    
    // Actualizar stock
    prizes[prizeIndex].stock = (prizes[prizeIndex].stock || 0) - 1;
    
    // Guardar en localStorage
    localStorage.setItem(stockKey, JSON.stringify(prizes));
    
    return true;
  } catch (error) {
    console.error('Error al decrementar stock:', error);
    return false;
  }
}

// Marca una pulsera como utilizada
export function markPulseraAsUsed(pulseraId: string): void {
  if (typeof window === 'undefined' || !pulseraId) return;
  
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(`${USER_PLAYED_KEY}:${pulseraId}`, `used@${timestamp}`);
  } catch (error) {
    console.error('Error al marcar pulsera como usada:', error);
  }
}

// Verifica si una pulsera ya ha sido utilizada
export function hasPulseraBeenUsed(pulseraId: string): boolean {
  if (typeof window === 'undefined' || !pulseraId) return false;
  
  try {
    return !!localStorage.getItem(`${USER_PLAYED_KEY}:${pulseraId}`);
  } catch (error) {
    console.error('Error al verificar uso de pulsera:', error);
    return false;
  }
}
