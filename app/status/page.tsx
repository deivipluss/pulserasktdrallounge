'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Papa, { ParseResult, ParseError } from 'papaparse';

// Extensiones de dayjs para manejo de zonas horarias
dayjs.extend(utc);
dayjs.extend(timezone);

// Tipos estrictos de premios y utilidades relacionadas
const PRIZE_KEYS = ['trident', 'cigarrillos', 'cerebritos', 'popcorn', 'agua', 'chupetines'] as const;
type PrizeKey = typeof PRIZE_KEYS[number];
const isPrizeKey = (v: string): v is PrizeKey => (PRIZE_KEYS as readonly string[]).includes(v);

// Mapa de etiquetas de premios (clave en minúsculas, visibles con mayúsculas)
const PRIZE_LABELS: Record<PrizeKey, string> = {
  trident: 'Trident',
  cigarrillos: 'Cigarrillos',
  cerebritos: 'Cerebritos',
  popcorn: 'Popcorn',
  agua: 'Agua',
  chupetines: 'Chupetines',
};

// Distribución esperada por día
const EXPECTED_COUNTS: Record<PrizeKey, number> = {
  trident: 16,
  cigarrillos: 16,
  cerebritos: 16,
  popcorn: 16,
  agua: 16,
  chupetines: 24,
};
const PRIZE_ORDER: PrizeKey[] = ['trident', 'cigarrillos', 'cerebritos', 'popcorn', 'agua', 'chupetines'];

// Variables de entorno visibles en cliente (con valores por defecto seguros para dev)
const ADMIN_TOKEN: string = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-token-2025';
const EVENT_TZ: string = process.env.NEXT_PUBLIC_EVENT_TZ || 'America/Lima';

// Tipos de CSV
interface CsvRowFields {
  id?: string;
  day?: string;
  prize?: string;
  sig?: string;
  url?: string;
}

interface ParsedRow {
  id: string;
  day: string;
  prize: string; // puede ser desconocido; se valida con isPrizeKey antes de usar
  sig: string;
  url: string;
  status: 'Válido' | 'Inválido';
  error?: string;
}

// Alias para normalizar premios del CSV
const PRIZE_ALIASES: Record<string, PrizeKey> = {
  cigarros: 'cigarrillos', // alias para compatibilidad
  cigarrillos: 'cigarrillos',
  trident: 'trident',
  cerebritos: 'cerebritos',
  popcorn: 'popcorn',
  agua: 'agua',
  chupetines: 'chupetines',
};

export default function StatusPageWrapper() {
  return (
    <Suspense fallback={<div>Cargando panel...</div>}>
      <StatusPage />
    </Suspense>
  );
}

function StatusPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // Estado de autenticación
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Estados para la información del servidor
  const [serverTime, setServerTime] = useState('');
  const [serverDate, setServerDate] = useState('');
  const [effectiveTZ, setEffectiveTZ] = useState('');
  
  // Estados para los controles
  const [activeDay, setActiveDay] = useState<string>('');
  const [eventMode, setEventMode] = useState<'before' | 'during' | 'after'>('during');
  const [retryProbability, setRetryProbability] = useState<number>(0.2); // 20%
  const [maxRetries, setMaxRetries] = useState<number>(1);
  
  // Estado para los datos del CSV
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<{ total: number; invalid: number; details: Array<{ row: number; id?: string; reason: string }> }>({ total: 0, invalid: 0, details: [] });
  // Resumen de conteos
  const [counts, setCounts] = useState<Record<PrizeKey, number>>(() => Object.fromEntries(PRIZE_KEYS.map(k => [k, 0])) as Record<PrizeKey, number>);
  const [totalRows, setTotalRows] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  // Verificar token al cargar la página
  // Cargar la configuración desde la API
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        setRetryProbability(data.retryProbability);
        setMaxRetries(data.maxRetries);
        setActiveDay(data.activeDay);
        setEventMode(data.eventMode as 'before' | 'during' | 'after');
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  // Guardar la configuración
  const saveConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retryProbability,
          maxRetries,
          activeDay,
          eventMode,
        }),
      });
      
      if (response.ok) {
        alert('Configuración guardada correctamente');
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
    }
  };

  useEffect(() => {
    if (token === ADMIN_TOKEN) {
      setIsAuthorized(true);
      // Cargar configuración inicial
      fetchConfig();
    }
  }, [token]);
  
  // Actualizar reloj cada segundo
  useEffect(() => {
    if (!isAuthorized) return;
    
    const updateClock = () => {
      const now = dayjs().tz(EVENT_TZ);
      setServerTime(now.format('HH:mm:ss'));
      setServerDate(now.format('YYYY-MM-DD'));
      setEffectiveTZ(`${EVENT_TZ} (UTC${now.format('Z')})`);
      
      // Si no hay un día activo seleccionado, usar el día actual
      if (!activeDay) {
        setActiveDay(now.format('YYYY-MM-DD'));
      }
    };
    
    // Actualizar inmediatamente
    updateClock();
    
    // Luego actualizar cada segundo
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthorized, activeDay]);
  
  // Manejar cambio de archivo CSV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result || '') as string;
      Papa.parse<CsvRowFields>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
        complete: (results: ParseResult<CsvRowFields>) => {
          const rows = results.data;
          const mapped: ParsedRow[] = rows.map((r, idx) => {
            const id = (r.id || '').trim();
            const day = (r.day || '').trim();
            let prizeRaw = (r.prize || '').trim().toLowerCase();
            const sig = (r.sig || '').trim();
            const url = (r.url || '').trim();

            // Normalizar alias de premio
            const prizeNorm = PRIZE_ALIASES[prizeRaw] ?? prizeRaw;

            let status: 'Válido' | 'Inválido' = 'Válido';
            let error: string | undefined;
            if (!id || !day || !prizeNorm || !sig || !url) {
              status = 'Inválido';
              error = 'Faltan campos requeridos';
            } else if (!isPrizeKey(prizeNorm)) {
              status = 'Inválido';
              error = `Premio no permitido: ${prizeRaw}`;
            }

            return { id, day, prize: prizeNorm, sig, url, status, error };
          });

          // Calcular conteos por premio y desconocidos
          const baseCounts = Object.fromEntries(PRIZE_KEYS.map(k => [k, 0])) as Record<PrizeKey, number>;
          let unknown = 0;
          for (const row of mapped) {
            const key = row.prize;
            if (isPrizeKey(key)) {
              baseCounts[key] = (baseCounts[key] || 0) + 1;
            } else {
              unknown += 1;
            }
          }

          setCounts(baseCounts);
          setTotalRows(mapped.length);
          setUnknownCount(unknown);

          const details = mapped
            .map((row, i) => (row.status === 'Inválido' ? { row: i + 2, id: row.id, reason: row.error || 'Inválido' } : null))
            .filter(Boolean) as Array<{ row: number; id?: string; reason: string }>;

          setCsvData(mapped);
          setCsvErrors({ total: mapped.length, invalid: details.length, details });
        },
        error: (err: any) => {
          setCsvData([]);
          setCounts(Object.fromEntries(PRIZE_KEYS.map(k => [k, 0])) as Record<PrizeKey, number>);
          setTotalRows(0);
          setUnknownCount(0);
          setCsvErrors({ total: 0, invalid: 0, details: [{ row: 0, reason: `Error al parsear CSV: ${String(err?.message || err)}` }] });
        },
      });
    };
    reader.onerror = () => {
      setCsvData([]);
      setCounts(Object.fromEntries(PRIZE_KEYS.map(k => [k, 0])) as Record<PrizeKey, number>);
      setTotalRows(0);
      setUnknownCount(0);
      setCsvErrors({ total: 0, invalid: 0, details: [{ row: 0, reason: 'Error leyendo el archivo' }] });
    };
    reader.readAsText(file);
  };
  
  // Simular diferentes estados del evento
  const handleEventModeChange = (mode: 'before' | 'during' | 'after') => {
    setEventMode(mode);
    
    // Ajustar fecha según el modo
    const now = dayjs().tz(EVENT_TZ);
    if (mode === 'before') {
      // Simular día anterior al evento
      setActiveDay(now.subtract(1, 'day').format('YYYY-MM-DD'));
    } else if (mode === 'during') {
      // Usar día actual
      setActiveDay(now.format('YYYY-MM-DD'));
    } else {
      // Simular día posterior al evento
      setActiveDay(now.add(1, 'day').format('YYYY-MM-DD'));
    }
  };
  
  // Si no está autorizado, mostrar mensaje de error
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200 mb-4">Acceso No Autorizado</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Se requiere un token válido para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }
  
  // Si está autorizado, mostrar la página de estado
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
              Panel de Estado - KTD Lounge
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="text-center md:text-right">
                <div className="text-3xl font-mono text-fiesta-purple dark:text-fiesta-orange">
                  {serverTime}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {serverDate} · {effectiveTZ}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Control */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 col-span-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Panel de Control
            </h2>
            
            <div className="space-y-6">
              {/* Control de simulación de evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Simular estado del evento
                </label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEventModeChange('before')}
                    className={`px-3 py-2 rounded-md flex-1 text-sm ${
                      eventMode === 'before' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    Antes
                  </button>
                  <button 
                    onClick={() => handleEventModeChange('during')}
                    className={`px-3 py-2 rounded-md flex-1 text-sm ${
                      eventMode === 'during' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    Durante
                  </button>
                  <button 
                    onClick={() => handleEventModeChange('after')}
                    className={`px-3 py-2 rounded-md flex-1 text-sm ${
                      eventMode === 'after' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    Después
                  </button>
                </div>
              </div>
              
              {/* Selector de día */}
              <div>
                <label htmlFor="activeDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Día activo
                </label>
                <input 
                  type="date" 
                  id="activeDay"
                  value={activeDay} 
                  onChange={(e) => setActiveDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              
              {/* Control de probabilidad de reintento */}
              <div>
                <label htmlFor="retryProbability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Probabilidad de "Nuevo intento" ({(retryProbability * 100).toFixed(0)}%)
                </label>
                <input 
                  type="range" 
                  id="retryProbability"
                  min="0.15" 
                  max="0.25" 
                  step="0.01"
                  value={retryProbability}
                  onChange={(e) => setRetryProbability(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>15%</span>
                  <span>20%</span>
                  <span>25%</span>
                </div>
              </div>
              
              {/* Control de máximo de reintentos */}
              <div>
                <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de reintentos: {maxRetries}
                </label>
                <input 
                  type="range" 
                  id="maxRetries"
                  min="1" 
                  max="3" 
                  step="1" 
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value, 10))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                </div>
              </div>
              
              {/* Botón para aplicar configuración */}
              <button 
                onClick={saveConfig}
                className="w-full px-4 py-2 bg-fiesta-purple hover:bg-fiesta-purple/90 text-white rounded-md shadow"
              >
                Aplicar Configuración
              </button>
            </div>
          </div>
          
          {/* Panel de Estadísticas y CSV */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 col-span-1 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Auditoría de Tokens
            </h2>
            {/* Carga de archivo CSV */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargar CSV del día ({activeDay})
              </label>
              <div className="flex items-center">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-fiesta-purple/10 file:text-fiesta-purple
                            hover:file:bg-fiesta-purple/20"
                />
              </div>
              {csvFile && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Archivo cargado: {csvFile?.name}
                </p>
              )}
              {csvErrors.total > 0 && (
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded ${csvErrors.invalid ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'}`}>
                      {csvErrors.invalid ? `${csvErrors.invalid} inválidos` : 'Todos válidos'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">de {csvErrors.total} filas</span>
                  </div>
                  {csvErrors.invalid > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-300">Ver detalles</summary>
                      <ul className="mt-1 list-disc pl-5 text-gray-600 dark:text-gray-300">
                        {csvErrors.details.map((e, i) => (
                          <li key={i}>Fila {e.row}{e.id ? ` (id ${e.id})` : ''}: {e.reason}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>

            {/* Alerta si total != 104 o hay desconocidos */}
            {(totalRows !== 104 || unknownCount > 0) && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
                <div className="font-semibold">Advertencia de consistencia</div>
                <ul className="list-disc pl-5 mt-1">
                  {totalRows !== 104 && (<li>Total de filas: {totalRows} (esperado 104)</li>)}
                  {unknownCount > 0 && (<li>Premios desconocidos: {unknownCount}</li>)}
                </ul>
              </div>
            )}

            {/* Tarjetas de conteo por premio */}
            {totalRows > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {PRIZE_ORDER.map((k: PrizeKey) => {
                  const value = counts[k] || 0;
                  const expected = EXPECTED_COUNTS[k];
                  const ok = value === expected;
                  return (
                    <div key={k} className={`rounded-lg p-3 border ${ok ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800'}`}>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{PRIZE_LABELS[k]}</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{value}<span className="text-xs font-normal text-gray-500 dark:text-gray-400"> / {expected}</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabla de tokens */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID de Pulsera</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Día</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Premio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {csvData.length > 0 ? (
                    csvData.map((row, index) => {
                      const label = isPrizeKey(row.prize) ? PRIZE_LABELS[row.prize] : undefined;
                      const isUnknown = !label;
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{row.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{row.day}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isUnknown ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Desconocido</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{label}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Válido' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-600 dark:text-blue-300 underline max-w-xs truncate">
                            <a href={row.url} target="_blank" rel="noreferrer">{row.url}</a>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                        {csvFile ? 'Procesando datos...' : 'Carga un archivo CSV para ver los tokens'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {csvData.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {csvData.length} tokens para el {activeDay}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
