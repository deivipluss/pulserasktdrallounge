'use client';

import { useState } from 'react';
import SpinController from '@/app/components/SpinController';
import { Prize } from '@/app/components/Wheel';

export default function SevenWheelDemo() {
  // Definición de los 7 premios para la ruleta (6 premios + 1 nuevo intento)
  const [prizes] = useState<Prize[]>([
    { id: 1, name: 'Trident', color: '#FF5733', stock: 16 },
    { id: 2, name: 'Cigarrillos', color: '#33FF57', stock: 16 },
    { id: 3, name: 'Cerebritos', color: '#3357FF', stock: 16 },
    { id: 4, name: 'Popcorn', color: '#FF33A8', stock: 16 },
    { id: 5, name: 'Agua', color: '#33FFF5', stock: 16 },
    { id: 6, name: 'Chupetines', color: '#FFD633', stock: 24 },
    { id: 7, name: 'Nuevo intento', color: '#9933FF', stock: 0 }, // Sin stock para que no afecte la distribución
  ]);
  
  // Pesos personalizados para los premios (solo para la primera tirada)
  const [customWeights] = useState({
    1: 1, // Trident
    2: 1, // Cigarrillos
    3: 1, // Cerebritos
    4: 1, // Popcorn
    5: 1, // Agua
    6: 1, // Chupetines (ligeramente más probable)
    // El peso de "Nuevo intento" se controla con retryWeight
  });

  const [result, setResult] = useState<Prize | null>(null);
  const [retryMode, setRetryMode] = useState(false);
  const [wheelMode, setWheelMode] = useState<'free' | 'force'>('free');
  const [retryWeight, setRetryWeight] = useState(0.2); // 20% de probabilidad para "Nuevo intento"

  // Manejar el resultado del giro
  const handleResult = (prize: Prize) => {
    setResult(prize);
    
    // Si obtiene "Nuevo intento", cambiar al modo force para el siguiente giro
    if (prize.id === 7) {
      setRetryMode(true);
      setWheelMode('force');
    } else {
      // Si obtiene premio, volver al modo libre
      setRetryMode(false);
      setWheelMode('free');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Demostración de Ruleta con 7 Segmentos</h1>
      
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium mb-1">Modo de ruleta:</label>
              <select 
                className="px-3 py-2 rounded border"
                value={wheelMode}
                onChange={(e) => setWheelMode(e.target.value as 'free' | 'force')}
              >
                <option value="free">Libre (usa pesos)</option>
                <option value="force">Forzado (alinea al premio)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Peso de "Nuevo intento":</label>
              <input 
                type="range" 
                min="0.15" 
                max="0.25" 
                step="0.01" 
                value={retryWeight}
                onChange={(e) => setRetryWeight(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm mt-1">{(retryWeight * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
        
        <SpinController 
          prizes={prizes}
          onResult={handleResult}
          pulseraId="demo-7-segments"
          maxRetries={1}
          wheelMode={wheelMode}
          retryWeight={retryWeight}
          customWeights={customWeights}
        />
        
        {result && (
          <div className="mt-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
            <h2 className="text-xl font-semibold mb-2">Último resultado:</h2>
            <p>Has ganado: <strong>{result.name}</strong></p>
          </div>
        )}
      </div>
      
      <div className="mt-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Información sobre la demostración</h2>
        
        <div className="prose dark:prose-invert">
          <p>
            Esta demostración muestra una ruleta con 7 segmentos de diferentes colores,
            con 6 premios reales y un segmento especial de "Nuevo intento".
          </p>
          
          <h3>Características de la ruleta:</h3>
          <ul>
            <li>7 segmentos con colores distintivos</li>
            <li>Animación de giro fluida con efectos de sonido</li>
            <li>Microinteracciones y feedback táctil</li>
            <li>Sistema de sorteo con pesos personalizables</li>
            <li>Segmento "Nuevo intento" (15-25% probabilidad ajustable)</li>
            <li>Modo libre vs modo forzado para alineación de premios</li>
            <li>Máximo 1 reintento por token (configurable)</li>
            <li>Distribución diaria: 5 premios × 16 unidades + 24 chupetines = 104 tokens/día</li>
          </ul>
          
          <h3>Componentes utilizados:</h3>
          <ul>
            <li><strong>SpinController</strong>: Controla los estados de la ruleta y muestra el botón de giro.</li>
            <li><strong>Wheel</strong>: Componente visual de la ruleta con la lógica de animación.</li>
            <li><strong>ResultDialog</strong>: Diálogo que muestra el premio ganado.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
