'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Roulette from '@/app/components/Roulette';
import { hasIdPlayed, markIdAsPlayed } from '@/app/lib/played-storage';
import { getEventTZ, getTimeUntilEvent } from '@/app/lib/client-env';

// Estados posibles de la página
enum PageState {
  LOADING,
  WAITING,
  READY_TO_PLAY,
  PLAYED,
  ERROR
}

export default function PlayWrapper() {
  return (
    <Suspense fallback={<div>Cargando juego...</div>}>
      <Play />
    </Suspense>
  );
}

function Play() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  
  const [state, setState] = useState<PageState>(PageState.LOADING);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: false });
  const [reward, setReward] = useState<any>(null);
  const [prize, setPrize] = useState<string | null>(null);
  
  // Verificar el estado al cargar
  useEffect(() => {
    const checkState = async () => {
      if (!id) {
        setState(PageState.ERROR);
        return;
      }
      
      // 1. Verificar si ya jugó
      if (hasIdPlayed(id)) {
        setState(PageState.PLAYED);
        return;
      }
      
      try {
        // 2. Obtener tiempo del servidor
        const response = await fetch('/api/event-time');
        if (!response.ok) throw new Error('Error al obtener la hora del evento');
        
        const data = await response.json();
        setTimeLeft(data.timeUntilEvent);
        
        // 3. Obtener información del premio para este token
        try {
          const tokenResponse = await fetch(`/api/tokens?id=${encodeURIComponent(id)}`);
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData && tokenData.prize) {
              setPrize(tokenData.prize);
              console.log('Premio obtenido del token:', tokenData.prize);
            }
          }
        } catch (tokenError) {
          console.error('Error al obtener información del token:', tokenError);
        }

        // 4. Verificar si el evento ha comenzado
        if (data.timeUntilEvent.hasStarted) {
          setState(PageState.READY_TO_PLAY);
        } else {
          setState(PageState.WAITING);
          
          // Actualizar el contador
          const interval = setInterval(() => {
            const timeUntil = getTimeUntilEvent();
            setTimeLeft(timeUntil);
            
            if (timeUntil.hasStarted) {
              setState(PageState.READY_TO_PLAY);
              clearInterval(interval);
            }
          }, 1000);
          
          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Error:', error);
        setState(PageState.ERROR);
      }
    };
    
    checkState();
  }, [id]);
  
  // Manejar el resultado de la ruleta
  const handleRouletteResult = (result: any) => {
    setReward(result);
    markIdAsPlayed(id);
    
    // Cambiar al estado de "jugado" después de un retraso
    setTimeout(() => {
      setState(PageState.PLAYED);
    }, 3000);
  };
  
  // Renderizado condicional según el estado
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {state === PageState.LOADING && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-t-fiesta-purple border-b-fiesta-pink border-l-fiesta-blue border-r-fiesta-teal rounded-full animate-spin mb-4"></div>
            <p className="text-lg">Cargando...</p>
          </div>
        )}
        
        {state === PageState.WAITING && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-token-lg p-6 shadow-party-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-fluid-2xl font-heading font-bold text-center mb-6">¡Pronto podrás jugar!</h1>
            
            <div className="mb-6">
              <div className="text-center mb-4">
                <p className="text-fluid-base">El juego estará disponible en:</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-3 bg-fiesta-purple/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.days}</div>
                  <div className="text-fluid-xs">Días</div>
                </div>
                <div className="p-3 bg-fiesta-pink/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.hours}</div>
                  <div className="text-fluid-xs">Horas</div>
                </div>
                <div className="p-3 bg-fiesta-blue/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.minutes}</div>
                  <div className="text-fluid-xs">Minutos</div>
                </div>
                <div className="p-3 bg-fiesta-teal/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.seconds}</div>
                  <div className="text-fluid-xs">Segundos</div>
                </div>
              </div>
              
              <p className="text-center text-fluid-sm text-gray-500 dark:text-gray-400">
                Zona horaria: {getEventTZ()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-fiesta-blue/10 rounded-token">
              <p className="text-fluid-base">
                Recuerda volver a las 7:00 PM para participar en la ruleta.
              </p>
            </div>
          </motion.div>
        )}
        
        {state === PageState.READY_TO_PLAY && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-token-lg p-6 shadow-party-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-fluid-2xl font-heading font-bold text-center mb-6">
              ¡Gira la ruleta y gana!
            </h1>
            
            <Roulette onResult={handleRouletteResult} forcedPrize={prize || undefined} />
          </motion.div>
        )}
        
        {state === PageState.PLAYED && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-token-lg p-6 shadow-party-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-fiesta-orange/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fiesta-orange">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              
              <h2 className="text-fluid-2xl font-heading font-bold mb-2">
                Pulsera ya utilizada
              </h2>
              
              <p className="text-fluid-base text-gray-600 dark:text-gray-300 mb-6">
                {reward 
                  ? `Has ganado: ${reward.name}` 
                  : 'Esta pulsera ya ha sido utilizada para jugar.'}
              </p>
              
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-token mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Cada código QR puede ser utilizado solo una vez. Si necesitas ayuda, contacta a un organizador.
                </p>
              </div>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-3 px-6 bg-fiesta-blue text-white rounded-token font-medium text-center transition-all hover:bg-fiesta-blue/90"
              >
                Volver al inicio
              </button>
            </div>
          </motion.div>
        )}
        
        {state === PageState.ERROR && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-token-lg p-6 shadow-party-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m15 9-6 6"></path>
                  <path d="m9 9 6 6"></path>
                </svg>
              </div>
              <h2 className="text-fluid-2xl font-heading font-bold">{id ? 'Ha ocurrido un error' : 'Falta parámetro id'}</h2>
              <p className="text-fluid-base text-gray-600 dark:text-gray-300">
                {id ? 'No pudimos cargar el juego. Intenta de nuevo.' : 'Necesitas acceder con un enlace QR válido que incluya id y sig.'}
              </p>
              {!id && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/generate-token');
                      const data = await res.json();
                      window.location.href = data.playUrl;
                    } catch {
                      alert('Error generando token demo');
                    }
                  }}
                  className="w-full py-3 px-6 bg-fiesta-purple text-white rounded-token font-medium hover:bg-fiesta-purple/90"
                >
                  Generar token demo
                </button>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 px-6 bg-fiesta-blue text-white rounded-token font-medium text-center transition-all hover:bg-fiesta-blue/90"
                >
                  Reintentar
                </button>
                <button 
                  onClick={() => window.location.href='/'}
                  className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-token font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Inicio
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
