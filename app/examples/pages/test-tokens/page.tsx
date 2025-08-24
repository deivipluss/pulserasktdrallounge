'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getTimeUntilEvent } from '@/app/lib/client-env';

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<any>(null);
  const [customId, setCustomId] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: false });
  const [copied, setCopied] = useState(false);

  // Actualizar el tiempo restante
  useEffect(() => {
    const updateTime = () => {
      const timeUntil = getTimeUntilEvent();
      setTimeLeft(timeUntil);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generar un token al cargar la página
  useEffect(() => {
    generateToken();
  }, []);

  const generateToken = async (id?: string) => {
    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const url = id ? `/api/generate-token?id=${id}` : '/api/generate-token';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al generar el token');
      }
      
      const data = await response.json();
      setToken(data);
    } catch (error: any) {
      setError(error.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateToken(customId);
  };

  const copyToClipboard = () => {
    if (!token) return;
    
    const url = `${window.location.origin}/jugar?id=${token.id}&sig=${token.sig}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openTokenUrl = () => {
    if (!token) return;
    
    const url = `${window.location.origin}/jugar?id=${token.id}&sig=${token.sig}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div 
        className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-token-lg shadow-party-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-fluid-3xl font-heading font-bold mb-6">Generador de Enlaces de Prueba</h1>
        
        {/* Estado del evento */}
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-token">
          <h2 className="text-fluid-lg font-medium mb-2">Estado del evento</h2>
          {timeLeft.hasStarted ? (
            <div className="text-fiesta-green font-medium">
              El evento ha comenzado ✓
            </div>
          ) : (
            <div>
              <div className="text-amber-600 font-medium mb-2">
                El evento aún no ha comenzado
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 bg-fiesta-purple/5 rounded-token text-center">
                  <div className="font-medium">{timeLeft.days}</div>
                  <div className="text-xs">días</div>
                </div>
                <div className="p-2 bg-fiesta-pink/5 rounded-token text-center">
                  <div className="font-medium">{timeLeft.hours}</div>
                  <div className="text-xs">hrs</div>
                </div>
                <div className="p-2 bg-fiesta-blue/5 rounded-token text-center">
                  <div className="font-medium">{timeLeft.minutes}</div>
                  <div className="text-xs">min</div>
                </div>
                <div className="p-2 bg-fiesta-teal/5 rounded-token text-center">
                  <div className="font-medium">{timeLeft.seconds}</div>
                  <div className="text-xs">seg</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
            <input 
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="ID personalizado (opcional)"
              className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-token focus:outline-none focus:ring-2 focus:ring-fiesta-purple dark:bg-gray-700"
            />
            <button 
              type="submit"
              className="px-6 py-2 bg-fiesta-purple text-white rounded-token font-medium transition-all hover:bg-fiesta-purple/90"
              disabled={isLoading}
            >
              {isLoading ? 'Generando...' : 'Generar'}
            </button>
          </form>
          
          <button 
            onClick={() => generateToken()}
            className="w-full px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-token font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
            disabled={isLoading}
          >
            Generar con ID aleatorio
          </button>
        </div>
        
        {isLoading && (
          <div className="flex justify-center p-8">
            <div className="w-12 h-12 border-4 border-t-fiesta-purple border-r-fiesta-pink border-b-fiesta-blue border-l-fiesta-teal rounded-full animate-spin"></div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-token mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {token && !isLoading && (
          <motion.div 
            className="border border-gray-200 dark:border-gray-700 rounded-token-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-fluid-xl font-bold mb-4">Token Generado</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">ID</p>
                <p className="font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded-token overflow-auto">{token.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Firma</p>
                <p className="font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded-token overflow-auto break-all">{token.sig}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">URL de Juego</p>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-token overflow-auto">
                  <p className="text-fiesta-blue break-all font-mono">
                    {`${window.location.origin}/jugar?id=${token.id}&sig=${token.sig}`}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-token font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {copied ? '¡Copiado!' : 'Copiar URL'}
                </button>
                <button 
                  onClick={openTokenUrl}
                  className="flex-1 px-6 py-3 bg-fiesta-pink text-white rounded-token font-medium transition-all hover:bg-fiesta-pink/90"
                >
                  Ir a Jugar
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-fiesta-blue hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
