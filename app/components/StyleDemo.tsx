'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconShowcase } from './ui/Icon';
import dateUtils from '../lib/date-utils';

export default function StyleDemo() {
  const [currentTime, setCurrentTime] = useState(dateUtils.nowInLima().format('HH:mm:ss'));
  
  // Actualizar la hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dateUtils.nowInLima().format('HH:mm:ss'));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-md space-y-lg">
      <section>
        <h2 className="text-fluid-2xl font-heading font-bold mb-md">Sistema de Diseño - Fiesta</h2>
        
        {/* Demostración de paleta de colores */}
        <div className="mb-lg">
          <h3 className="text-fluid-xl mb-sm">Paleta de Colores Fiesta</h3>
          <div className="flex flex-wrap gap-2">
            <div className="h-16 w-16 bg-fiesta-pink rounded-token flex items-center justify-center text-white">Pink</div>
            <div className="h-16 w-16 bg-fiesta-purple rounded-token flex items-center justify-center text-white">Purple</div>
            <div className="h-16 w-16 bg-fiesta-blue rounded-token flex items-center justify-center text-white">Blue</div>
            <div className="h-16 w-16 bg-fiesta-teal rounded-token flex items-center justify-center text-black">Teal</div>
            <div className="h-16 w-16 bg-fiesta-yellow rounded-token flex items-center justify-center text-black">Yellow</div>
            <div className="h-16 w-16 bg-fiesta-orange rounded-token flex items-center justify-center text-white">Orange</div>
          </div>
        </div>
        
        {/* Demostración de tipografía */}
        <div className="mb-lg">
          <h3 className="text-fluid-xl mb-sm">Tipografía Responsiva</h3>
          <div className="space-y-2">
            <p className="text-fluid-xs">Texto extra pequeño (fluid-xs)</p>
            <p className="text-fluid-sm">Texto pequeño (fluid-sm)</p>
            <p className="text-fluid-base">Texto base (fluid-base)</p>
            <p className="text-fluid-lg">Texto grande (fluid-lg)</p>
            <p className="text-fluid-xl">Texto extra grande (fluid-xl)</p>
            <p className="text-fluid-2xl">Texto 2xl (fluid-2xl)</p>
            <p className="text-fluid-3xl">Texto 3xl (fluid-3xl)</p>
            <p className="text-fluid-4xl">Texto 4xl (fluid-4xl)</p>
          </div>
        </div>
        
        {/* Demostración de efectos */}
        <div className="mb-lg">
          <h3 className="text-fluid-xl mb-sm">Efectos y Animaciones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div 
              className="p-md rounded-token-lg shadow-party-sm bg-white dark:bg-gray-800"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Sombra pequeña + Hover con Spring
            </motion.div>
            
            <div className="p-md rounded-token-lg shadow-party-md backdrop-party">
              Sombra mediana + Backdrop Blur
            </div>
            
            <div className="p-md rounded-token-lg shadow-party-lg gradient-party text-white">
              Sombra grande + Gradiente
            </div>
            
            <motion.div 
              className="p-md rounded-token-lg shadow-party-xl bg-white dark:bg-gray-800"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Sombra extra grande + Animación
            </motion.div>
          </div>
        </div>
        
        {/* Demostración de íconos */}
        <div className="mb-lg">
          <h3 className="text-fluid-xl mb-sm">Íconos de Lucide</h3>
          <IconShowcase />
        </div>
        
        {/* Demostración de Date Utils */}
        <div className="mb-lg">
          <h3 className="text-fluid-xl mb-sm">Date Utils (Zona Horaria: America/Lima)</h3>
          <div className="p-md rounded-token-lg border border-gray-200 dark:border-gray-700 space-y-2">
            <p>Hora actual en Lima: <span className="font-bold">{currentTime}</span></p>
            <p>Fecha formateada: <span className="font-bold">{dateUtils.format(new Date(), 'DD/MM/YYYY')}</span></p>
            <p>Es válida la fecha? <span className="font-bold">{dateUtils.isValid(new Date()) ? 'Sí' : 'No'}</span></p>
          </div>
        </div>
        
        {/* Demostración de efectos adicionales */}
        <div>
          <h3 className="text-fluid-xl mb-sm">Efectos Especiales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-md rounded-token-lg shimmer bg-white dark:bg-gray-800">
              Efecto Shimmer
            </div>
            <div className="p-md rounded-token-lg">
              <span className="text-gradient font-bold text-fluid-xl">Texto con Gradiente</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
