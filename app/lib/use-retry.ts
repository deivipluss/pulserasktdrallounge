'use client';

import { useEffect, useState } from 'react';
import { Prize } from '../types/prizes';
import { getRetryState, saveRetryState } from './user-storage';

// Hook personalizado para gestionar el estado de reintentos
export function useRetrySystem(pulseraId: string, prizes: Prize[]) {
  // Estado local
  const [retryPending, setRetryPending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [preasignedPrize, setPreasignedPrize] = useState<Prize | null>(null);
  
  // Cargar el estado persistido al iniciar
  useEffect(() => {
    if (!pulseraId) return;
    
    const storedState = getRetryState(pulseraId);
    if (storedState) {
      setRetryPending(storedState.retryPending);
      setRetryCount(storedState.retryCount);
      
      // Si hay un premio preasignado, buscarlo en la lista de premios
      if (storedState.preasignedPrizeId) {
        const prize = prizes.find(p => p.id === storedState.preasignedPrizeId);
        if (prize) setPreasignedPrize(prize);
      }
    }
  }, [pulseraId, prizes]);
  
  // Función para iniciar un reintento
  const startRetry = () => {
    if (!pulseraId) return;
    
    // Incrementar contador de reintentos
    const newCount = retryCount + 1;
    setRetryCount(newCount);
    setRetryPending(true);
    
    // Seleccionar un premio garantizado (excepto "Nuevo intento")
    const availablePrizes = prizes.filter(p => p.id !== 7 && (p.stock === undefined || p.stock > 0));
    
    if (availablePrizes.length > 0) {
      // Por simplicidad, seleccionamos el primero disponible
      const selectedPrize = availablePrizes[0];
      setPreasignedPrize(selectedPrize);
      
      // Persistir estado
      saveRetryState(pulseraId, {
        retryPending: true,
        retryCount: newCount,
        preasignedPrizeId: selectedPrize.id
      });
      
      return selectedPrize;
    }
    
    return null;
  };
  
  // Función para completar un reintento
  const completeRetry = () => {
    if (!pulseraId) return;
    
    setRetryPending(false);
    setPreasignedPrize(null);
    
    // Persistir estado actualizado
    saveRetryState(pulseraId, {
      retryPending: false,
      retryCount: retryCount
    });
  };
  
  // Función para verificar si puede obtener un reintento
  const canGetRetry = (maxRetries: number = 1) => {
    return retryCount < maxRetries;
  };
  
  return {
    retryPending,
    retryCount,
    preasignedPrize,
    startRetry,
    completeRetry,
    canGetRetry
  };
}
