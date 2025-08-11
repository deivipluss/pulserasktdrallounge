'use client';

import Link from 'next/link';

export default function DemoIndexPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">Demostraciones de la Ruleta</h1>
      
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Tarjeta para la demostración original */}
        <Link href="/demo/wheel" className="block">
          <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-shadow p-6 h-full">
            <h2 className="text-2xl font-bold mb-3">Demostración Original</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Ruleta con animación y premios personalizables.
            </p>
            <div className="mt-4 text-fiesta-purple font-semibold">Abrir demostración &rarr;</div>
          </div>
        </Link>
        
        {/* Tarjeta para la demostración con 7 segmentos */}
        <Link href="/demo/seven-wheel" className="block">
          <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-shadow p-6 h-full">
            <h2 className="text-2xl font-bold mb-3">Ruleta con 7 Segmentos</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Ruleta específica con 7 segmentos de colores personalizados.
            </p>
            <div className="mt-4 text-fiesta-orange font-semibold">Abrir demostración &rarr;</div>
          </div>
        </Link>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="text-fiesta-purple hover:underline">&larr; Volver al inicio</Link>
      </div>
    </div>
  );
}
