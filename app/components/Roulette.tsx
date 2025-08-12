'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ——————————————————————————————————————————————————————————
// Tipos y configuración (traídos de V1)
// ——————————————————————————————————————————————————————————
export interface Reward {
  id: number; // índice (1-based)
  name: string; // etiqueta visible
  probability: number; // peso relativo (suma ≈ 1)
  color: string; // color de segmento
  textColor?: string; // color del texto del label
  sparkle?: boolean; // efecto confetti al ganar
  retry?: boolean; // semántica de "nuevo intento"
}

// Mismo orden, colores y distribución de V1
const DEFAULT_REWARDS_V1: Reward[] = [
  { id: 1, name: 'Trident',       probability: 0.145, color: '#FF4D8D', textColor: '#FFFFFF' },
  { id: 2, name: 'Cigarrillos',   probability: 0.145, color: '#9B4DFF', textColor: '#FFFFFF' },
  { id: 3, name: 'Cerebritos',    probability: 0.145, color: '#4D9EFF', textColor: '#FFFFFF' },
  { id: 4, name: 'Popcorn',       probability: 0.145, color: '#31D2F2', textColor: '#000000' },
  { id: 5, name: 'Agua',          probability: 0.145, color: '#4DFFB8', textColor: '#003B2A' },
  { id: 6, name: 'Chupetines',    probability: 0.245, color: '#FFD93D', textColor: '#5F3A00' },
  { id: 7, name: 'Un Nuevo Intento', probability: 0.03, color: '#FB923C', textColor: '#000000', sparkle: true, retry: true },
];

// ——————————————————————————————————————————————————————————
// Utilidades (ponderación V1 + geometría V2)
// ——————————————————————————————————————————————————————————
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const norm = (deg: number) => ((deg % 360) + 360) % 360;

function pickWeighted(rewards: Reward[]): { reward: Reward; index: number } {
  const total = rewards.reduce((s, r) => s + (r.probability || 0), 0) || 1;
  let r = Math.random() * total;
  for (let i = 0; i < rewards.length; i++) {
    r -= rewards[i].probability || 0;
    if (r <= 0) return { reward: rewards[i], index: i };
  }
  return { reward: rewards[rewards.length - 1], index: rewards.length - 1 };
}

// Confetti liviano (traído y simplificado de V1)
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
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.a += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (frame < maxFrames) requestAnimationFrame(draw); else {
        window.removeEventListener('resize', onResize);
        canvas?.remove();
      }
    }
    requestAnimationFrame(draw);
  } catch { /* noop */ }
}

// ——————————————————————————————————————————————————————————
// Props del componente unificado
// ——————————————————————————————————————————————————————————
interface RouletteUnifiedProps {
  rewards?: Reward[]; // si no se pasa, usa DEFAULT_REWARDS_V1
  onResult?: (reward: Reward, index: number) => void;
  size?: number; // si no se define, se autoajusta al contenedor
  fixedSectors?: number; // normalmente 7
  durationMs?: number; // V1 ≈ 5200ms
  disabled?: boolean;
  debug?: boolean; // imprime tabla de ángulos y guía visual
}

// ——————————————————————————————————————————————————————————
// Componente principal (geometría V2 + reglas V1)
// ——————————————————————————————————————————————————————————
const RouletteUnified: React.FC<RouletteUnifiedProps> = ({
  rewards = DEFAULT_REWARDS_V1,
  onResult,
  size,
  fixedSectors = 7,
  durationMs = 5200,
  disabled = false,
  debug = false,
}) => {
  // Normalización exacta del número de sectores (estilo V2)
  const data = useMemo<Reward[]>(() => {
    const src = Array.isArray(rewards) && rewards.length > 0 ? rewards : DEFAULT_REWARDS_V1;
    if (fixedSectors && fixedSectors > 0) {
      const out: Reward[] = [];
      for (let i = 0; i < fixedSectors; i++) out.push(src[i % src.length]);
      return out;
    }
    return src;
  }, [rewards, fixedSectors]);

  const n = data.length;
  const segment = 360 / n;

  // Responsivo (si no hay size explícito)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoSize, setAutoSize] = useState<number>(420);
  useEffect(() => {
    if (size) return; // si viene fijo no observar
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = (e.contentBoxSize as any)?.[0]?.inlineSize || e.contentRect.width || el.clientWidth;
        setAutoSize(clamp(Math.floor(w), 260, 560));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  const diameter = size ?? autoSize;
  const radius = diameter / 2;

  // Estado de animación (estilo V2)
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const lastTarget = useRef(0);

  // En CSS conic-gradient 0deg ya apunta a las 12 en punto, así que OFFSET=0
  const OFFSET = 0;

  // Gradiente cónico exacto (sin offset interno; lo compensa el wrapper)
  const wheelGradient = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i < n; i++) {
      const color = data[i].color ?? `hsl(${(i * 360) / n}, 70%, 50%)`;
      const start = i * segment;
      const end = (i + 1) * segment;
      stops.push(`${color} ${start}deg ${end}deg`);
    }
    return `conic-gradient(from 0deg, ${stops.join(', ')})`;
  }, [n, segment, data]);

  // Líneas divisorias
  const dividers = useMemo(() => Array.from({ length: n }).map((_, i) => i * segment), [n, segment]);

  // Ángulo objetivo para que el CENTRO del sector quede en el puntero (12h)
  const getTargetRotation = (idx: number) => {
    const jitter = (Math.random() - 0.5) * (segment * 0.5); // pequeño jitter dentro del sector
  const thetaCenter = (idx + 0.5) * segment + jitter; // centro del sector
  const base = -(thetaCenter); // rotación necesaria para llevar centro al puntero (12h)
    const current = rotation;
    let target = base;
    const minAhead = current + 360 * 3; // ≥ 3 vueltas completas
    while (target < minAhead) target += 360;
    return target;
  };

  // Spin usando la selección ponderada de V1
  const spin = () => {
    if (spinning || disabled) return;
    const { reward, index } = pickWeighted(data);
    setSpinning(true);
    const target = getTargetRotation(index);
    lastTarget.current = target;
    setRotation(target);

    window.setTimeout(() => {
      setSpinning(false);
      // Efectos V1
      try { if ('vibrate' in navigator) (navigator as any).vibrate?.(70); } catch {}
      if (reward.sparkle) launchConfetti();
      onResult?.(reward, index);
    }, durationMs);
  };

  // Debug: tabla de ángulos visibles (ya con offset aplicado en escena)
  useEffect(() => {
    if (!debug) return;
    const rows = data.map((p, i) => ({
      i,
      name: p.name,
      start: norm(i * segment),
      center: norm((i + 0.5) * segment),
      end: norm((i + 1) * segment),
    }));
    // eslint-disable-next-line no-console
    console.table(rows);
  }, [debug, data, segment]);

  // Helpers de estilo
  const px = (v: number) => `${v}px`;

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none" style={{ minHeight: px(diameter + 120) }}>
      <div className="relative" style={{ width: px(diameter), height: px(diameter) }}>
        {/* Marcador superior (puntero hacia abajo) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[22%] z-20">
          <div className="relative w-[30px] h-[45px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[26px] h-[36px] drop-shadow-lg">
              <path d="M12 22 L4 8 H20 Z" fill="#fb923c" />
            </svg>
            <div className="absolute top-[-6px] w-[10px] h-[10px] bg-[#fb923c] rounded-full" />
          </div>
        </div>

        {/* Wrapper con OFFSET fijo a -90° (mueve el 0° del gradiente a 12 en punto) */}
        <motion.div
          className="absolute inset-0 rounded-full"
        >
          {/* Disco que gira */}
          <motion.div
            className="absolute inset-0 rounded-full border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            style={{ background: wheelGradient, willChange: 'transform' }}
            animate={{ rotate: rotation }}
            transition={{ duration: durationMs / 1000, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {/* Separadores precisos */}
            {dividers.map((deg, i) => (
              <div
                key={`divider-${i}`}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)`, transformOrigin: '50% 50%' }}
              >
                <div
                  className="absolute bg-white/90"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '1.5px',
                    height: px(radius * 0.92),
                    transform: 'translate(-50%, -100%)',
                    transformOrigin: 'center bottom',
                  }}
                />
              </div>
            ))}

            {/* Etiquetas radiales (con flip para lado izquierdo) */}
            {data.map((reward, i) => {
              const angleCenter = (i + 0.5) * segment; // sin offset
              const aFinal = norm(angleCenter); // para decidir flip ya en la escena final
              const isFlipped = aFinal > 90 && aFinal < 270;

              const labelRadius = radius * 0.68;
              const segRad = (segment * Math.PI) / 180;
              const maxWidth = Math.floor(2 * labelRadius * Math.sin(segRad / 2) * 0.82);

              return (
                <div
                  key={`label-${i}`}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `rotate(${angleCenter}deg) translate(${px(labelRadius)})`, transformOrigin: '0 0' }}
                >
                  <span
                    className="block text-center text-[clamp(10px,1.7vw,18px)] font-semibold leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] break-words whitespace-normal"
                    style={{
                      width: px(maxWidth),
                      transform: `translateX(-50%) rotate(${isFlipped ? 180 : 0}deg)`,
                      color: reward.textColor || '#111',
                    }}
                  >
                    {reward.name}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Centro / botón */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] h-[28%] rounded-full bg-white/95 border border-white/70 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center">
            <button
              onClick={spin}
              disabled={spinning || disabled}
              className="px-5 py-2 rounded-full text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
              style={{ background: 'linear-gradient(180deg,#f59e0b,#ea580c)' }}
            >
              {spinning ? 'Girando…' : 'Girar'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mensajería opcional (retry / sparkle) */}
      <AnimatePresence>
        {!spinning && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 text-center text-sm text-white/90"
          >
            <div className="opacity-80">{`Probabilidades cargadas como en V1 (Chupetines ${Math.round((data.find(d=>d.name==='Chupetines')?.probability||0)*100)}%, Nuevo intento ${Math.round((data.find(d=>d.retry)?.probability||0)*100)}%).`}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {debug && (
        <div className="mt-4 text-xs text-white/80 font-mono grid grid-cols-3 gap-x-4 gap-y-1">
          {data.map((r, i) => (
            <React.Fragment key={`dbg-${i}`}>
              <div>#{i + 1} {r.name}</div>
              <div>start: {Math.round(norm(i * segment))}°</div>
              <div>end: {Math.round(norm((i + 1) * segment))}°</div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouletteUnified;

// ——————————————————————————————————————————————————————————
// Dev harness opcional (para pruebas locales)
// ——————————————————————————————————————————————————————————
export const RouletteUnifiedDev: React.FC = () => {
  const [last, setLast] = useState<Reward | null>(null);
  return (
    <div className="w-full flex flex-col items-center gap-4 p-4">
      <RouletteUnified debug onResult={(r)=>setLast(r)} />
      <div className="text-white/90 text-sm">Último premio: <b>{last?.name ?? '(aún ninguno)'}</b></div>
    </div>
  );
};
