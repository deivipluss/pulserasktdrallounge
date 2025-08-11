'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTimeUntilEvent } from '@/app/lib/client-env';
import EventCountdown from "./components/EventCountdown";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: false });
  
  useEffect(() => {
    // Obtener tiempo inicial
    const updateTime = () => {
      const timeUntil = getTimeUntilEvent();
      setTimeLeft(timeUntil);
    };
    
    updateTime();
    
    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-fiesta-purple/10 to-fiesta-blue/10 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-token-lg p-6 md:p-8 shadow-party-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <motion.h1 
            className="text-fluid-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-fiesta-purple via-fiesta-pink to-fiesta-blue mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Pulseras KTD Lounge
          </motion.h1>
          
          <motion.p 
            className="text-fluid-base text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            ¡Escanea tu código QR para participar en la ruleta y ganar premios!
          </motion.p>
        </div>

        {/* Countdown */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {!timeLeft.hasStarted ? (
            <>
              <div className="text-center mb-4">
                <h2 className="text-fluid-xl font-heading font-semibold">El evento comenzará en:</h2>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-3 bg-fiesta-purple/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.days}</div>
                  <div className="text-fluid-xs">Días</div>
                </div>
                <div className="p-3 bg-fiesta-pink/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.hours}</div>
                  <div className="text-fluid-xs">Horas</div>
                </div>
                <div className="p-3 bg-fiesta-blue/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.minutes}</div>
                  <div className="text-fluid-xs">Minutos</div>
                </div>
                <div className="p-3 bg-fiesta-teal/10 rounded-token text-center">
                  <div className="text-fluid-2xl font-bold">{timeLeft.seconds}</div>
                  <div className="text-fluid-xs">Segundos</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-4 bg-fiesta-green/10 rounded-token-lg mb-4">
              <h2 className="text-fluid-xl font-heading font-semibold text-fiesta-green">¡El evento ha comenzado!</h2>
              <p className="text-fluid-base mt-2">Escanea tu código QR para participar</p>
            </div>
          )}
        </motion.div>
        
        {/* Developer mode */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="space-y-3">
            <Link 
              href="/dev/test-tokens" 
              className="block w-full py-3 px-6 bg-fiesta-blue text-white rounded-token font-medium text-center transition-all hover:bg-fiesta-blue/90"
            >
              Modo Desarrollador
            </Link>
            
            <Link 
              href="/demo" 
              className="block w-full py-3 px-6 bg-fiesta-purple text-white rounded-token font-medium text-center transition-all hover:bg-fiesta-purple/90"
            >
              Ver Demostraciones
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
