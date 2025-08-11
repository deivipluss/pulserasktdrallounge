'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SparklesProps {
  active: boolean;
  x?: number;
  y?: number;
  color?: string;
  duration?: number;
  count?: number;
}

export default function Sparkles({
  active,
  x = 0,
  y = 0,
  color = '#FFD700',
  duration = 1000,
  count = 20
}: SparklesProps) {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (active) {
      setIsActive(true);
      
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration]);
  
  if (!isActive) return null;
  
  // Crear arreglo de chispas
  const sparkles = Array.from({ length: count }).map((_, index) => {
    // Generar valores aleatorios para cada chispa
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = Math.random() * 100 + 50;
    const size = Math.random() * 6 + 2;
    const opacity = Math.random() * 0.5 + 0.5;
    const delay = Math.random() * 0.2;
    
    // Calcular posición final
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;
    
    return (
      <motion.div
        key={index}
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 ${size * 2}px ${color}`,
          top: y,
          left: x,
          opacity: 0
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          x: endX,
          y: endY,
          scale: [0, 1, 0],
          opacity: [0, opacity, 0]
        }}
        transition={{
          duration: Math.random() * 0.5 + 0.5,
          delay: delay,
          ease: "easeOut"
        }}
      />
    );
  });
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40">
      {sparkles}
    </div>
  );
}
