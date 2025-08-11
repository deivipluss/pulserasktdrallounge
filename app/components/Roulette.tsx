'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Reward {
  id: number;
  name: string;
  probability: number;
  color: string;
}

const rewards: Reward[] = [
  { id: 1, name: 'Premio Grande', probability: 0.05, color: '#FF4D8D' },
  { id: 2, name: 'Premio Medio', probability: 0.15, color: '#9B4DFF' },
  { id: 3, name: 'Premio Pequeño', probability: 0.30, color: '#4D9EFF' },
  { id: 4, name: 'Gracias por Participar', probability: 0.50, color: '#4DFFB8' },
];

interface RouletteProps {
  onResult: (reward: Reward) => void;
  disabled?: boolean;
}

export default function Roulette({ onResult, disabled = false }: RouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Función para determinar la recompensa basada en probabilidades
  const determineReward = (): Reward => {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }
    
    return rewards[rewards.length - 1];
  };
  
  // Función para girar la ruleta
  const spin = () => {
    if (spinning || disabled) return;
    
    setSpinning(true);
    setResult(null);
    
    // Determinamos el resultado de antemano
    const selectedReward = determineReward();
    
    // Calculamos la posición final basada en el resultado
    // Cada premio tiene un segmento de (360 / rewards.length) grados
    const segmentSize = 360 / rewards.length;
    const rewardIndex = rewards.findIndex(r => r.id === selectedReward.id);
    
    // Calculamos la posición final para que el premio quede en la parte superior
    // Agregamos un desplazamiento aleatorio dentro del segmento para más realismo
    const offset = Math.random() * (segmentSize * 0.5) - (segmentSize * 0.25);
    const endPosition = 1080 + (rewardIndex * segmentSize) + offset;
    
    // Animamos la ruleta
    setRotation(endPosition);
    
    // Una vez que termine la animación, mostrar el resultado
    setTimeout(() => {
      setSpinning(false);
      setResult(selectedReward);
      onResult(selectedReward);
    }, 5000); // Duración de la animación
  };

  // Generar los segmentos de la ruleta
  const segments = rewards.map((reward, index) => {
    const angle = (360 / rewards.length);
    const rotate = index * angle;
    
    return (
      <div 
        key={reward.id}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rotate - angle/2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate - angle/2) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotate + angle/2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate + angle/2) * Math.PI / 180)}%)`,
          backgroundColor: reward.color,
          transform: `rotate(${rotate}deg)`,
        }}
      >
        <div 
          className="absolute text-white font-semibold text-xs sm:text-sm"
          style={{ 
            transform: `translateY(-30px) rotate(${-rotate}deg)`,
            width: '80px',
            textAlign: 'center',
          }}
        >
          {reward.name}
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-8">
        {/* Marcador en la parte superior */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 
                      border-l-[10px] border-l-transparent
                      border-r-[10px] border-r-transparent
                      border-b-[20px] border-b-fiesta-orange
                      z-10">
        </div>
        
        {/* Ruleta */}
        <motion.div 
          ref={wheelRef}
          className="w-full h-full rounded-full relative overflow-hidden border-4 border-gray-300"
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: "easeOut" }}
        >
          {segments}
        </motion.div>
      </div>
      
      <button
        onClick={spin}
        disabled={spinning || disabled}
        className={`px-8 py-4 rounded-token-lg text-white font-bold text-lg shadow-party-md transition-all
                  ${spinning || disabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-fiesta-pink hover:bg-fiesta-pink/90 hover:scale-105'
                  }`}
      >
        {spinning ? '¡Girando!' : '¡Girar Ruleta!'}
      </button>
      
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-6 p-4 bg-white rounded-token border border-gray-200 shadow-party-sm text-center"
        >
          <h3 className="text-lg font-semibold mb-1">¡Resultado!</h3>
          <p className="text-fiesta-purple font-bold text-xl">{result.name}</p>
        </motion.div>
      )}
    </div>
  );
}
