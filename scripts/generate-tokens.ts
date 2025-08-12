#!/usr/bin/env ts-node
/**
 * generate-tokens.ts
 * 
 * Script para generar tokens preasignados para el evento KTD Lounge.
 * Genera CSV con tokens firmados y QRs para cada día del evento.
 * 
 * Opciones:
 * --days <number>: Número de días para los que generar tokens
 * --start <YYYY-MM-DD>: Fecha de inicio para generar tokens
 * --base <URL>: URL base para los códigos QR
 * --seed <number>: Semilla para la generación de números aleatorios (opcional)
 *
 * Distribución de premios por día:
 * - 16 Trident
 * - 16 Cigarrillos
 * - 16 Cerebritos
 * - 16 Popcorn
 * - 16 Agua
 * - 24 Chupetines
 * Total: 104 tokens por día
 */

// Usar require en lugar de import para compatibilidad
const fs = require('fs');
const path = require('path');
const cryptoLib = require('crypto');
const QRCode = require('qrcode');
const { Command } = require('commander');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Asegurar extensión correcta de plugins de dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Zona horaria de Lima
const LIMA_TZ = 'America/Lima';

const program = new Command();

// Configuración de distribución diaria de premios (104 tokens por día)
const PRIZE_DISTRIBUTION = [
  { key: 'trident', name: 'Trident', count: 16 },
  { key: 'cigarrillos', name: 'Cigarrillos', count: 16 },
  { key: 'cerebritos', name: 'Cerebritos', count: 16 },
  { key: 'popcorn', name: 'Popcorn', count: 16 },
  { key: 'agua', name: 'Agua', count: 16 },
  { key: 'chupetines', name: 'Chupetines', count: 24 },
];

/**
 * Genera un ID único para un token
 * Formato: ktd-YYYY-MM-DD-NNN donde NNN es un número secuencial con padding
 */
function generateTokenId(day: string, index: number): string {
  return `ktd-${day}-${(index + 1).toString().padStart(3, '0')}`;
}

/**
 * Firma un token usando HMAC-SHA256
 * La firma se genera con el formato id|day|prizeKey
 * @param id - ID único del token
 * @param day - Día en formato YYYY-MM-DD
 * @param prizeKey - Clave del premio asignado (en minúsculas)
 * @param secret - Clave secreta para la firma
 */
// IMPORTANTE: La app en producción valida la firma usando ONLY el ID (validateSignedToken)
// Antes firmábamos id|day|prizeKey lo que hacía que siempre falle la validación.
// Ajustamos para firmar solo el id y así ser compatibles con el runtime.
function signToken(id: string, _day: string, _prizeKey: string, secret: string): string {
  return cryptoLib.createHmac('sha256', secret).update(id).digest('hex');
}

program
  .name('generate-tokens')
  .description('Genera tokens preasignados para el evento KTD Lounge')
  .requiredOption('--days <days>', 'Número de días para los que generar tokens', Number)
  .requiredOption('--start <date>', 'Fecha de inicio (YYYY-MM-DD)')
  .requiredOption('--base <url>', 'URL base para los códigos QR')
  .option('--seed <seed>', 'Semilla para reproducibilidad (opcional)', Number)
  .option('--secret <secret>', 'SIGNING_SECRET', process.env.SIGNING_SECRET || '')
  .option('--dry', 'Genera solo CSV (sin PNG QR)')
  .parse(process.argv);

// Reemplazar la desestructuración temprana y chequeo estricto del secret por una lectura simple de opciones
const opts = program.opts();
const { days, start, base, seed, secret, dry } = opts;

/**
 * Genera los tokens para un día específico
 * @param day - Día en formato YYYY-MM-DD
 * @param outDir - Directorio para archivos CSV
 * @param qrDir - Directorio base para códigos QR
 * @param seedValue - Semilla para generación determinística (opcional)
 */
const generateTokensForDay = async (
  day: string, 
  outDir: string, 
  qrDir: string, 
  baseUrl: string,
  secretKey: string,
  seedValue?: number,
  dry?: boolean
) => {
  // Crear el directorio específico para este día dentro de qrDir solo si no es dry
  let dayQrDir: string | undefined = undefined;
  if (!dry) {
    dayQrDir = path.join(qrDir, day);
    fs.mkdirSync(dayQrDir, { recursive: true });
  }
  
  // Crear array con todos los premios según distribución
  const allPrizes: Array<{key: string, name: string}> = [];
  PRIZE_DISTRIBUTION.forEach((prize: { key: string; name: string; count: number }) => {
    for (let i = 0; i < prize.count; i++) {
      allPrizes.push({ key: prize.key, name: prize.name });
    }
  });
  
  // Mezclar los premios si hay una semilla definida
  if (seedValue !== undefined) {
    // Función de mezcla determinística usando la semilla
    const seedStr = `${seedValue}-${day}`;
    const rng = (() => {
      let seed = cryptoLib.createHash('sha256').update(seedStr).digest('hex');
      return () => {
        seed = cryptoLib.createHash('sha256').update(seed).digest('hex');
        return parseInt(seed.substring(0, 8), 16) / 0x100000000;
      };
    })();
    
    // Fisher-Yates shuffle con RNG determinístico
    for (let i = allPrizes.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [allPrizes[i], allPrizes[j]] = [allPrizes[j], allPrizes[i]];
    }
  } else {
    // Mezcla aleatoria estándar
    for (let i = allPrizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPrizes[i], allPrizes[j]] = [allPrizes[j], allPrizes[i]];
    }
  }
  
  // Generar tokens
  const tokens: Array<{
    id: string;
    day: string;
    prize: string; // clave en minúsculas
    prizeKey: string;
    sig: string;
    url: string;
  }> = [];
  
  for (let i = 0; i < allPrizes.length; i++) {
    const prize = allPrizes[i];
    const id = generateTokenId(day, i);
    const prizeKey = prize.key; // asegurado en minúsculas
    const sig = signToken(id, day, prizeKey, secretKey);
    
    // Crear URL firmada
    const url = `${baseUrl}?id=${encodeURIComponent(id)}&sig=${sig}`;
    
    tokens.push({
      id,
      day,
      prize: prizeKey, // exportar clave en minúsculas
      prizeKey,
      sig,
      url
    });
    
    // Generar QR PNG (solo si no es dry)
    if (!dry && dayQrDir) {
      const qrPath = path.join(dayQrDir, `${id}.png`);
      await QRCode.toFile(qrPath, url, {
        type: 'png',
        width: 300,
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }
  
  // Exportar CSV con encabezados exactos
  const csv = 'id,day,prize,sig,url\n' + 
    tokens.map(t => `${t.id},${t.day},${t.prize},${t.sig},${t.url}`).join('\n');
  
  fs.writeFileSync(path.join(outDir, `${day}.csv`), csv);
  console.log(`✓ Generados ${tokens.length} tokens para ${day}${dry ? ' (solo CSV, sin PNG)' : ''}`);
};

(async () => {
  // Validar opciones
  const { days, start, base, seed, secret, dry } = program.opts();
  
  // Verificar que el secret está definido
  const secretKey = secret || process.env.SIGNING_SECRET;
  if (!secretKey) {
    console.error('❌ Error: SIGNING_SECRET es requerido');
    console.error('Define la variable de entorno SIGNING_SECRET o usa --secret');
    process.exit(1);
  }
  
  // Validar la fecha de inicio
  if (!dayjs(start).isValid()) {
    console.error('❌ Error: La fecha de inicio no es válida, use formato YYYY-MM-DD');
    process.exit(1);
  }

  // Mostrar información del proceso
  console.log(`\n🚀 Generando tokens para ${days} días desde ${start}`);
  console.log(`🌐 URL base: ${base}`);
  console.log(`🎯 Distribución diaria: ${PRIZE_DISTRIBUTION.map((p: any) => `${p.count} ${p.name}`).join(', ')}`);
  if (dry) console.log('🧪 Modo dry: se generará solo CSV (no se crearán PNGs)');
  
  if (seed !== undefined) {
    console.log(`🔑 Usando semilla: ${seed} (generación determinística)`);
  }
  
  // Crear directorios de salida
  const outDir = path.join(process.cwd(), 'tokens');
  const qrBaseDir = path.join(process.cwd(), 'qr');
  fs.mkdirSync(outDir, { recursive: true });
  if (!dry) fs.mkdirSync(qrBaseDir, { recursive: true });
  
  // Contador de tokens generados
  let totalTokens = 0;
  
  // Generar tokens para cada día
  for (let d = 0; d < Number(days); d++) {
    const day = dayjs.tz(start, LIMA_TZ).add(d, 'day').format('YYYY-MM-DD');
    
    console.log(`\n📅 Procesando día ${d + 1}: ${day}`);
    
    await generateTokensForDay(day, outDir, qrBaseDir, base, secretKey, seed, dry);
    totalTokens += PRIZE_DISTRIBUTION.reduce((sum: number, p: any) => sum + p.count, 0);
  }
  
  // Resumen final
  console.log(`\n✅ Completado! Se generaron ${totalTokens} tokens en total.`);
  console.log(`📁 Archivos CSV: ${path.resolve(process.cwd(), 'tokens')}`);
  if (!dry) console.log(`🔍 Códigos QR: ${path.resolve(process.cwd(), 'qr')}`);
})();
