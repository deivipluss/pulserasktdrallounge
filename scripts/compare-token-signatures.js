#!/usr/bin/env node
/**
 * Script para comparar firmas entre desarrollo y producción
 * Esto te permite verificar si un token específico funcionará en ambos entornos
 */

const crypto = require('crypto');
const readline = require('readline');

// Función para firmar un token con HMAC SHA-256
function signToken(id, secret) {
  return crypto.createHmac('sha256', secret).update(id).digest('hex');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// La clave de desarrollo conocida
const DEV_SECRET = 'development-signing-secret-0123456789abcdef';

console.log('=== Comparador de Firmas de Tokens ===');
rl.question('Ingresa el ID del token (ej: ktd-2025-08-24-019): ', (tokenId) => {
  if (!tokenId) {
    console.error('Error: Debes ingresar un ID de token válido.');
    rl.close();
    return;
  }

  rl.question('Ingresa la clave de firma de producción: ', (prodSecret) => {
    if (!prodSecret || prodSecret.length < 10) {
      console.error('Error: La clave de firma debe tener al menos 10 caracteres.');
      rl.close();
      return;
    }

    // Generar firmas
    const devSignature = signToken(tokenId, DEV_SECRET);
    const prodSignature = signToken(tokenId, prodSecret);

    console.log('\n=== Resultados ===');
    console.log('ID del token:', tokenId);
    console.log('\nFirma con clave de DESARROLLO:');
    console.log(devSignature);
    console.log('\nFirma con clave de PRODUCCIÓN:');
    console.log(prodSignature);
    
    console.log('\n=== URLs para pruebas ===');
    console.log('URL para desarrollo:');
    console.log(`http://localhost:3000/jugar?id=${tokenId}&sig=${devSignature}`);
    console.log('\nURL para producción:');
    console.log(`https://app.example.com/jugar?id=${tokenId}&sig=${prodSignature}`);
    
    rl.close();
  });
});
