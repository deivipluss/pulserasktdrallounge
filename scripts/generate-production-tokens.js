#!/usr/bin/env node
/**
 * Script para generar tokens compatibles con el entorno de producción
 * Este script genera tokens firmados con la clave de producción
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Definimos la fecha para los tokens
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;

// Ruta del archivo CSV de tokens
const tokenFilePath = path.join(__dirname, '..', 'tokens', `${dateStr}.csv`);

// Preguntar por la clave de producción
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Premio disponibles
const PREMIOS = ['agua', 'chupetines', 'popcorn', 'cerebritos', 'cigarrillos', 'trident'];

// Función para firmar un token con HMAC SHA-256
function signToken(id, secret) {
  return crypto.createHmac('sha256', secret).update(id).digest('hex');
}

// Función para generar un token
function generateToken(index, date, prize, secret) {
  const id = `ktd-${date}-${String(index).padStart(3, '0')}`;
  const sig = signToken(id, secret);
  const url = `https://app.example.com/jugar?id=${id}&sig=${sig}`;
  return { id, date, prize, sig, url };
}

console.log('=== Generador de Tokens para Producción ===');
rl.question('Ingresa la clave de firma de producción: ', (productionSecret) => {
  if (!productionSecret || productionSecret.length < 10) {
    console.error('Error: La clave de firma debe tener al menos 10 caracteres.');
    rl.close();
    return;
  }

  // Verificar si el archivo ya existe
  const fileExists = fs.existsSync(tokenFilePath);

  if (fileExists) {
    // Si existe, leer el contenido actual
    const currentContent = fs.readFileSync(tokenFilePath, 'utf-8');
    const lines = currentContent.trim().split('\n');
    const header = lines[0]; // Guardar la cabecera
    
    // Procesar cada línea excepto la cabecera
    const updatedLines = [header];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 5) {
        const id = parts[0];
        const date = parts[1];
        const prize = parts[2];
        
        // Generar nueva firma
        const sig = signToken(id, productionSecret);
        const url = `https://app.example.com/jugar?id=${id}&sig=${sig}`;
        
        updatedLines.push(`${id},${date},${prize},${sig},${url}`);
      }
    }

    // Escribir el archivo actualizado
    fs.writeFileSync(tokenFilePath, updatedLines.join('\n') + '\n');
    console.log(`Tokens actualizados con éxito en: ${tokenFilePath}`);
    console.log(`Se actualizaron ${updatedLines.length - 1} tokens.`);
  } else {
    // Si no existe, crear un nuevo archivo con tokens
    const header = 'id,day,prize,sig,url';
    const lines = [header];
    
    // Generar 100 tokens nuevos
    const numTokens = 100;
    for (let i = 1; i <= numTokens; i++) {
      // Seleccionar un premio aleatorio
      const prize = PREMIOS[Math.floor(Math.random() * PREMIOS.length)];
      const token = generateToken(i, dateStr, prize, productionSecret);
      lines.push(`${token.id},${token.date},${token.prize},${token.sig},${token.url}`);
    }
    
    // Crear directorio si no existe
    const dir = path.dirname(tokenFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Escribir el archivo
    fs.writeFileSync(tokenFilePath, lines.join('\n') + '\n');
    console.log(`Nuevo archivo de tokens creado: ${tokenFilePath}`);
    console.log(`Se generaron ${numTokens} tokens.`);
  }

  // Generar una muestra para probar
  console.log('\n=== Muestra de URLs para pruebas ===');
  console.log(`http://localhost:3000/jugar?id=ktd-${dateStr}-001&sig=${signToken(`ktd-${dateStr}-001`, productionSecret)}`);
  console.log(`http://localhost:3000/jugar?id=ktd-${dateStr}-002&sig=${signToken(`ktd-${dateStr}-002`, productionSecret)}`);
  
  rl.close();
});
