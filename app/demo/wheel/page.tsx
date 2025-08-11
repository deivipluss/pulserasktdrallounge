'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SpinController from '@/app/components/SpinController';
import EventGate from '@/app/components/EventGate';
import PrizeLegend from '@/app/components/PrizeLegend';
import { Prize } from '@/app/components/Wheel';
import { TimeLeft } from '@/app/components/EventGate';
import { initialPrizes, getLocalStockForUser, hasPulseraBeenUsed } from '@/app/lib/prizes';
import { useSearchParams } from 'next/navigation';

// Lista de premios para demo
const demoPrizes: Prize[] = [
  { id: 1, name: 'Entrada VIP', color: '#FF4D8D', icon: '🌟', stock: 5 },
  { id: 2, name: 'Cóctel Gratis', color: '#9B4DFF', icon: '🍹', stock: 20 },
  { id: 3, name: 'Descuento 30%', color: '#4D9EFF', icon: '🏷️', stock: 50 },
  { id: 4, name: 'Postre Gratis', color: '#4DFFB8', icon: '🍰', stock: 30 },
  { id: 5, name: 'Selfie con DJ', color: '#FFA04D', icon: '📸', stock: 10 },
  { id: 6, name: 'Merchandising', color: '#FF4D4D', icon: '👕', stock: 40 },
  { id: 7, name: 'Gracias', color: '#B3B3B3', icon: '👍', stock: 100 },
];

// Fechas para demostrar diferentes estados
const dates = {
  past: '2023-01-01T00:00:00',    // Fecha en el pasado (evento ya comenzó)
  soon: new Date(Date.now() + 30 * 1000).toISOString(), // 30 segundos en el futuro
  future: '2025-12-31T00:00:00',  // Fecha en el futuro lejano
};

export default function WheelDemo() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [demoMode, setDemoMode] = useState<'past' | 'soon' | 'future'>('past');
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  // Usar el ID de la URL o un valor predeterminado, pero no mostrarlo en la UI
  const [pulseraId, setPulseraId] = useState<string>(idParam || 'demo-12345');
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(demoPrizes);
  const [isVerified, setIsVerified] = useState<boolean>(true); // En demo, asumimos verificado
  
  // Verificar si ya jugó y cargar premios locales al iniciar
  useEffect(() => {
    const played = hasPulseraBeenUsed(pulseraId);
    setHasPlayed(played);
    
    // Cargar los premios con stock local
    const userPrizes = getLocalStockForUser(pulseraId);
    setLocalPrizes(userPrizes);
    
    // En un entorno real, verificaríamos la firma con la API
    if (idParam) {
      const signature = searchParams.get('sig');
      // En producción: fetch('/api/verify?id=' + idParam + '&sig=' + signature)
    }
  }, [pulseraId, idParam, searchParams]);
  
  // Cambiar el modo de demostración
  const changeMode = (mode: 'past' | 'soon' | 'future') => {
    setDemoMode(mode);
    setSelectedPrize(null);
  };
  
  // Manejar resultado de la ruleta
  const handleResult = (prize: Prize) => {
    setSelectedPrize(prize);
    console.log('Premio obtenido:', prize);
  };
  
  // Manejar cambios en el tiempo
  const handleTimeChange = (newTimeLeft: TimeLeft) => {
    setTimeLeft(newTimeLeft);
  };
  
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-fluid-3xl font-heading font-bold">Demo de Ruleta</h1>
            <Link href="/" className="text-fiesta-blue hover:underline">
              &larr; Volver al inicio
            </Link>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Esta página demuestra los componentes de ruleta implementados.
          </p>
        </header>
        
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="flex-1 order-2 lg:order-1">
            <div className="bg-white dark:bg-gray-800 rounded-token-lg p-4 md:p-6 shadow-party-sm mb-6">
              <h2 className="text-fluid-xl font-heading font-semibold mb-4">Modos de Demostración</h2>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => changeMode('past')}
                  className={`px-4 py-2 rounded-token text-sm font-medium ${demoMode === 'past' ? 'bg-fiesta-purple text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Evento Activo
                </button>
                <button
                  onClick={() => changeMode('soon')}
                  className={`px-4 py-2 rounded-token text-sm font-medium ${demoMode === 'soon' ? 'bg-fiesta-purple text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Evento en 30s
                </button>
                <button
                  onClick={() => changeMode('future')}
                  className={`px-4 py-2 rounded-token text-sm font-medium ${demoMode === 'future' ? 'bg-fiesta-purple text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Evento Futuro
                </button>
              </div>
              
              {timeLeft && !timeLeft.hasStarted && (
                <div className="bg-fiesta-blue/10 dark:bg-fiesta-blue/20 p-4 rounded-token mb-6">
                  <p className="text-sm font-medium">Estado actual:</p>
                  <p className="font-mono">
                    {JSON.stringify(timeLeft, null, 2)}
                  </p>
                </div>
              )}
              
              {selectedPrize && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-fiesta-green/10 p-4 rounded-token"
                >
                  <h3 className="font-medium mb-2">Último premio ganado:</h3>
                  <div 
                    className="p-3 rounded-token-sm flex items-center gap-3"
                    style={{ backgroundColor: `${selectedPrize.color}20` }}
                  >
                    <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: selectedPrize.color }}></div>
                    <div className="font-medium">{selectedPrize.name}</div>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-token-lg p-4 md:p-6 shadow-party-sm">
              <PrizeLegend prizes={demoPrizes} />
            </div>
          </div>
          
          <div className="flex-1 order-1 lg:order-2">
            <div className="bg-white dark:bg-gray-800 rounded-token-lg p-4 md:p-6 shadow-party-sm">
              <EventGate 
                startTime={dates[demoMode]} 
                timeZone="America/Lima"
                onTimeChange={handleTimeChange}
              >
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-center">
                    <p className="text-sm text-gray-500">Pulsera ID: {pulseraId}</p>
                    {hasPlayed && <p className="text-sm font-medium text-fiesta-orange">¡Esta pulsera ya ha sido utilizada!</p>}
                  </div>
                  
                  <SpinController 
                    prizes={localPrizes}
                    onResult={handleResult}
                    disabled={hasPlayed}
                    pulseraId={pulseraId}
                  />
                </div>
              </EventGate>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-token-lg p-4 md:p-6 shadow-party-sm">
          <h2 className="text-fluid-xl font-heading font-semibold mb-4">Documentación</h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <h3>Componentes Implementados</h3>
            <ul>
              <li><strong>Wheel</strong>: Componente base de la ruleta con animación y sonidos.</li>
              <li><strong>SpinController</strong>: Controla los estados de la ruleta y muestra el botón de giro.</li>
              <li><strong>ResultDialog</strong>: Diálogo que muestra el premio obtenido con efectos visuales.</li>
              <li><strong>EventGate</strong>: Controla el acceso basado en tiempo con cuenta regresiva.</li>
              <li><strong>PrizeLegend</strong>: Muestra la lista de premios disponibles.</li>
            </ul>
            
            <h3>Características</h3>
            <ul>
              <li>Animación de giro con inercia y desaceleración natural</li>
              <li>Efecto de desenfoque durante el giro</li>
              <li>Sonidos de tick durante la rotación</li>
              <li>Sistema de doble toque (girar y detener)</li>
              <li>Vibración en dispositivos móviles al ganar</li>
              <li>Efectos de confeti al mostrar resultado</li>
              <li>Cuenta regresiva con formato adaptativo (dd:hh:mm:ss o mm:ss)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
