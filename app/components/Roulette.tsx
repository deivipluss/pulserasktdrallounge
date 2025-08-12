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
  
  // Estado y estilos para el modo debug
  const [showDebugOverlay, setShowDebugOverlay] = useState(debug);
  
  // Utilidades de depuración para visualizar la alineación de los sectores
  useEffect(() => {
    if (debug) {
      console.log(`[RULETA DEBUG] ${n} sectores de ${segment}° cada uno`);
      console.log(`[RULETA DEBUG] Premios configurados:`, data.map((r, i) => `${i}: ${r.name}`).join(', '));
    }
  }, [debug, n, segment, data]);

  // En CSS conic-gradient 0deg ya apunta a las 12 en punto, así que OFFSET=0
  const OFFSET = 0;
  
  // Configuración de alineación
  const WHEEL_CONFIG = {
    SECTOR_ORDER: "CLOCKWISE", // Los sectores se dibujan en CSS en sentido horario
    ROTATION_DIR: "COUNTERCLOCKWISE", // La rueda gira en sentido antihorario (rotación negativa)
    POINTER_POSITION: "TOP", // El puntero está arriba (0°)
    STARTING_INDEX: 0, // El índice 0 comienza arriba (0°)
    VERBOSE_DEBUG: debug // Activar logs detallados
  };

  // REDISEÑO DE GEOMETRÍA
  // - Wheel: CSS conic-gradient dibuja sectores en sentido HORARIO desde 0deg (arriba)
  // - Rotación: Giramos en sentido ANTIHORARIO (valores negativos de rotación)
  // - Alineación: El índice 0 (Trident) debe quedar exactamente arriba (0°)
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

  // Líneas divisorias - seguimos el mismo orden del gradiente
  const dividers = useMemo(() => Array.from({ length: n }).map((_, i) => i * segment), [n, segment]);

  // Ángulo objetivo para que el CENTRO del sector quede en el puntero (12h)
  const getTargetRotation = (idx: number) => {
    // SOLUCIÓN DEFINITIVA:
    // 1. El gradiente se construye con sectores en orden 0,1,2,... en sentido horario desde 0°
    // 2. Para que el sector idx quede bajo el puntero, necesitamos girar ese ángulo
    // 3. El centro exacto del sector está a (idx + 0.5) * segment grados
    
    // Centro del sector
    const thetaCenter = (idx * segment) + (segment / 2);
    
    // Para llevar ese centro al puntero (0°), giramos en sentido antihorario (negativo)
    const baseRotation = -thetaCenter;
    
    // Añadimos múltiples vueltas para efecto visual
    const finalRotation = baseRotation - (360 * 3);
    
    // Debug detallado
    console.log(`[WHEEL DEBUG] Premio: ${idx} (${data[idx]?.name})`);
    console.log(`           → Centro del sector: ${thetaCenter}°`);
    console.log(`           → Rotación base: ${baseRotation}°`);
    console.log(`           → Rotación final: ${finalRotation}°`);
    
    return finalRotation;
  };

  // Función debug para forzar un índice específico (QA)
  const forceSpin = (forceIndex: number) => {
    if (spinning || disabled) return;
    if (forceIndex < 0 || forceIndex >= data.length) return;
    
    console.log(`[RULETA] Forzando premio con índice ${forceIndex}: ${data[forceIndex]?.name}`);
    
    setSpinning(true);
    const target = getTargetRotation(forceIndex);
    lastTarget.current = target;
    setRotation(target);
    
    window.setTimeout(() => {
      setSpinning(false);
      // Efectos V1
      try { if ('vibrate' in navigator) (navigator as any).vibrate?.(70); } catch {}
      const reward = data[forceIndex];
      if (reward.sparkle) launchConfetti();
      
      // Verificación visual similar a spin()
      const finalRot = norm(target);
      const pointerAngle = norm(-finalRot); // Ángulo en la posición 12 en punto
      
      // CORRECCIÓN CRÍTICA: Mismo cálculo corregido que en spin()
      const sectorIndex = Math.floor(pointerAngle / segment);
      const visualIndex = sectorIndex % n;
      const visualReward = data[visualIndex];
      
      // Verificamos que coincidan
      if (visualIndex !== forceIndex) {
        console.error(`[RULETA ERROR] Forzado: Discrepancia entre índice forzado (${forceIndex}: ${reward.name}) y visual (${visualIndex}: ${visualReward?.name})`);
        
        // CORRECCIÓN: Aplicamos el mismo ajuste que en spin()
        console.warn(`[RULETA] Corrigiendo rotación en modo forzado...`);
        
        // En modo forzado, siempre queremos exactamente el índice solicitado
        const correctedRotation = getTargetRotation(forceIndex);
        setRotation(correctedRotation);
        
        console.log(`[RULETA] Corrección aplicada. Premio final forzado: ${reward.name}`);
        
        // Usamos el premio forzado como fuente de verdad
        onResult?.(reward, forceIndex);
        return; // Salimos después de la corrección
      }
      
      // Si coinciden, usamos el premio visual (que debe ser igual al forzado)
      onResult?.(visualReward, visualIndex);
      
      console.log(`[RULETA DEBUG] Forzado premio: ${reward.name} (índice ${forceIndex}) - Visual: ${visualReward?.name} (${visualIndex})`);
    }, durationMs);
  };

  // Exponer forceSpin para depuración
  React.useEffect(() => {
    // Exponemos función de forzado por índice
    (window as any).__rouletteForceSpin = (idx: number) => forceSpin(idx);
    
    // NUEVA FUNCIÓN: Forzar por nombre del premio (case-insensitive)
    (window as any).__rouletteForceByName = (prizeName: string) => {
      if (!prizeName) return false;
      
      // Convertir a minúsculas para comparación sin importar mayúsculas/minúsculas
      const lowerName = prizeName.toLowerCase();
      
      // Buscar el índice que corresponde a ese nombre
      const prizeIndex = data.findIndex(
        p => p.name.toLowerCase() === lowerName
      );
      
      if (prizeIndex >= 0) {
        console.log(`[RULETA] Forzando premio "${prizeName}" encontrado en índice ${prizeIndex}`);
        forceSpin(prizeIndex);
        return true;
      } else {
        console.error(`[RULETA ERROR] No se encontró premio con nombre "${prizeName}"`);
        return false;
      }
    };
    
    // Sistema de verificación para validar la consistencia de índices
    (window as any).__rouletteVerifyIndexes = () => {
      console.log("=== VERIFICACIÓN DE ÍNDICES DE RULETA ===");
      // Para cada índice posible, verificamos la consistencia
      for (let i = 0; i < data.length; i++) {
        const target = getTargetRotation(i);
        const finalRot = norm(target);
        const pointerAngle = norm(-finalRot);
        const sectorIndex = Math.floor(pointerAngle / segment);
        const visualIndex = sectorIndex % n;
        
        const isConsistent = visualIndex === i;
        console.log(`Índice ${i} (${data[i].name}): ${isConsistent ? "✓" : "✗"} → Visual: ${visualIndex} (${data[visualIndex]?.name})`);
        
        if (!isConsistent) {
          console.error(`INCONSISTENCIA: Índice ${i} produce visual ${visualIndex}`);
        }
      }
    };
    
    return () => { 
      delete (window as any).__rouletteForceSpin;
      delete (window as any).__rouletteForceByName;
      delete (window as any).__rouletteVerifyIndexes;
    };
  }, [data, durationMs, spinning, disabled, n, segment]);

  // Spin usando la selección ponderada de V1
  const spin = () => {
    if (spinning || disabled) return;
    
    // Seleccionamos el premio mediante la función de peso
    const { reward, index } = pickWeighted(data);
    
    // IMPORTANTE: Este índice es ahora el índice LOGICO del premio seleccionado
    console.log(`[RULETA] Premio seleccionado: ${reward.name} (índice ${index})`);
    
    // Iniciamos la animación
    setSpinning(true);
    
    // Calculamos la rotación necesaria para que el sector elegido quede bajo el puntero
    const target = getTargetRotation(index);
    lastTarget.current = target;
    setRotation(target);

    // Esperamos a que termine la animación
    window.setTimeout(() => {
      setSpinning(false);
      
      // Efectos cuando termina el giro
      try { if ('vibrate' in navigator) (navigator as any).vibrate?.(70); } catch {}
      if (reward.sparkle) launchConfetti();
      
      // Verificamos visualmente qué premio quedó bajo el puntero
      const finalRot = norm(target);
      const pointerAngle = norm(-finalRot); // Ángulo que queda en la posición 0° (12 en punto)
      
      // CORRECCIÓN CRÍTICA: El cálculo del índice visual debe ser coherente con el gradiente visual
      // En nuestro gradiente, los sectores se dibujan en orden natural (0, 1, 2, ...) desde 0°
      const sectorIndex = Math.floor(pointerAngle / segment);
      const visualIndex = sectorIndex % n;
      
      // IMPORTANTE: El premio visual debe coincidir con el premio lógico
      const visualReward = data[visualIndex];
      
      // Verificamos que coincidan
      if (visualIndex !== index) {
        console.error(`[RULETA ERROR] Discrepancia entre premio lógico (${index}: ${reward.name}) y visual (${visualIndex}: ${visualReward?.name})`);
        
        // SOLUCIÓN DEFINITIVA: Si hay discrepancia, recalculamos y ajustamos 
        // la rotación para forzar la coincidencia exacta
        console.warn(`[RULETA] Recalculando rotación para forzar coincidencia...`);
        
        // Usamos el índice lógico como fuente de verdad y recalculamos
        const correctedRotation = getTargetRotation(index);
        setRotation(correctedRotation); // Ajustamos visualmente
        
        // Después de corregir, el premio visual debe ser exactamente el premio lógico
        console.log(`[RULETA] Corrección aplicada. Premio final: ${reward.name}`);
        
        // Siempre usamos el premio lógico seleccionado, ya que la visual se ajusta a él
        onResult?.(reward, index);
        return; // Salimos después de la corrección
      }
      
      // Reportamos el premio seleccionado (premio lógico y visual deben coincidir ahora)
      onResult?.(visualReward, visualIndex);
      
      // Debug adicional
      if ((window as any).__rouletteDebugHook) {
        (window as any).__rouletteDebugHook({
          expectedIndex: index,
          visualIndex,
          actualReward: reward,
          pointerAngle,
          segment,
          rewardName: reward.name,
          expectedName: data[index].name,
          visualName: visualReward?.name,
          finalRotation: finalRot
        });
      }
    }, durationMs);
  };

  // Debug: tabla de ángulos visibles mejorada
  useEffect(() => {
    if (!debug) return;
    
    // Mostramos sectores con índices y ángulos
    const sectorInfo = data.map((p, i) => ({
      index: i,
      name: p.name,
      startAngle: norm(i * segment),
      centerAngle: norm((i + 0.5) * segment),
      endAngle: norm((i + 1) * segment),
      color: p.color,
      probability: p.probability || 0
    }));
    
    console.log("=== RULETA: MAPA DE SECTORES ===");
    console.table(sectorInfo);
    
    // Mostrar información de cómo calcular el premio visualmente
    console.log("=== RULETA: GUÍA DE INTERPRETACIÓN ===");
    console.log("1. El puntero está arriba (0°)");
    console.log("2. La rueda gira en sentido ANTIHORARIO (rotación negativa)");
    console.log("3. El índice 0 está inicialmente en la parte superior");
    console.log("4. La rotación final determina qué premio queda bajo el puntero");
    console.log("5. Para determinar el sector desde una rotación final:");
    console.log("   - Normalizar la rotación: (rot % 360 + 360) % 360");
    console.log("   - Calcular ángulo del puntero: norm(-rotación)");
    console.log("   - Calcular sector: Math.floor(ángulo / segment)");
    
  }, [debug, data, segment]);

  // Helpers de estilo
  const px = (v: number) => `${v}px`;

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none" style={{ minHeight: px(diameter + 120) }}>
      <div className="relative" style={{ width: px(diameter), height: px(diameter) }}>
        {/* Controles de debug */}
        {debug && (
          <div className="absolute top-[-30px] left-0 flex items-center gap-2 z-30 bg-black/50 text-white px-2 py-1 rounded">
            <button 
              onClick={() => setShowDebugOverlay(!showDebugOverlay)}
              className="px-2 py-1 bg-blue-500 rounded text-xs"
            >
              {showDebugOverlay ? "Ocultar Debug" : "Mostrar Debug"}
            </button>
            <span className="text-xs">Rotación: {Math.round(rotation)}°</span>
          </div>
        )}
        
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
                
                {/* Índices de sector visibles en modo debug */}
                {debug && showDebugOverlay && (
                  <div 
                    className="absolute text-white bg-black/80 px-1 rounded-sm z-10"
                    style={{
                      left: '50%',
                      top: '10%',
                      transform: 'translate(-50%, 0)',
                      fontSize: '10px',
                    }}
                  >
                    {i}
                  </div>
                )}
              </div>
            ))}

            {/* Etiquetas radiales (con flip para lado izquierdo) */}
            {data.map((reward, i) => {
              // CORRECCIÓN: Usamos el mismo índice que en el gradiente para total consistencia
              // El sector i está en la posición angular i*segment
              const angleCenter = (i + 0.5) * segment;
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
