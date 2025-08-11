'use client';

import { useState, useEffect, ReactNode } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventGateProps {
  startTime: string;  // Formato ISO: '2025-08-11T19:00:00'
  timeZone?: string;  // Ejemplo: 'America/Lima'
  children: ReactNode;
  onTimeChange?: (timeLeft: TimeLeft) => void;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  minutes_only?: number;
  seconds: number;
  hasStarted: boolean;
}

export default function EventGate({ startTime, timeZone = 'America/Lima', children, onTimeChange }: EventGateProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: false });
  
  // Calcular tiempo restante
  const calculateTimeLeft = (): TimeLeft => {
    const now = dayjs().tz(timeZone);
    const start = dayjs(startTime).tz(timeZone);
    
    // Si la fecha ya pasó
    if (now.isAfter(start)) {
      return { days: 0, hours: 0, minutes: 0, minutes_only: 0, seconds: 0, hasStarted: true };
    }
    
    // Calcular diferencia en segundos
    const diff = start.diff(now, 'second');
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const minutes_only = Math.floor(diff / 60); // Minutos totales para formato mm:ss
    const seconds = diff % 60;
    
    return { days, hours, minutes, minutes_only, seconds, hasStarted: false };
  };
  
  // Actualizar el contador cada segundo
  useEffect(() => {
    const calculate = () => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (onTimeChange) onTimeChange(newTimeLeft);
    };
    
    // Calcular tiempo inicial
    calculate();
    
    // Actualizar cada segundo
    const interval = setInterval(calculate, 1000);
    
    // Limpiar intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [startTime, timeZone, onTimeChange]);
  
  // Formatear tiempo para mm:ss
  const formatTimeMMSS = () => {
    const minutes = timeLeft.minutes_only || 0;
    const seconds = timeLeft.seconds;
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  return (
    <div>
      {!timeLeft.hasStarted ? (
        <div className="p-4 bg-fiesta-blue/10 dark:bg-fiesta-blue/20 rounded-token-lg text-center">
          <h3 className="text-fluid-lg font-medium mb-2">El evento comenzará en:</h3>
          
          {timeLeft.days > 0 || timeLeft.hours > 0 ? (
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
          ) : (
            <div className="text-fluid-3xl font-bold mb-4">
              {formatTimeMMSS()}
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Zona horaria: {timeZone}
          </p>
        </div>
      ) : (
        // Cuando el evento ha comenzado, mostrar el contenido hijo
        <>{children}</>
      )}
    </div>
  );
}
