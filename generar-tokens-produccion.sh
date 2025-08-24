#!/bin/bash
# Script para generar tokens compatibles con producción

echo "=== Generador de Tokens para Producción ==="
echo "Este script actualizará los tokens en tu archivo CSV para que funcionen en producción."
echo ""

# Ejecutar el script de Node.js
node /workspaces/pulserasktdrallounge/scripts/generate-production-tokens.js

# Opciones adicionales después de generar los tokens
echo ""
echo "¿Quieres subir los cambios a GitHub? (s/n)"
read push_option

if [[ $push_option == "s" || $push_option == "S" ]]; then
  echo "Agregando cambios al commit..."
  git add /workspaces/pulserasktdrallounge/tokens/
  
  echo "Realizando commit..."
  git commit -m "Actualizado tokens para compatibilidad con producción"
  
  echo "Subiendo cambios a GitHub..."
  git push origin main
  
  echo "¡Cambios subidos exitosamente!"
fi

echo ""
echo "Proceso completado. Los tokens ahora son compatibles con el entorno de producción."
