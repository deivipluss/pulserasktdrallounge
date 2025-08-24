#!/bin/bash
# Script para verificar si un token específico es válido en producción

echo "=== Verificador de Tokens para Producción ==="
echo ""

if [ -z "$1" ]; then
  echo "Por favor, ingresa el ID del token como argumento."
  echo "Uso: ./verificar-token-produccion.sh ktd-2025-08-24-019"
  exit 1
fi

TOKEN_ID="$1"

# Ejecutar el script de Node.js para comparar firmas
node /workspaces/pulserasktdrallounge/scripts/compare-token-signatures.js

echo ""
echo "Proceso completado. Ahora puedes usar la URL correcta para cada entorno."
