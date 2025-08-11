'use client';

import { 
  Ticket, 
  PlayCircle, 
  LineChart, 
  Layers, 
  Beaker, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

import { PartyBackground } from './components/ui/party-background';
import { Header } from './components/ui/header';
import { Card } from './components/ui/card';

export default function Page() {
  // Animación para los elementos de la lista
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PartyBackground>
      <div className="min-h-screen flex flex-col">
        <Header 
          title="KTD Lounge" 
          subtitle="Gestión de Fiesta" 
          buildVersion="7f6f404"
        />
        
        <main className="flex-1 p-6 max-w-md mx-auto w-full">
          <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.h2 
              className="text-xl font-semibold text-white/80 flex items-center gap-2"
              variants={item}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-fiesta-purple"></span>
              <span>Acceso Rápido</span>
            </motion.h2>
            
            <motion.div 
              className="grid gap-4"
              variants={item}
            >
              <Card
                href="/imprimir-pulseras"
                icon={Ticket}
                title="Imprimir Pulseras"
                description="Genera QR y exporta PDFs para impresión"
                className="bg-gradient-to-br from-fiesta-purple/20 to-fiesta-blue/5 border-fiesta-purple/30"
              />
              
              <Card
                href="/jugar"
                icon={PlayCircle}
                title="Jugar"
                description="Accede a la experiencia interactiva"
                requiresAuth
                className="bg-gradient-to-br from-fiesta-blue/20 to-fiesta-teal/5 border-fiesta-blue/30"
              />
              
              <Card
                href="/status?token=admin-token-2025"
                icon={LineChart}
                title="Status"
                description="Panel de administración y métricas"
                badge="Admin"
                requiresAuth
                className="bg-gradient-to-br from-fiesta-pink/20 to-fiesta-purple/5 border-fiesta-pink/30"
              />
            </motion.div>
            
            <motion.h2 
              className="text-xl font-semibold text-white/80 mt-8 flex items-center gap-2" 
              variants={item}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-fiesta-teal"></span>
              <span>Desarrollo</span>
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-2 gap-4"
              variants={item}
            >
              <Card
                href="/demo"
                icon={Layers}
                title="Demo"
                className="bg-gradient-to-br from-fiesta-teal/20 to-fiesta-blue/5 border-fiesta-teal/30"
              />
              
              <Card
                href="/dev/test-tokens"
                icon={Beaker}
                title="Test Tokens"
                className="bg-gradient-to-br from-fiesta-yellow/20 to-fiesta-orange/5 border-fiesta-yellow/30"
              />
            </motion.div>
            
            <motion.div
              className="mt-12 text-center"
              variants={item}
            >
              <a
                href="https://github.com/deivipluss/pulserasktdrallounge"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <span>GitHub</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </PartyBackground>
  );
}
