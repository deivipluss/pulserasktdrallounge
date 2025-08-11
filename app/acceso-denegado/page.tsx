'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/app/components/ui/Icon';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <motion.div 
        className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-token-lg shadow-party-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-fiesta-pink/20 rounded-full mb-6">
            <Icon name="party" size={32} className="text-fiesta-pink" />
          </div>
          
          <h1 className="text-fluid-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h1>
          
          <p className="text-fluid-base text-gray-600 dark:text-gray-300 mb-8">
            Lo sentimos, el enlace que estás utilizando no es válido o ha expirado.
          </p>
          
          <Link href="/" className="w-full py-3 px-6 bg-fiesta-purple text-white rounded-token font-medium text-center transition-all hover:bg-fiesta-purple/90">
            Volver al Inicio
          </Link>
          
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Si crees que esto es un error, por favor contacta al organizador del evento.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
