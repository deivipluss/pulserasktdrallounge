'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  pieces?: number;
}

// Colores para el confeti
const CONFETTI_COLORS = [
  '#FF5733', // Naranja
  '#33FF57', // Verde
  '#3357FF', // Azul
  '#FF33A8', // Rosa
  '#33FFF5', // Cyan
  '#FFD633', // Amarillo
  '#9933FF', // Púrpura
];

export default function Confetti({ active, duration = 3000, pieces = 100 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(false);
  
  // Controlar cuándo mostrar el confeti
  useEffect(() => {
    if (active) {
      setIsActive(true);
      
      // Ocultar después de la duración especificada
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration]);
  
  // No renderizar nada si no está activo
  if (!isActive) return null;
  
  // Generar piezas de confeti
  const confettiPieces = Array.from({ length: pieces }).map((_, index) => {
    // Valores aleatorios para cada pieza
    const size = Math.random() * 10 + 5; // Tamaño entre 5 y 15px
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const startX = Math.random() * 100; // Posición X inicial (0-100%)
    const endX = startX + (Math.random() * 40 - 20); // Posición X final (±20% de la inicial)
    const delay = Math.random() * 0.5; // Retraso aleatorio en segundos
    const duration = Math.random() * 1 + 1.5; // Duración entre 1.5 y 2.5 segundos
    const type = Math.random() > 0.5 ? 'circle' : 'square'; // Tipo de forma
    const rotation = Math.random() * 360; // Rotación inicial
    const endRotation = rotation + (Math.random() * 720 - 360); // Rotación final (±360°)
    
    return (
      <motion.div
        key={index}
        className={`absolute ${type === 'circle' ? 'rounded-full' : 'rotate-45'}`}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: color,
          top: '-5%',
          left: `${startX}%`,
          opacity: 0
        }}
        initial={{ 
          y: '-10vh',
          x: '0%',
          opacity: 0,
          rotate: rotation
        }}
        animate={{ 
          y: '110vh',
          x: `${endX - startX}%`,
          opacity: [0, 1, 1, 0],
          rotate: endRotation
        }}
        transition={{
          duration: duration,
          delay: delay,
          ease: [0.1, 0.4, 0.7, 0.9]
        }}
      />
    );
  });
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces}
    </div>
  );
}
