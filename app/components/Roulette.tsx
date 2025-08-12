'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  { id: 1, name: 'Trident', probability: 0.145, color: '#FF4D8D' },
  { id: 2, name: 'Cigarrillos', probability: 0.145, color: '#9B4DFF' },
  { id: 3, name: 'Cerebritos', probability: 0.145, color: '#4D9EFF' },
  { id: 4, name: 'Popcorn', probability: 0.145, color: '#31D2F2' },
  { id: 5, name: 'Agua', probability: 0.145, color: '#4DFFB8', textColor: '#065F46' },
  { id: 6, name: 'Chupetines', probability: 0.245, color: '#FFD93D', textColor: '#7A4E00' },
  { id: 7, name: 'Un Nuevo Intento', probability: 0.03, color: '#FB923C', sparkle: true, retry: true },
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
  const segments = rewards.map((reward, index) => {
    const angle = (360 / rewards.length);
    const rotate = index * angle;
    const textAngle = -rotate - (angle/2);
    const labelRadius = 42; // % desde centro
    return (
      <div
        key={reward.id}
        className="absolute inset-0"
        style={{
          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rotate - angle/2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate - angle/2) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotate + angle/2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate + angle/2) * Math.PI / 180)}%)`,
          background: reward.sparkle
            ? `repeating-conic-gradient(from ${rotate}deg, ${reward.color} 0deg, ${reward.color} 6deg, ${reward.color}CC 6deg, ${reward.color}CC 12deg)`
            : reward.color,
          transform: `rotate(${rotate}deg)`
        }}
      >
        <div
          className="absolute font-semibold text-[10px] sm:text-xs md:text-sm flex flex-col items-center"
          style={{
            top: '50%', left: '50%',
            transform: `rotate(${rotate}deg) translate(-50%, -50%)`,
            color: reward.textColor || '#fff'
          }}
        >
          <div
            style={{
              transform: `rotate(${textAngle}deg) translateY(-${labelRadius}%)`,
              textAlign: 'center',
              width: '90px'
            }}
            className="drop-shadow-sm leading-tight px-1"
          >
            {reward.name}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-72 sm:w-[22rem] sm:h-[22rem] mb-10 select-none">
        {/* Marcador superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[18%] z-20">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[30px] border-b-fiesta-orange drop-shadow-md"></div>
        </div>
        {/* Brillo / aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/60 via-white/0 to-white/0 pointer-events-none"></div>
        {/* Ruleta */}
        <motion.div
          ref={wheelRef}
          className={`w-full h-full rounded-full relative overflow-hidden border-[6px] border-white shadow-[0_0_0_4px_rgba(0,0,0,0.1)] bg-slate-100 dark:bg-slate-800 ${spinning ? 'animate-pulse-slow' : ''}`}
          animate={{ rotate: rotation }}
          transition={{ duration: 5.2, ease: 'easeOut' }}
        >
          {/* Borde interno decorativo */}
            <div className="absolute inset-2 rounded-full border-[3px] border-white/40 z-10"></div>
            {segments}
            {/* Botón central */}
            <button
              onClick={spin}
              disabled={spinning || disabled}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full font-bold text-sm tracking-wide flex flex-col items-center justify-center transition-all shadow-lg border-4 border-white/60 
               ${spinning || disabled ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-fiesta-purple hover:scale-110 hover:rotate-1 active:scale-95 text-white'}`}
            >
              {spinning ? <>
                <span className="text-[11px]">Girando</span>
                <span className="text-[10px] opacity-80">...</span>
              </> : <>
                <span className="text-[12px]">GIRAR</span>
                <span className="text-[10px]">Ahora</span>
              </>}
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
            className="relative mt-2 px-6 py-4 rounded-token-lg bg-gradient-to-r from-fiesta-blue/10 via-white to-fiesta-pink/10 dark:from-fiesta-blue/20 dark:via-gray-800 dark:to-fiesta-pink/20 border border-white/40 backdrop-blur-sm shadow-party-md text-center"
          >
            <motion.h3
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-xl font-heading font-bold mb-1"
            >
              {result.retry ? '¡Nuevo Intento!' : '¡Ganaste!'}
            </motion.h3>
            <p className="text-fiesta-purple font-extrabold text-2xl drop-shadow-sm">{result.name}</p>
      {result.retry && (
              <div className="mt-3 flex justify-center gap-2 text-amber-500 text-sm">
        <span className="animate-pulse">↺</span><span>Vuelve a girar</span><span className="animate-pulse">↺</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
