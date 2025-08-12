'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Estilos CSS para animaciones adicionales
const styles = `
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}
.animate-bounce {
  animation: bounce 0.5s infinite;
}
.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
`;

// Pequeño confetti lightweight (sin dependencia externa)
function launchConfetti() {
  try {
    const canvasId = '__mini_confetti';
    let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
  if (!ctx) return;
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * -40,
      r: 6 + Math.random() * 6,
      c: ['#FF4D8D','#9B4DFF','#4D9EFF','#4DFFB8','#FFB347','#FFD93D','#31D2F2'][Math.floor(Math.random()*7)],
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      a: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
    }));
    let frame = 0;
    function draw() {
      frame++;
      if (!ctx) return; // seguridad
      ctx.clearRect(0,0,w,h);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
        ctx.restore();
      }
      if (frame < 180) requestAnimationFrame(draw); else setTimeout(()=>canvas && canvas.remove(), 600);
    }
    draw();
  } catch {}
}

interface Reward {
  id: number; // índice (1-based)
  name: string; // nombre a mostrar
  probability: number; // peso relativo
  color: string; // color de fondo del segmento
  textColor?: string; // opcional para contraste
  sparkle?: boolean; // resaltar segmento especial
  retry?: boolean; // si permite volver a girar sin consumir el intento
}

// Siete segmentos: los 6 premios conocidos + un "Premio Especial" (placeholder). Ajustar label si deseas otro.
// Probabilidades basadas en la distribución diaria (aprox) y un pequeño peso para el especial.
// Distribución original (104): cada uno 16 (≈15.38%) excepto Chupetines 24 (≈23.08%).
// Añadimos Especial con 2% y reducimos ligeramente los demás proporcionalmente.
const wheelRewards: Reward[] = [
  { id: 1, name: 'Trident', probability: 0.145, color: '#FF4D8D', textColor: '#FFFFFF' },
  { id: 2, name: 'Cigarrillos', probability: 0.145, color: '#9B4DFF', textColor: '#FFFFFF' },
  { id: 3, name: 'Cerebritos', probability: 0.145, color: '#4D9EFF', textColor: '#FFFFFF' },
  { id: 4, name: 'Popcorn', probability: 0.145, color: '#31D2F2', textColor: '#000000' },
  { id: 5, name: 'Agua', probability: 0.145, color: '#4DFFB8', textColor: '#065F46' },
  { id: 6, name: 'Chupetines', probability: 0.245, color: '#FFD93D', textColor: '#7A4E00' },
  { id: 7, name: 'Un Nuevo Intento', probability: 0.03, color: '#FB923C', textColor: '#000000', sparkle: true, retry: true },
];

interface RouletteProps {
  onResult: (reward: Reward) => void;
  disabled?: boolean;
  rewardsOverride?: Reward[]; // permitir pasar otra lista si se requiere
}

export default function Roulette({ onResult, disabled = false, rewardsOverride }: RouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const rewards = rewardsOverride && rewardsOverride.length >= 2 ? rewardsOverride : wheelRewards;
  const totalProbability = rewards.reduce((a, r) => a + r.probability, 0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Inyectamos los estilos CSS
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Función para determinar la recompensa basada en probabilidades
  const determineReward = (): Reward => {
    const random = Math.random() * totalProbability;
    let cumulative = 0;
    for (const r of rewards) {
      cumulative += r.probability;
      if (random <= cumulative) return r;
    }
    return rewards[rewards.length - 1];
  };
  
  // Función para girar la ruleta
  const spin = () => {
    if (spinning || disabled) return;
    
    setSpinning(true);
    setResult(null);
    
  // Determinamos el resultado de antemano (puede vibrar ligero)
  const selectedReward = determineReward();
  if (navigator?.vibrate) navigator.vibrate(10);
    
    // Calculamos la posición final basada en el resultado
    // Cada premio tiene un segmento de (360 / rewards.length) grados
  const segmentSize = 360 / rewards.length;
  const rewardIndex = rewards.findIndex(r => r.id === selectedReward.id);
    
    // Calculamos la posición final para que el premio quede en la parte superior
    // Agregamos un desplazamiento aleatorio dentro del segmento para más realismo
    const offset = Math.random() * (segmentSize * 0.5) - (segmentSize * 0.25);
  // 3 vueltas completas (1080) + ángulo centrado del segmento seleccionado
  const endPosition = 1440 + (rewardIndex * segmentSize) + (segmentSize / 2) + offset;
    
    // Animamos la ruleta
    setRotation(endPosition);
    
    // Una vez que termine la animación, mostrar el resultado
    setTimeout(() => {
      setSpinning(false);
      setResult(selectedReward);
      onResult(selectedReward);
      if (selectedReward.sparkle) {
        launchConfetti();
        if (navigator?.vibrate) navigator.vibrate([40,40,80]);
      }
    }, 5200); // Duración de la animación
  };

  // Generar los segmentos de la ruleta
  // Construimos un degradado cónico con todos los colores para la apariencia circular
  const segmentAngle = 360 / rewards.length;
  const conicGradient = rewards.map((reward, index) => {
    const start = index * segmentAngle;
    const end = (index + 1) * segmentAngle;
    return `${reward.color} ${start}deg ${end}deg`;
  }).join(', ');

  // Generamos los segmentos individuales para los textos
  const segments = rewards.map((reward, index) => {
    const angle = (360 / rewards.length);
    const rotate = index * angle;
    const textAngle = -rotate - (angle/2);
    const labelRadius = 40; // % desde centro
    
    // Calculamos la posición del texto en coordenadas polares
    const textRadiusPercent = 64; // distancia desde el centro (0-100%)
    const textRotateRad = ((rotate + angle/2) * Math.PI) / 180;
    const textX = 50 + textRadiusPercent * Math.cos(textRotateRad);
    const textY = 50 + textRadiusPercent * Math.sin(textRotateRad);
    
    return (
      <div
        key={reward.id}
        className="absolute"
        style={{
          top: `${textY}%`,
          left: `${textX}%`,
          transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
          width: '80px',
          height: '20px',
          zIndex: 15
        }}
      >
        <div
          className={`text-center font-bold text-[10px] sm:text-xs md:text-sm drop-shadow-md ${reward.sparkle ? 'animate-pulse-slow' : ''}`}
          style={{
            color: reward.textColor || '#fff',
            textShadow: '0px 1px 2px rgba(0,0,0,0.7)',
            lineHeight: 1.1
          }}
        >
          {reward.name}
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-80 h-80 sm:w-[26rem] sm:h-[26rem] mb-10 select-none" style={{ touchAction: 'manipulation' }}>
        {/* Marcador superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[20%] z-20">
          <div className="relative w-[30px] h-[45px] flex items-center justify-center">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[35px] border-b-fiesta-orange drop-shadow-lg"></div>
            <div className="absolute bottom-[-2px] w-[4px] h-[16px] bg-white rounded-full"></div>
          </div>
        </div>
        {/* Brillo / aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/60 via-white/0 to-white/0 pointer-events-none"></div>
        {/* Ruleta */}
        <motion.div
          ref={wheelRef}
          className={`w-full h-full rounded-full relative overflow-hidden border-[6px] border-white shadow-[0_0_0_6px_rgba(0,0,0,0.15)] ${spinning ? 'animate-pulse-slow' : ''}`}
          animate={{ rotate: rotation }}
          transition={{ 
            duration: 5.2, 
            ease: [0.11, 0.95, 0.27, 0.99],  // Curva personalizada para mejor sensación
            type: "tween" 
          }}
          style={{ 
            pointerEvents: 'all',
            background: `conic-gradient(${conicGradient})`,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
          }}
        >
          {/* Líneas divisorias entre segmentos */}
          {rewards.map((_, index) => {
            const rotate = index * segmentAngle;
            return (
              <div 
                key={`line-${index}`}
                className="absolute top-0 left-1/2 w-[2px] h-1/2 origin-bottom bg-white/30"
                style={{
                  transform: `translateX(-50%) rotate(${rotate}deg)`,
                  boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                  zIndex: 12
                }}
              />
            );
          })}
          
          {/* Borde interno decorativo */}
          <div className="absolute inset-8 rounded-full border-[3px] border-white/50 z-11 bg-white/5 backdrop-blur-[1px]"></div>
          
          {/* Círculo central */}
          <div className="absolute inset-0 m-auto w-[35%] h-[35%] rounded-full bg-white/80 z-15 shadow-lg border-4 border-white/90"></div>
          
          {segments}
            {/* Botón central */}
            <button
              onClick={spin}
              disabled={spinning || disabled}
              style={{zIndex: 30, pointerEvents: 'auto'}}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full font-bold tracking-wide flex flex-col items-center justify-center transition-all shadow-lg border-4 
               ${spinning || disabled 
                ? 'bg-gray-400 cursor-not-allowed text-white border-white/40' 
                : 'bg-gradient-to-br from-fiesta-purple to-fiesta-pink hover:scale-110 hover:rotate-1 active:scale-95 text-white border-white/80'}`}
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none"></div>
              
              {spinning ? (
                <div className="flex flex-col items-center">
                  <span className="text-base font-semibold">Girando</span>
                  <div className="mt-1 flex gap-1">
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-lg font-extrabold tracking-wider">GIRAR</span>
                  <span className="text-xs opacity-90 mt-0.5">¡Buena Suerte!</span>
                </div>
              )}
            </button>
        </motion.div>
      </div>
      <AnimatePresence>
        {result && (
          <motion.div
            key="res-panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
            className="relative mt-6 px-8 py-6 rounded-xl bg-gradient-to-r from-fiesta-blue/10 via-white to-fiesta-pink/10 dark:from-fiesta-blue/20 dark:via-gray-800 dark:to-fiesta-pink/20 border border-white/60 backdrop-blur-md shadow-2xl text-center w-full max-w-xs"
            style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.1), 0 0 20px rgba(255,255,255,0.4)',
              background: result.retry 
                ? 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(255,255,255,0.8) 50%, rgba(251,146,60,0.15) 100%)' 
                : 'linear-gradient(135deg, rgba(157,23,77,0.1) 0%, rgba(255,255,255,0.8) 50%, rgba(147,51,234,0.1) 100%)'
            }}
          >
            <motion.div 
              className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2"
              style={{ 
                borderColor: result.color,
                backgroundColor: result.color + '20' 
              }}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <span className="text-xl">{result.retry ? '↺' : '🎁'}</span>
            </motion.div>
            
            <motion.h3
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-heading font-bold mb-2"
              style={{ color: result.retry ? '#C2410C' : '#9D174D' }}
            >
              {result.retry ? '¡Nuevo Intento!' : '¡Ganaste!'}
            </motion.h3>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 dark:bg-white/20 rounded-lg py-3 px-4 mb-2"
            >
              <p className="text-fiesta-purple font-extrabold text-2xl drop-shadow-sm">{result.name}</p>
            </motion.div>
            
            {result.retry && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-3 flex justify-center gap-2 text-amber-600 font-semibold"
              >
                <span className="animate-pulse">↺</span>
                <span>Vuelve a girar</span>
                <span className="animate-pulse">↺</span>
              </motion.div>
            )}
            
            {!result.retry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-500 text-sm mt-2"
              >
                Retira tu premio en la barra
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
