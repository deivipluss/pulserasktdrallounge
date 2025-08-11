'use client';

import { useState, useEffect } from 'react';
import { getEventTZ, getTimeUntilEvent } from '../lib/client-env';

export default function EventCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    hasStarted: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener la hora del servidor
  const fetchServerTime = async () => {
    try {
      const response = await fetch('/api/event-time');
      if (response.ok) {
        const data = await response.json();
        setTimeLeft(data.timeUntilEvent);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al obtener la hora del servidor:', error);
    }
  };

  useEffect(() => {
    // Obtener la hora del servidor al principio
    fetchServerTime();

    // Sincronizar con el servidor cada minuto
    const serverSync = setInterval(() => {
      fetchServerTime();
    }, 60000);

    // Actualizar cada segundo localmente
    const interval = setInterval(() => {
      const timeUntil = getTimeUntilEvent();
      setTimeLeft(timeUntil);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(serverSync);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-token-lg text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-token mb-4"></div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-token"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-token"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-token"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-token"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-token w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (timeLeft.hasStarted) {
    return (
      <div className="p-6 bg-fiesta-blue/20 rounded-token-lg text-center">
        <h2 className="text-fluid-2xl font-heading font-bold mb-2">¡El evento ha comenzado!</h2>
        <p className="text-fluid-base">
          Zona horaria: <span className="font-semibold">{getEventTZ()}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-fiesta-purple/20 rounded-token-lg text-center">
      <h2 className="text-fluid-2xl font-heading font-bold mb-4">Cuenta regresiva</h2>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-token shadow-party-sm">
          <div className="text-fluid-3xl font-bold">{timeLeft.days}</div>
          <div className="text-fluid-xs">Días</div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-token shadow-party-sm">
          <div className="text-fluid-3xl font-bold">{timeLeft.hours}</div>
          <div className="text-fluid-xs">Horas</div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-token shadow-party-sm">
          <div className="text-fluid-3xl font-bold">{timeLeft.minutes}</div>
          <div className="text-fluid-xs">Minutos</div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-token shadow-party-sm">
          <div className="text-fluid-3xl font-bold">{timeLeft.seconds}</div>
          <div className="text-fluid-xs">Segundos</div>
        </div>
      </div>
      <p className="text-fluid-base">
        Zona horaria: <span className="font-semibold">{getEventTZ()}</span>
      </p>
    </div>
  );
}
