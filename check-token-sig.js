const crypto = require('crypto');

const id = 'ktdp-2025-08-22-021';
const providedSig = '6b4c30941b45935842750be13241b16f2f6cb2f691fac872f7c09475900be6b6';

// Prueba con la clave de desarrollo
const devSecret = 'development-signing-secret-0123456789abcdef';
const devExpectedSig = crypto.createHmac('sha256', devSecret).update(id).digest('hex');

console.log('=== VERIFICACIÓN DE FIRMA ===');
console.log(`ID: ${id}`);
console.log(`Firma proporcionada: ${providedSig.slice(0, 16)}...`);
console.log(`\nCon clave de desarrollo:`);
console.log(`Firma esperada: ${devExpectedSig.slice(0, 16)}...`);
console.log(`¿Coinciden? ${providedSig === devExpectedSig ? 'SÍ' : 'NO'}`);

// Si está configurada la variable de entorno SIGNING_SECRET
if (process.env.SIGNING_SECRET) {
  const envSecret = process.env.SIGNING_SECRET;
  const envExpectedSig = crypto.createHmac('sha256', envSecret).update(id).digest('hex');
  
  console.log(`\nCon clave de entorno (${envSecret.slice(0, 5)}...):`);
  console.log(`Firma esperada: ${envExpectedSig.slice(0, 16)}...`);
  console.log(`¿Coinciden? ${providedSig === envExpectedSig ? 'SÍ' : 'NO'}`);
}

// También probar con la clave que se usa cuando se ejecuta la app
try {
  const { env } = require('./app/lib/env');
  const appSecret = env.SIGNING_SECRET;
  const appExpectedSig = crypto.createHmac('sha256', appSecret).update(id).digest('hex');
  
  console.log(`\nCon clave de la app (${appSecret.slice(0, 5)}...):`);
  console.log(`Firma esperada: ${appExpectedSig.slice(0, 16)}...`);
  console.log(`¿Coinciden? ${providedSig === appExpectedSig ? 'SÍ' : 'NO'}`);
} catch (err) {
  console.log('\nNo se pudo cargar la clave de la app:', err.message);
}
