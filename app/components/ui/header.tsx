'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  subtitle?: string;
  buildVersion?: string;
}

export function Header({ title, subtitle, buildVersion }: HeaderProps) {
  return (
    <header className="relative">
      {/* Logo y título */}
      <motion.div 
        className="text-center pt-12 pb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="w-20 h-20 mb-4 mx-auto relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
        >
          {/* Círculos decorativos animados */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-party opacity-80"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          {/* Icono central */}
          <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
            KTD
          </div>
        </motion.div>
        
        {/* Título con efecto de texto */}
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-gradient"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundSize: '300% 100%',
            backgroundImage: 'linear-gradient(45deg, var(--fiesta-pink), var(--fiesta-purple), var(--fiesta-blue), var(--fiesta-purple), var(--fiesta-pink))'
          }}
        >
          {title}
        </motion.h1>
        
        {/* Subtítulo */}
        {subtitle && (
          <motion.p 
            className="mt-2 text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {subtitle}
          </motion.p>
        )}
        
        {/* Versión */}
        {buildVersion && (
          <div className="absolute bottom-0 right-4 text-xs text-gray-500 opacity-60">
            build {buildVersion}
          </div>
        )}
      </motion.div>
    </header>
  );
}
