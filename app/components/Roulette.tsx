'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ——————————————————————————————————————————————————————————
// Tipos y configuración 
// ——————————————————————————————————————————————————————————
export interface Reward {
  id: number;
  name: string;
  probability: number;
  color: string;
  textColor?: string;
  sparkle?: boolean;
  retry?: boolean;
  emoji?: string;
}

// Configuración de premios con emojis distintivos para mejor identificación visual
const DEFAULT_REWARDS: Reward[] = [
  { id: 1, name: 'Trident', emoji: '🍬', probability: 0.145, color: '#FF4D8D', textColor: '#FFFFFF' },
  { id: 2, name: 'Cigarrillos', emoji: '🚬', probability: 0.145, color: '#9B4DFF', textColor: '#FFFFFF' },
  { id: 3, name: 'Cerebritos', emoji: '🍭', probability: 0.145, color: '#4D9EFF', textColor: '#FFFFFF' },
  { id: 4, name: 'Popcorn', emoji: '🍿', probability: 0.145, color: '#31D2F2', textColor: '#000000' },
  { id: 5, name: 'Agua', emoji: '💧', probability: 0.145, color: '#4DFFB8', textColor: '#003B2A' },
  { id: 6, name: 'Chupetines', emoji: '🍭', probability: 0.245, color: '#FFD93D', textColor: '#5F3A00' },
  { id: 7, name: 'Un Nuevo Intento', emoji: '🔄', probability: 0.03, color: '#FB923C', textColor: '#000000', sparkle: true, retry: true },
];

// ——————————————————————————————————————————————————————————
// Utilidades
// ——————————————————————————————————————————————————————————
const norm = (deg: number) => ((deg % 360) + 360) % 360;
const px = (v: number) => `${Math.round(v)}px`;

// Selección ponderada de premios
function pickWeighted(rewards: Reward[]): { reward: Reward; index: number } {
  const total = rewards.reduce((s, r) => s + (r.probability || 0), 0) || 1;
  let r = Math.random() * total;
  for (let i = 0; i < rewards.length; i++) {
    r -= rewards[i].probability || 0;
    if (r <= 0) return { reward: rewards[i], index: i };
  }
  return { reward: rewards[rewards.length - 1], index: rewards.length - 1 };
}

// Efecto confetti
function launchConfetti() {
  try {
    const canvasId = '__mini_confetti';
    let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = canvasId;
      Object.assign(canvas.style, {
        position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '9999',
      } as CSSStyleDeclaration);
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas!.width = window.innerWidth; canvas!.height = window.innerHeight; };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const w = canvas!.width, h = canvas!.height;
    const pieces = Array.from({ length: 140 }).map(() => ({
      x: Math.random() * w,
      y: -20 - Math.random() * 100,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      a: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
    }));
    let frame = 0;
    const maxFrames = 220;
    function draw() {
      frame++;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.vr;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vy += 0.08;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.a);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx!.restore();
      });
      if (frame < maxFrames) requestAnimationFrame(draw);
      else {
        window.removeEventListener('resize', onResize);
        document.body.removeChild(canvas!);
      }
    }
    requestAnimationFrame(draw);
  } catch (e) {
    console.error('Error al lanzar confeti:', e);
  }
}

// ——————————————————————————————————————————————————————————
// Componente Ruleta
// ——————————————————————————————————————————————————————————
interface RouletteProps {
  data?: Reward[];
  size?: number;
  duration?: number;
  onResult?: (reward: Reward, index: number) => void;
  disabled?: boolean;
  debug?: boolean;
  predefinedPrizeName?: string;
}

const Roulette: React.FC<RouletteProps> = ({
  data = DEFAULT_REWARDS,
  size: sizeProp,
  duration = 6000,
  onResult,
  disabled = false,
  debug = false,
  predefinedPrizeName,
}) => {
  // Referencias y estado
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoSize, setAutoSize] = useState(300);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const selectedRewardRef = useRef<{reward: Reward, index: number} | null>(null);
  const forcedIndex = useRef<number | null>(null);
  
  // Handle predefined prize
  useEffect(() => {
    if (predefinedPrizeName) {
      const prizeIndex = data.findIndex(r => r.name === predefinedPrizeName);
      if (prizeIndex !== -1) {
        forcedIndex.current = prizeIndex;
        console.log(`[Ruleta] Premio predefinido: ${predefinedPrizeName} (índice ${prizeIndex})`);
        // Automatically trigger spin
        setTimeout(() => spin(), 500);
      } else {
        console.warn(`[Ruleta] Premio predefinido "${predefinedPrizeName}" no encontrado.`);
      }
    }
  }, [predefinedPrizeName, data]);

  // Cálculos geométricos básicos
  const n = data.length;
  const segment = 360 / n;
  const diameter = sizeProp ?? autoSize;
  const radius = diameter / 2;

  // Autoajuste al tamaño del contenedor
  useEffect(() => {
    if (sizeProp) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const maxWidth = container.clientWidth * 0.95;
      const maxHeight = window.innerHeight * 0.7;
      setAutoSize(Math.max(200, Math.min(maxWidth, maxHeight)));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [sizeProp]);
  
  // CORRECCIÓN: Ajustar el offset del gradiente para alinear correctamente los colores con las etiquetas
  // 1. Generación del gradiente de color (corregido para alineación perfecta)
  const wheelGradient = useMemo(() => {
    const stops = data.map((reward, i) => {
      const startPct = (i * 100) / n;
      const endPct = ((i + 1) * 100) / n;
      // Esta sintaxis de "doble posición" crea bordes duros y nítidos entre colores,
      // eliminando el antialiasing del navegador que causa el desfase visual.
      return `${reward.color} ${startPct}% ${endPct}%`;
    });
    // El offset de -90deg asegura que el primer sector comience en la parte superior (12 en punto)
    return `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }, [data, n]);

  // 2. Cálculo de las líneas divisorias (CORREGIDO)
  const dividers = useMemo(
    () =>
      // Los separadores deben alinearse con los bordes de los sectores
      // Cada separador debe situarse en: i * segment - 90 (sin el ajuste adicional de -0.5)
      Array.from({ length: n }).map((_, i) => i * segment - 90),
    [n, segment]
  );

  // Función para calcular la rotación objetivo
  const getTargetRotation = (idx: number): number => {
    // Validación del índice
    if (idx < 0 || idx >= data.length) {
      console.error(`[Ruleta] Índice inválido: ${idx}, usando índice 0`);
      idx = 0;
    }
    
    // Cálculo puramente geométrico por sector
    const sectorCenter = (idx + 0.5) * segment;
    let base = -sectorCenter;
    
    // Aplicamos vueltas mínimas para un efecto visual satisfactorio
    const minRotations = 4;
    const currentNormalized = norm(rotation);
    let target = base;

    // Normalizar target a [0,360)
    target = norm(target);

    // Aseguramos que gire al menos las vueltas mínimas desde la posición actual
    while (target < currentNormalized + 360 * minRotations) {
      target += 360;
    }
    
    return target;
  };

  // Función para girar la ruleta
  const spin = () => {
    if (spinning || disabled) return;
    
    // Determinar el premio (forzado o aleatorio)
    let selectedIndex: number;
    let selectedReward: Reward;
    
    if (forcedIndex.current !== null) {
      selectedIndex = forcedIndex.current;
      
      if (selectedIndex >= 0 && selectedIndex < data.length) {
        selectedReward = data[selectedIndex];
        console.log(`[Ruleta] Usando premio forzado: ${selectedReward.name} (índice ${selectedIndex})`);
      } else {
        console.warn(`[Ruleta] Índice forzado inválido: ${selectedIndex}, usando selección aleatoria`);
        const result = pickWeighted(data);
        selectedIndex = result.index;
        selectedReward = result.reward;
      }
      
      forcedIndex.current = null;
    } else {
      const result = pickWeighted(data);
      selectedIndex = result.index;
      selectedReward = result.reward;
    }
    
    // IMPORTANTE: Almacenamos la selección original en una referencia estable
    selectedRewardRef.current = {
      reward: selectedReward,
      index: selectedIndex
    };
    
    // Iniciar animación
    console.log(`[Ruleta] Girando hacia premio: ${selectedReward.name} (índice ${selectedIndex})`);
    setSpinning(true);
    
    // Calcular rotación objetivo
    const target = getTargetRotation(selectedIndex);
    setRotation(target);
    
    // Finalizar el giro después de la animación
    window.setTimeout(() => {
      setSpinning(false);
      
      // Usar SIEMPRE el premio almacenado en la referencia, para evitar
      // cualquier posible problema de "race condition" o actualización de estado
      if (selectedRewardRef.current) {
        const finalReward = selectedRewardRef.current.reward;
        const finalIndex = selectedRewardRef.current.index;
        
        // Establecemos el premio ganador
        setReward(finalReward);
        
        if (finalReward.sparkle) {
          launchConfetti();
        }
        
        console.log(`[Ruleta] Premio final: ${finalReward.name}`);
        onResult?.(finalReward, finalIndex);
      }
    }, duration);
  };

  return (
    <div ref={containerRef} className="relative" suppressHydrationWarning>
      {/* Indicador de premio en la parte superior */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20 pointer-events-none"
        suppressHydrationWarning
      >
        <div className="relative">
          {/* Triángulo indicador */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[15px]">
            <div className="w-0 h-0 
                      border-l-[16px] border-l-transparent
                      border-r-[16px] border-r-transparent
                      border-t-[24px] border-t-amber-500
                      filter drop-shadow-lg"></div>
          </div>

          {/* Base circular */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 -translate-y-[24px]
                       w-8 h-8 rounded-full bg-white border-[3px] border-amber-500 
                       shadow-md z-20"></div>
          
          {/* Texto "PREMIO" */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 translate-y-[6px]
                        bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full
                        shadow-md z-30">PREMIO</div>
          
          {/* Efecto de pulso */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 -translate-y-[24px]
                        w-16 h-8 opacity-0
                        animate-ping rounded-full bg-amber-500/30"></div>
        </div>
      </div>
      
      {/* Contenedor principal de la ruleta */}
      <div
        className="relative mx-auto rounded-full overflow-hidden aspect-square"
        style={{ width: px(diameter), height: px(diameter) }}
        suppressHydrationWarning
      >
        {/* Ruleta giratoria */}
        <motion.div
          className="relative w-full h-full"
          animate={{ rotate: rotation }}
          initial={{ rotate: 0 }} 
          transition={{ 
            duration: duration / 1000, 
            type: 'spring', 
            bounce: 0.1, 
            damping: 15,
            stiffness: 20,
            mass: 1.5
          }}
          suppressHydrationWarning
        >
          {/* Disco de color */}
          <motion.div
            className="w-full h-full"
            style={{
              background: wheelGradient,
              boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.1)',
            }}
            suppressHydrationWarning
          ></motion.div>

          {/* Líneas divisorias (CORREGIDAS) */}
          {dividers.map((angle, i) => (
            <div
              key={`divider-${i}`}
              className="absolute top-1/2 left-1/2 w-[50%] h-[1px] origin-left bg-white/20 -translate-y-1/2"
              style={{ transform: `translateY(-50%) rotate(${angle}deg)` }}
            />
          ))}

          {/* Etiquetas de premios con emojis (corregidas para alineación) */}
          {data.map((reward, i) => {
            // CORRECCIÓN: Ajustamos el ángulo para alinear con el nuevo gradiente
            // El centro del sector debe estar en el centro de cada segmento de color
            // Usamos -90° porque el gradiente empieza en -90deg (parte superior)
            const angleCenter = (i * segment + segment / 2) - 90; 
            const aFinal = norm(angleCenter);
            const isFlipped = aFinal > 90 && aFinal < 270;
            
            // Calculamos el ancho máximo para la etiqueta
            const labelRadius = radius * 0.68;
            const segRad = (segment * Math.PI) / 180;
            const maxWidth = Math.floor(2 * labelRadius * Math.sin(segRad / 2) * 0.82);

            return (
              <div
                key={`label-${i}`}
                className="absolute left-1/2 top-1/2"
                data-label-index={i}
                style={{ 
                  transform: `rotate(${angleCenter}deg) translate(${px(labelRadius)})`, 
                  transformOrigin: '0 0'
                }}
              >
                <span
                  className="block text-center text-[clamp(10px,1.7vw,18px)] font-semibold leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] break-words whitespace-normal"
                  style={{
                    width: px(maxWidth),
                    transform: `translateX(-50%) rotate(${isFlipped ? 180 : 0}deg)`,
                    color: reward.textColor || '#111',
                  }}
                >
                  {reward.emoji ? `${reward.emoji} ${reward.name}` : reward.name}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Botón central */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] h-[28%] rounded-full bg-white/95 border border-white/70 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center" suppressHydrationWarning>
          <button
            onClick={spin}
            disabled={spinning || disabled}
            className="px-5 py-2 rounded-full text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            style={{ background: 'linear-gradient(180deg,#f59e0b,#ea580c)' }}
          >
            {spinning ? 'Girando…' : 'Girar'}
          </button>
        </div>
      </div>

      {/* Información de probabilidades */}
      <AnimatePresence>
        {!spinning && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 text-center text-sm text-white/90"
          >
            <div className="opacity-80" suppressHydrationWarning>
              {`Probabilidades: Chupetines ${Math.round((data.find(d=>d.name==='Chupetines')?.probability||0)*100)}%, Nuevo intento ${Math.round((data.find(d=>d.retry)?.probability||0)*100)}%`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de premio ganador */}
      {spinning === false && reward && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 
                     dark:from-amber-900/50 dark:to-amber-800/50
                     border border-amber-200 dark:border-amber-700
                     shadow-lg text-center"
          suppressHydrationWarning
        >
          <div className="text-sm opacity-70 mb-1">¡Premio ganador!</div>
          <div 
            className="text-xl font-bold" 
            style={{ 
              color: reward.color, 
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: `${reward.color}20`
            }}
          >
            {reward.emoji ? `${reward.emoji} ${reward.name}` : reward.name}
          </div>
          <div className="text-xs mt-2 opacity-80">
            {reward.retry ? '¡Puedes volver a girar!' : 'Reclama tu premio con un organizador'}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Roulette;