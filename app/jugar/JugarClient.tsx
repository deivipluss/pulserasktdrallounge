"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Roulette, { type Reward } from '@/app/components/Roulette';

// Simple client-side storage to check if a token has been used
const hasIdPlayed = (id: string): boolean => {
  try {
    return localStorage.getItem(`played_${id}`) === 'true';
  } catch (e) {
    return false;
  }
};

const markIdAsPlayed = (id: string) => {
  try {
    localStorage.setItem(`played_${id}`, 'true');
  } catch (e) {
    // ignore
  }
};


enum PageState {
  LOADING,
  READY_TO_PLAY,
  PLAYED,
  ERROR
}

interface JugarClientProps {
  id: string;
  predefinedPrize?: string;
  error?: string;
}

function JugarClient({ id, predefinedPrize, error: initialError }: JugarClientProps) {
  const [state, setState] = useState<PageState>(PageState.LOADING);
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState<string | undefined>(initialError);

  useEffect(() => {
    if (initialError) {
      setState(PageState.ERROR);
      return;
    }

    if (!id) {
      setError("ID de token no válido.");
      setState(PageState.ERROR);
      return;
    }

    if (hasIdPlayed(id)) {
      setState(PageState.PLAYED);
      return;
    }

    setState(PageState.READY_TO_PLAY);
  }, [id, initialError]);

  const handleRouletteResult = (result: Reward) => {
    setReward(result);
    markIdAsPlayed(id);
    setState(PageState.PLAYED);
  };

  const renderContent = () => {
    switch (state) {
      case PageState.LOADING:
        return (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            <p className="mt-4 text-lg">Cargando...</p>
          </div>
        );

      case PageState.READY_TO_PLAY:
        return (
          <div className="flex flex-col items-center justify-center py-6">
            <h2 className="text-2xl font-bold mb-6">¡Gira la ruleta y gana!</h2>
            <Roulette
              onResult={handleRouletteResult}
              duration={6000}
              predefinedPrizeName={predefinedPrize}
              disabled={!predefinedPrize} // Disable spinning if no prize is defined
            />
            {!predefinedPrize && (
                 <div className="mt-4 text-red-400/80 text-sm text-center">
                    <p>No se pudo determinar un premio para este token.</p>
                    <p>El giro está desactivado.</p>
                 </div>
            )}
          </div>
        );

      case PageState.PLAYED:
        return (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-3">¡Gracias por participar!</h2>
            {reward ? (
              <div className="mt-6 py-4 px-5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 
                     dark:from-amber-900/50 dark:to-amber-800/50
                     border border-amber-200 dark:border-amber-700
                     shadow-lg text-center max-w-md mx-auto">
                <div className="text-sm opacity-70 mb-1">Tu premio es:</div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: reward.color,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    padding: '8px',
                    margin: '4px 0',
                    borderRadius: '4px',
                    backgroundColor: `${reward.color}20`
                  }}
                >
                  {reward.emoji ? `${reward.emoji} ${reward.name}` : reward.name}
                </div>
                <div className="text-sm mt-3 opacity-80">
                  {reward.retry ? '¡Puedes intentarlo nuevamente con otro código!' : 'Muestra esta pantalla a un organizador para reclamar tu premio'}
                </div>
              </div>
            ) : (
              <p>Tu token ya ha sido utilizado. Muestra esta pantalla a un organizador.</p>
            )}
             <div className="mt-8 text-sm opacity-70">
              <p>ID: {id}</p>
            </div>
          </div>
        );

      case PageState.ERROR:
        return (
          <div className="text-center py-10">
            <div className="rounded-full bg-red-100/10 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
               <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-400">¡Ups! Algo salió mal</h2>
            <p className="opacity-80 max-w-md mx-auto">
              {error || "Ocurrió un error desconocido."}
            </p>
          </div>
        );
    }
  };

  return (
     <main className="min-h-screen bg-gray-900 text-white py-6">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400">KTD Lounge</h1>
          <p className="text-amber-100/80">Ruleta de Premios</p>
        </header>
        {renderContent()}
      </div>
    </main>
  );
}


export default function JugarClientWrapper(props: JugarClientProps) {
    const searchParams = useSearchParams();
    const id = searchParams?.get('id') || props.id;

    return (
        <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">Cargando...</div>}>
            <JugarClient {...props} id={id} />
        </Suspense>
    )
}
