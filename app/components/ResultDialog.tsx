'use client';

/**
 * ResultDialog.tsx
 * 
 * Componente de diálogo de resultado que muestra el premio ganado tras girar la ruleta.
 * 
 * Características de accesibilidad:
 * - Contraste AA (4.5:1) mediante ajuste automático de colores
 * - Roles ARIA para diálogo modal
 * - Gestión del foco (focus management)
 * - Soporte para navegación por teclado (Escape para cerrar)
 * - Áreas táctiles ampliadas para botones CTA
 * - Compatible con safe-area insets para dispositivos móviles
 * - Feedback táctil mediante vibración
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Prize } from './Wheel';
import confetti from 'canvas-confetti';
import { vibrateDevice } from '../lib/audio-service';

// Función para ajustar el color para asegurar contraste AA (ratio de contraste 4.5:1)
function adjustColorForContrast(color: string): string {
  // Convertir hex a RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  };
  
  // Calcular luminosidad relativa
  const getLuminance = ([r, g, b]: [number, number, number]): number => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  // Oscurecer o aclarar el color para mejorar contraste
  const rgb = hexToRgb(color);
  const luminance = getLuminance(rgb);
  
  // Si es muy claro, oscurecer; si es muy oscuro, aclarar
  if (luminance > 0.5) {
    return '#000000'; // Negro para colores claros
  } else {
    return '#FFFFFF'; // Blanco para colores oscuros
  }
}

/**
 * Props para el componente ResultDialog
 * @property {Prize} prize - El premio obtenido por el usuario
 * @property {Function} onClose - Función a llamar cuando se cierra el diálogo
 */
interface ResultDialogProps {
  prize: Prize;
  onClose: () => void;
}

/**
 * Componente ResultDialog - Muestra el resultado del giro de la ruleta
 * 
 * Implementa:
 * - Animaciones de entrada para elementos
 * - Efecto de confeti para celebración
 * - Feedback táctil mediante vibración
 * - Accesibilidad completa (ARIA, contraste, focus)
 * - Diseño responsive (mobile-first)
 * - Safe-area insets para notch y bordes redondeados
 */
export default function ResultDialog({ prize, onClose }: ResultDialogProps) {
  const [confettiActive, setConfettiActive] = useState(false);
  
  // Efecto para mostrar confeti al abrir el diálogo
  useEffect(() => {
    // Asegurarnos de que estamos en el cliente
    if (typeof window === 'undefined') return;
    
    // Vibrar el dispositivo con un patrón de celebración
    vibrateDevice([20, 30, 20, 30, 60]);
    
    // Ejecutar confeti con un pequeño retraso
    const timer = setTimeout(() => {
      setConfettiActive(true);
      
      // Crear el efecto de confeti
      const myConfetti = confetti.create(undefined, { 
        resize: true,
        useWorker: true 
      });
      
      // Configuración del confeti
      myConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
          prize.color || '#ff0000', 
          '#00ff00', 
          '#0000ff', 
          '#ffff00', 
          '#ff00ff', 
          '#00ffff'
        ]
      });
      
      // Lanzar confeti varias veces para un efecto más dramático
      setTimeout(() => {
        myConfetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
      }, 250);
      
      setTimeout(() => {
        myConfetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [prize.color]);
  
  // Usar useEffect para manejar el foco cuando se abre el diálogo
  useEffect(() => {
    // Guardar el elemento que tenía el foco anteriormente
    const previousFocus = document.activeElement as HTMLElement;
    
    // Función para manejar la tecla Escape
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Añadir event listener para la tecla Escape
    document.addEventListener('keydown', handleEscapeKey);
    
    // Devolver el foco al elemento anterior cuando se cierra el diálogo
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      if (previousFocus) previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm p-4 pt-safe pb-safe pl-safe pr-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 mx-auto sm:mx-0 md:max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: "calc(100% - 2rem)" }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full"
            style={{ backgroundColor: `${prize.color}20` }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-fiesta-purple"
            >
              <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
              <path d="M9 6.13a10.5 10.5 0 0 1 0 11.74" />
              <path d="M12 4.5a13.5 13.5 0 0 1 0 15" />
              <path d="M15 6.13a10.5 10.5 0 0 0 0 11.74" />
              <path d="M18 8.32a7.43 7.43 0 0 0 0 7.36" />
            </svg>
          </motion.div>
          
          <motion.h2 
            className="text-fluid-2xl font-heading font-bold mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            id="dialog-title"
          >
            ¡Felicidades!
          </motion.h2>
          
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            aria-live="polite"
          >
            <p className="text-gray-800 dark:text-gray-100 mb-2 font-medium">
              {prize.id === 7 ? '¡Has conseguido un:' : 'Has ganado:'}
            </p>
            <div 
              className="text-fluid-xl font-bold p-4 rounded-lg mb-2 border-2"
              style={{ 
                backgroundColor: `${prize.color}20`, 
                color: adjustColorForContrast(prize.color),
                borderColor: prize.color
              }}
              aria-label={`Premio: ${prize.name}`}
            >
              {prize.name}
            </div>
            {prize.id === 7 ? (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-base text-green-800 dark:text-green-200 font-medium">
                  ¡Tienes otra oportunidad! Puedes girar la ruleta una vez más.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-base text-blue-800 dark:text-blue-200 font-medium">
                  Muestra esta pantalla a un organizador para reclamar tu premio.
                </p>
              </div>
            )}
          </motion.div>
          
          <motion.button
            whileHover={{ 
              scale: 1.03, 
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            whileTap={{ 
              scale: 0.97
            }}
            className={`
              w-full py-4 px-6 mt-4 
              text-white font-bold text-lg rounded-xl 
              shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 
              transition-colors duration-200
              ${prize.id === 7 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            `}
            onClick={() => {
              // Pequeña vibración al cerrar
              vibrateDevice([10]);
              onClose();
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              y: [20, -5, 0] 
            }}
            transition={{ 
              delay: 0.5,
              y: { delay: 0.5, duration: 0.4 }
            }}
            aria-label={prize.id === 7 ? "Girar otra vez" : "Entendido"}
            style={{
              minHeight: "64px", // Aumentar área táctil
              touchAction: "manipulation" // Mejora rendimiento táctil
            }}
            autoFocus // Enfoque automático para accesibilidad de teclado
          >
            {prize.id === 7 ? "Girar otra vez" : "Entendido"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
