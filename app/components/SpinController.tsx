'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel, { Prize, WheelMethods } from './Wheel';
import ResultDialog from './ResultDialog';
import { 
  weightedRandom, 
  getLocalStockForUser, 
  decrementPrizeStock, 
  markPulseraAsUsed,
  canGetRetry,
  incrementRetryCount
} from '../lib/prizes';

// Estados del controlador de giro
type SpinState = 'idle' | 'spinning' | 'waitingStop' | 'stopping' | 'result';

interface SpinControllerProps {
  prizes: Prize[];
  onResult?: (prize: Prize) => void;
  disabled?: boolean;
  pulseraId?: string; // ID único de la pulsera para tracking
  maxRetries?: number; // Número máximo de reintentos permitidos (por defecto 1)
  wheelMode?: 'free' | 'force'; // Modo de la ruleta
  retryWeight?: number; // Peso del segmento "Nuevo intento"
  customWeights?: Record<number, number>; // Pesos personalizados para los premios
}

export default function SpinController({ 
  prizes, 
  onResult, 
  disabled = false, 
  pulseraId = '',
  maxRetries = 1,
  wheelMode = 'free',
  retryWeight = 0.15,
  customWeights = {}
}: SpinControllerProps) {
  const [state, setState] = useState<SpinState>('idle');
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);
  const [forcePrizeId, setForcePrizeId] = useState<number | null>(null);
  const [retryMode, setRetryMode] = useState(false);
  const wheelRef = useRef<WheelMethods>(null);
  
  // Cargar los premios con stock local al iniciar
  useEffect(() => {
    if (pulseraId) {
      const userPrizes = getLocalStockForUser(pulseraId);
      setLocalPrizes(userPrizes);
    }
  }, [pulseraId]);
  
  // Manejar inicio del giro
  const handleSpinStart = () => {
    setState('spinning');
    
    // Después de un tiempo, cambiar al estado de espera para detener
    setTimeout(() => {
      setState('waitingStop');
    }, 3000);
  };
  
  // Manejar fin del giro
  const handleSpinEnd = (prize: Prize) => {
    setState('stopping');
    setSelectedPrize(prize);
    
    // Vibrar el dispositivo si está disponible
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 200]);
    }
    
      // Verificar si es "Nuevo intento" (id 7) o un premio real
    if (pulseraId && prize) {
      // Si es "Nuevo intento", incrementar contador de reintentos pero no marcar como usada
      if (prize.id === 7) {
        incrementRetryCount(pulseraId);
        setRetryMode(true);
        
        // Seleccionar un premio garantizado (para el segundo giro)
        // Excluimos el premio "Nuevo intento" (id 7)
        const availablePrizes = prizes.filter(p => p.id !== 7 && (p.stock === undefined || p.stock > 0));
        
        if (availablePrizes.length > 0) {
          // Por simplicidad, seleccionamos el primero disponible
          const guaranteedPrize = availablePrizes[0];
          setForcePrizeId(guaranteedPrize.id);
        }
      } else {
        // Para premios reales, decrementar stock y marcar como usada
        decrementPrizeStock(pulseraId, prize.id);
        markPulseraAsUsed(pulseraId);
      }
    }
    
    // Mostrar resultado después de un breve retraso
    setTimeout(() => {
      setState('result');
      setShowDialog(true);
      
      // Notificar el resultado
      if (onResult) onResult(prize);
    }, 500);
  };
  
  // Manejar cierre del diálogo de resultado
  const handleDialogClose = () => {
    setShowDialog(false);
    
    // Verificar si se obtuvo "Nuevo intento"
    const isRetry = selectedPrize?.id === 7;
    
    // Volver al estado inicial después de cerrar el diálogo
    setTimeout(() => {
      if (isRetry && retryMode && forcePrizeId !== null) {
        // Ejecutar segundo giro con premio garantizado
        setState('idle');
        
        // Pequeño retraso para la experiencia de usuario
        setTimeout(() => {
          if (wheelRef.current) {
            // Forzar giro al premio garantizado usando la ref
            wheelRef.current.spinTo(forcePrizeId);
          } else {
            // Fallback si la ref no está disponible
            setState('spinning');
            // Y luego cambiar a waitingStop después de un tiempo
            setTimeout(() => {
              setState('waitingStop');
            }, 3000);
          }
        }, 1000);
      } else {
        setState('idle');
      }
      
      // Si fue "Nuevo intento", mostrar mensaje informativo
      if (isRetry) {
        // Podría mostrar algún toast o mensaje informativo aquí
        console.log("¡Tienes un nuevo intento!");
      }
    }, 300);
  };
  
  // Obtener texto del botón según el estado
  const getButtonText = () => {
    switch (state) {
      case 'idle':
        return '¡Girar!';
      case 'spinning':
        return 'Girando...';
      case 'waitingStop':
        return '¡Detener!';
      case 'stopping':
        return 'Deteniendo...';
      case 'result':
        return '¡Resultado!';
      default:
        return '¡Girar!';
    }
  };
  
  // Manejar clic en el botón
  const handleButtonClick = () => {
    if (disabled) return;
    
    if (state === 'idle') {
      handleSpinStart();
    } else if (state === 'waitingStop') {
      setState('stopping');
    }
  };
  
  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Wheel component */}
      <Wheel 
        ref={wheelRef}
        prizes={prizes}
        onSpinStart={handleSpinStart}
        onSpinEnd={handleSpinEnd}
        disabled={disabled || state === 'result'}
        forceSegmentId={forcePrizeId}
        retryWeight={retryMode ? 0 : retryWeight} // Si estamos en modo reintento, desactivar la opción de "Nuevo intento"
        mode={wheelMode} // Usar el modo especificado
        weights={customWeights} // Usar pesos personalizados
      />
      
      {/* Botón de control */}
      <motion.button
        whileHover={!disabled && state !== 'spinning' && state !== 'stopping' && state !== 'result' ? { 
          scale: 1.05, 
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' 
        } : {}}
        whileTap={!disabled && state !== 'spinning' && state !== 'stopping' && state !== 'result' ? { 
          scale: 0.95 
        } : {}}
        initial={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
        animate={state === 'waitingStop' ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 4px 12px rgba(0, 0, 0, 0.15)',
            '0 8px 20px rgba(0, 0, 0, 0.2)',
            '0 4px 12px rgba(0, 0, 0, 0.15)'
          ]
        } : {}}
        transition={{
          repeat: state === 'waitingStop' ? Infinity : 0,
          duration: 0.8
        }}
        className={`w-full sm:w-64 py-5 sm:py-6 mb-safe rounded-xl text-white font-bold text-xl
                  transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2
                  ${disabled 
                    ? 'bg-gray-400 cursor-not-allowed focus:ring-gray-300' 
                    : state === 'waitingStop'
                      ? 'bg-fiesta-orange hover:bg-fiesta-orange/90 focus:ring-orange-300'
                      : state === 'spinning' || state === 'stopping'
                        ? 'bg-gray-500 cursor-not-allowed focus:ring-gray-300'
                        : state === 'result'
                          ? 'bg-fiesta-green focus:ring-green-300'
                          : 'bg-fiesta-purple hover:bg-fiesta-purple/90 focus:ring-purple-300'
                  }`}
        onClick={handleButtonClick}
        disabled={disabled || state === 'spinning' || state === 'stopping' || state === 'result'}
        style={{
          minHeight: "72px", // Aumenta el área táctil
          touchAction: "manipulation" // Mejora rendimiento táctil
        }}
        aria-label={getButtonText()}
        role="button"
      >
        <motion.span 
          className="inline-block w-full"
          animate={state === 'waitingStop' ? {
            color: ['#ffffff', '#fff9c0', '#ffffff']
          } : {}}
          transition={{
            repeat: state === 'waitingStop' ? Infinity : 0,
            duration: 0.8
          }}
        >
          {getButtonText()}
        </motion.span>
      </motion.button>
      
      {/* Diálogo de resultado */}
      <AnimatePresence>
        {showDialog && selectedPrize && (
          <ResultDialog 
            prize={selectedPrize} 
            onClose={handleDialogClose} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
