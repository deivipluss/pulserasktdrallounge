import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extensiones de dayjs para manejo de zonas horarias
dayjs.extend(utc);
dayjs.extend(timezone);

// Zona horaria del evento
const EVENT_TZ = process.env.NEXT_PUBLIC_EVENT_TZ || 'America/Lima';

// Tipos
interface TokenConfig {
  day: string; // Formato YYYY-MM-DD
  count: number; // Cantidad de tokens a generar
  prizes: {
    [key: number]: number; // Número de premio -> cantidad a asignar
  };
  prefix: string; // Prefijo para los IDs (por defecto "PUL-")
}

/**
 * Genera tokens preasignados para un día específico
 */
export async function generateTokens(config: TokenConfig): Promise<string> {
  // Validar configuración
  if (!validateConfig(config)) {
    throw new Error('Configuración de tokens inválida');
  }
  
  // Generar un array de todos los premios según las cantidades
  const allPrizes: number[] = [];
  
  Object.entries(config.prizes).forEach(([prizeId, count]) => {
    const id = parseInt(prizeId, 10);
    
    // Añadir la cantidad especificada de cada premio
    for (let i = 0; i < count; i++) {
      allPrizes.push(id);
    }
  });
  
  // Mezclar el array de premios aleatoriamente
  const shuffledPrizes = shuffleArray(allPrizes);
  
  // Generar el CSV con los tokens
  let csvContent = 'id,prize\n';
  
  for (let i = 0; i < config.count; i++) {
    // Generar el ID con prefijo y número secuencial con padding
    const tokenId = `${config.prefix}${(i + 1).toString().padStart(3, '0')}`;
    
    // Asignar un premio del array mezclado (o premio por defecto si no hay suficientes)
    const prize = i < shuffledPrizes.length ? shuffledPrizes[i] : 1;
    
    csvContent += `${tokenId},${prize}\n`;
  }
  
  // Directorio donde se almacenarán los archivos de tokens
  const dataDir = path.join(process.cwd(), 'data', 'tokens');
  
  // Asegurar que exista el directorio
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Nombre de archivo basado en la fecha
  const filename = `tokens_${config.day}.csv`;
  const filePath = path.join(dataDir, filename);
  
  // Guardar el archivo
  fs.writeFileSync(filePath, csvContent, 'utf-8');
  
  return filePath;
}

/**
 * Valida la configuración para generar tokens
 */
function validateConfig(config: TokenConfig): boolean {
  // Verificar el formato de la fecha
  if (!dayjs(config.day, 'YYYY-MM-DD', true).isValid()) {
    return false;
  }
  
  // Verificar que la cantidad sea positiva
  if (config.count <= 0) {
    return false;
  }
  
  // Verificar que haya al menos un premio definido
  if (Object.keys(config.prizes).length === 0) {
    return false;
  }
  
  // Calcular la suma total de premios
  const totalPrizes = Object.values(config.prizes).reduce((sum, count) => sum + count, 0);
  
  // Verificar que la cantidad de tokens sea suficiente para los premios
  if (totalPrizes > config.count) {
    return false;
  }
  
  return true;
}

/**
 * Mezcla un array de forma aleatoria
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
