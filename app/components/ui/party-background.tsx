'use client';

import React, { useState, useEffect } from 'react';

interface BackgroundProps {
  children: React.ReactNode;
}

export function PartyBackground({ children }: BackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Fallback para dispositivos táctiles - mover sutilmente la posición
    const touchInterval = setInterval(() => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        setMousePosition({
          x: 0.5 + Math.sin(Date.now() / 3000) * 0.1,
          y: 0.5 + Math.cos(Date.now() / 4000) * 0.1
        });
      }
    }, 100);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(touchInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Gradiente reactivo al movimiento */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, 
            var(--fiesta-purple) 0%, 
            var(--fiesta-blue) 25%, 
            var(--fiesta-teal) 50%, 
            var(--fiesta-pink) 75%, 
            var(--fiesta-purple) 100%)`,
          filter: 'blur(120px)'
        }}
      />

      {/* Malla para textura */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Círculos decorativos */}
      <div className="absolute w-64 h-64 rounded-full bg-fiesta-pink opacity-20 blur-3xl -top-20 -left-20" />
      <div className="absolute w-96 h-96 rounded-full bg-fiesta-purple opacity-20 blur-3xl top-1/3 -right-48" />
      <div className="absolute w-80 h-80 rounded-full bg-fiesta-blue opacity-20 blur-3xl -bottom-20 left-1/4" />
      
      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
