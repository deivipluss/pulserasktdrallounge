'use client';

import { Prize } from './Wheel';
import { motion } from 'framer-motion';

interface PrizeLegendProps {
  prizes: Prize[];
}

export default function PrizeLegend({ prizes }: PrizeLegendProps) {
  return (
    <div className="w-full">
      <h3 className="text-fluid-lg font-medium mb-4 text-center">Premios disponibles</h3>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {prizes.map((prize, index) => (
          <motion.div 
            key={prize.id}
            className="flex items-center gap-3 p-3 rounded-token bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
              style={{ backgroundColor: `${prize.color}30` }}
            >
              {prize.icon ? (
                <span className="text-lg" style={{ color: prize.color }}>
                  {prize.icon}
                </span>
              ) : (
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: prize.color }}></div>
              )}
            </div>
            
            <div className="flex-grow">
              <p className="font-medium text-sm">{prize.name}</p>
              {typeof prize.stock !== 'undefined' && (
                <p className="text-xs text-gray-500">
                  Stock inicial: {prize.stock}
                </p>
              )}
            </div>
            
            <div 
              className="w-3 h-12 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: prize.color }}
            ></div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
