'use client';

/**
 * Wheel.tsx
 * 
 * Componente de ruleta interactiva con 7 segmentos personalizables.
 * 
 * Características:
 * - Modos de operación: 'free' (aleatorio con pesos) y 'force' (forzado)
 * - Sistema de pesos personalizables para cada premio
 * - Animaciones fluidas con framer-motion
 * - Efectos de sonido y vibración
 * - Efectos visuales (confeti, chispas)
 * - Método imperativo spinTo() para control programático
 */

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { weightedRandom } from '../lib/prizes';
import audioService, { vibrateDevice } from '../lib/audio-service';
import Confetti from './Confetti';
import Sparkles from './Sparkles';

/**
 * Interfaz para definir un premio en la ruleta
 * @property {number} id - Identificador único del premio
 * @property {string} name - Nombre descriptivo del premio
 * @property {string} color - Color en formato hexadecimal
 * @property {string} [icon] - Nombre del icono a mostrar (opcional)
 * @property {number} [stock] - Stock inicial referencial (opcional)
 */
export interface Prize {
  id: number;
  name: string;
  color: string;
  icon?: string; 
  stock?: number;
}

/**
 * Modos de operación de la ruleta
 * - 'free': Usa sistema de pesos para determinar probabilidad
 * - 'force': Ignora pesos y alinea al premio especificado
 */
export type WheelMode = 'free' | 'force';

/**
 * Propiedades del componente Wheel
 */
interface WheelProps {
  prizes: Prize[];                        // Lista de premios disponibles
  onSpinStart?: () => void;               // Callback al iniciar giro
  onSpinEnd?: (prize: Prize) => void;     // Callback al finalizar giro
  disabled?: boolean;                     // Deshabilita interacción
  forceSegmentId?: number | null;         // ID del segmento a forzar
  retryWeight?: number;                   // Peso del "Nuevo intento" (0-1)
  mode?: WheelMode;                       // Modo de operación
  weights?: Record<number, number>; // Pesos personalizados por ID de premio
}

// Exponer método público para forzar giro
export interface WheelMethods {
  spinTo: (prizeId: number) => void;
}

const Wheel = forwardRef<WheelMethods, WheelProps>(function Wheel(
  { 
    prizes, 
    onSpinStart, 
    onSpinEnd, 
    disabled = false, 
    forceSegmentId = null, 
    retryWeight = 0.15,
    mode = 'free',
    weights = {} 
  }: WheelProps, 
  ref
) {
  const [spinning, setSpinning] = useState(false);
  const [waitingStop, setWaitingStop] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [sparklePosition, setSparklePosition] = useState({ x: 0, y: 0 });
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<number | null>(forceSegmentId);
  const wheelRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Cargar los sonidos al inicio de forma diferida
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await audioService.load();
        setSoundsLoaded(true);
      } catch (e) {
        console.warn('Error al cargar sonidos:', e);
      }
    };
    
    loadSounds();
    
    // Limpiar sonidos al desmontar
    return () => {
      audioService.stop('spin');
      audioService.stop('tick');
      audioService.stop('win');
    };
  }, []);
  
  // Función para reproducir el sonido de tick
  const playTickSound = () => {
    if (soundsLoaded) {
      audioService.play('tick', { volume: 0.4 });
    }
  };
  
  // Reproducir sonido de tick durante el giro
  useEffect(() => {
    let tickInterval: NodeJS.Timeout | null = null;
    
    if (spinning && !waitingStop) {
      // Iniciar sonido de giro en loop
      if (soundsLoaded) {
        audioService.play('spin', { loop: true, volume: 0.3 });
      }
      
      // Reproducir sonidos de tick cada 100ms al inicio y luego más lento
      tickInterval = setInterval(() => {
        playTickSound();
      }, 100);
      
      // Después de 2 segundos, ralentizar los ticks
      setTimeout(() => {
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(() => {
          playTickSound();
        }, 200);
      }, 2000);
    } else if (waitingStop) {
      // Cuando está esperando para detenerse, los ticks son más lentos
      if (tickInterval) clearInterval(tickInterval);
      tickInterval = setInterval(() => {
        playTickSound();
      }, 300);
    } else {
      // Si no está girando, detener los sonidos
      audioService.stop('spin');
      
      if (tickInterval) clearInterval(tickInterval);
    }
    
    return () => {
      if (tickInterval) clearInterval(tickInterval);
    };
  }, [spinning, waitingStop, soundsLoaded]);
  
  // Iniciar el giro
  const startSpin = () => {
    if (spinning || disabled) return;
    
    // Notificar que comenzó el giro
    if (onSpinStart) onSpinStart();
    
    // Animar el botón/rueda
    controls.start({
      scale: [1, 0.98, 1],
      transition: { duration: 0.3 }
    });
    
    setSpinning(true);
    setSelectedPrize(null);
    setShowConfetti(false);
    setShowSparkles(false);
    
    // Girar rápidamente (varias vueltas)
    setRotation(prev => prev + 1440 + Math.random() * 360);
    
    // Después de 3 segundos, preparar para detener
    setTimeout(() => {
      setWaitingStop(true);
    }, 3000);
  };
  
  // Función para forzar giro hacia un segmento específico
  const spinTo = (prizeId: number) => {
    if (spinning || disabled) return;
    
    // Establecer el ID del premio forzado
    setTargetPrizeId(prizeId);
    startSpin();
  };

  // Detener el giro
  const stopSpin = () => {
    if (!spinning || !waitingStop || disabled) return;
    
    let selected: Prize;
    
    try {
      // Si estamos en modo forzado y hay un segmento forzado específico
      if (mode === 'force' && targetPrizeId !== null) {
        // Buscar el premio forzado por ID
        const forcedPrize = prizes.find(p => p.id === targetPrizeId);
        if (forcedPrize) {
          selected = forcedPrize;
        } else {
          // Si no se encuentra, revertir al primer premio disponible
          const fallbackPrize = prizes.find(p => p.id !== 7);
          selected = fallbackPrize || prizes[0];
        }
        // Restablecer el premio forzado después de usarlo
        setTargetPrizeId(null);
      } 
      // Si hay un segmento forzado pero estamos en modo libre
      else if (targetPrizeId !== null) {
        // Buscar el premio forzado
        const forcedPrize = prizes.find(p => p.id === targetPrizeId);
        if (forcedPrize) {
          selected = forcedPrize;
        } else {
          // Si no se encuentra, usar sorteo ponderado con pesos personalizados
          selected = weightedRandom(prizes, retryWeight, weights as Record<number, number>);
        }
        // Restablecer el premio forzado después de usarlo
        setTargetPrizeId(null);
      } else {
        // Utilizar el sorteo ponderado para obtener el premio, con pesos personalizados
        selected = weightedRandom(prizes, retryWeight, weights as Record<number, number>);
      }
      
      // Calcular ángulo final para que el premio quede en la parte superior
      const segmentSize = 360 / prizes.length;
      const prizeIndex = prizes.findIndex(p => p.id === selected.id);
      
      // Añadir variación para que no siempre caiga exactamente en el mismo lugar
      const offset = Math.random() * (segmentSize * 0.6) - (segmentSize * 0.3);
      
      // Calcular posición final con un número de vueltas adicional para efecto
      const additionalRotation = 720 + (prizeIndex * segmentSize) + offset;
      setRotation(prev => Math.floor(prev / 360) * 360 + additionalRotation);
      
      // Detener sonidos de giro
      audioService.stop('spin');
      
      // Posición central aproximada para las chispas
      const wheelElement = wheelRef.current;
      let centerX = 0, centerY = 0;
      if (wheelElement) {
        const rect = wheelElement.getBoundingClientRect();
        centerX = rect.width / 2;
        centerY = rect.height / 2;
      }
      
      // Esperar a que termine la animación
      setTimeout(() => {
        setSpinning(false);
        setWaitingStop(false);
        setSelectedPrize(selected);
        
        // Reproducir sonido de victoria
        if (soundsLoaded) {
          audioService.play('win', { volume: 0.6 });
        }
        
        // Vibrar el dispositivo con patrón específico
        vibrateDevice([20, 30, 20]);
        
        // Mostrar efectos visuales
        setShowConfetti(true);
        setSparklePosition({ x: centerX, y: centerY });
        setShowSparkles(true);
        
        // Notificar el premio obtenido
        if (onSpinEnd) onSpinEnd(selected);
      }, 4000); // Duración de la animación de detención
    } catch (error) {
      console.error("Error al seleccionar premio:", error);
      
      // Si ocurre un error, seleccionar el primer premio por defecto
      const fallbackPrize = prizes[0];
      
      // Calcular posición final con el primer premio
      const segmentSize = 360 / prizes.length;
      const offset = Math.random() * (segmentSize * 0.6) - (segmentSize * 0.3);
      const additionalRotation = 720 + offset;
      setRotation(prev => Math.floor(prev / 360) * 360 + additionalRotation);
      
      // Notificar con el premio por defecto
      setTimeout(() => {
        setSpinning(false);
        setWaitingStop(false);
        setSelectedPrize(fallbackPrize);
        
        // Vibrar el dispositivo
        vibrateDevice([20, 30, 20]);
        
        if (onSpinEnd) onSpinEnd(fallbackPrize);
      }, 4000);
    }
  };  // Manejar clic en la ruleta (iniciar o detener)
  const handleWheelClick = () => {
    if (!spinning) {
      startSpin();
    } else if (waitingStop) {
      stopSpin();
    }
  };
  
  // Exponer la función spinTo para controlar externamente
  useEffect(() => {
    if (forceSegmentId !== null && forceSegmentId !== targetPrizeId) {
      setTargetPrizeId(forceSegmentId);
    }
  }, [forceSegmentId]);
  
  // Exponer métodos públicos mediante useImperativeHandle
  useImperativeHandle(ref, () => ({
    spinTo
  }), []);
  
  // Generar los segmentos de la ruleta
  const segments = prizes.map((prize, index) => {
    const angle = (360 / prizes.length);
    const rotate = index * angle;
    
    return (
      <div 
        key={prize.id}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rotate - angle/2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate - angle/2) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotate + angle/2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate + angle/2) * Math.PI / 180)}%)`,
          backgroundColor: prize.color,
          transform: `rotate(${rotate}deg)`,
        }}
      >
        <div 
          className="absolute text-white font-semibold text-xs sm:text-sm select-none"
          style={{ 
            transform: `translateY(-30px) rotate(${-rotate}deg)`,
            width: '80px',
            textAlign: 'center',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {prize.name}
        </div>
      </div>
    );
  });
  
  // Efecto blur radial durante el giro
  const blurClass = spinning 
    ? 'filter blur-[2px]' 
    : waitingStop 
      ? 'filter blur-[1px]' 
      : '';

  return (
    <div className="relative flex flex-col items-center">
      {/* Confetti cuando hay un ganador */}
      <Confetti active={showConfetti} />
      
      {/* Indicador (flecha) en la parte superior */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 z-20">
        <motion.div 
          className="w-0 h-0 
                    border-l-[12px] border-l-transparent
                    border-r-[12px] border-r-transparent
                    border-b-[24px] border-b-fiesta-orange
                    drop-shadow-md"
          animate={waitingStop ? { 
            y: [0, -3, 0], 
            scale: [1, 1.1, 1]
          } : {}}
          transition={{
            repeat: waitingStop ? Infinity : 0,
            duration: 0.5
          }}
        >
        </motion.div>
      </div>
      
      {/* Contenedor de la ruleta */}
      <motion.div 
        className={`relative w-72 h-72 sm:w-96 sm:h-96 cursor-pointer
                   ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`} 
        onClick={handleWheelClick}
        whileTap={!disabled && !spinning ? { scale: 0.98 } : {}}
        animate={controls}
      >
        {/* Ruleta con animación */}
        <motion.div 
          ref={wheelRef}
          className={`w-full h-full rounded-full relative overflow-hidden 
                    border-8 border-gray-800/80 dark:border-white/20
                    shadow-[0_0_15px_rgba(0,0,0,0.5)] ${blurClass}`}
          animate={{ rotate: rotation }}
          transition={{ 
            duration: spinning && !waitingStop ? 3 : waitingStop ? 4 : 0.5,
            ease: spinning && !waitingStop ? "circOut" : "circInOut",
            type: "tween"
          }}
        >
          {segments}
          
          {/* Chispas en el segmento ganador */}
          <Sparkles 
            active={showSparkles} 
            x={sparklePosition.x} 
            y={sparklePosition.y} 
            color={selectedPrize?.color || '#FFD700'} 
          />
          
          {/* Centro de la ruleta */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="w-12 h-12 rounded-full bg-gray-800 dark:bg-white/20 z-10 shadow-inner"
              animate={
                waitingStop ? { scale: [1, 1.05, 1] } : {}
              }
              transition={{
                repeat: waitingStop ? Infinity : 0,
                duration: 0.5
              }}
            ></motion.div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Texto instructivo */}
      <motion.p 
        className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs"
        animate={
          waitingStop ? { scale: [1, 1.03, 1], color: ['#6b7280', '#ff6b00', '#6b7280'] } : {}
        }
        transition={{
          repeat: waitingStop ? Infinity : 0,
          duration: 0.8
        }}
      >
        {!spinning 
          ? "Toca la ruleta para girar" 
          : waitingStop 
            ? "¡Toca de nuevo para detener!" 
            : "¡Girando...!"}
      </motion.p>
    </div>
  );
});

export default Wheel;
