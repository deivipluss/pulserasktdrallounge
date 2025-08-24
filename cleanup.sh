#!/bin/bash
# Script para limpiar archivos de respaldo y temporales

echo "Iniciando limpieza del proyecto..."

# Crear directorio de archivo por si necesitamos restaurar algo después
mkdir -p .archive/backups

# 1. Mover archivos de respaldo a .archive
echo "Moviendo archivos de respaldo..."
find . -name "*.backup*" -o -name "*.original" -o -name "*.old" -o -name "*.new" -o -name "*.simple" -not -path "./.next/*" | while read file; do
  dir=$(dirname "$file")
  base=$(basename "$file")
  mkdir -p ".archive/$dir"
  mv "$file" ".archive/$dir/"
  echo "Archivado: $file -> .archive/$dir/$base"
done

# 2. Mover backups a .archive
echo "Moviendo carpetas de backups..."
if [ -d "backups" ]; then
  mv backups/* .archive/backups/
  rmdir backups
  echo "Movidos contenidos de backups/ a .archive/backups/"
fi

# 3. Limpiar scripts de prueba redundantes
echo "Limpiando scripts redundantes..."
for script in test-token.sh test-tokens.sh check-token.sh implementar_solucion.sh; do
  if [ -f "$script" ]; then
    mkdir -p .archive/scripts
    mv "$script" .archive/scripts/
    echo "Archivado: $script -> .archive/scripts/$script"
  fi
done

# 4. Limpiar archivos JS duplicados de los scripts TS
echo "Limpiando scripts JS duplicados..."
for ts_file in $(find ./scripts -name "*.ts"); do
  js_file="${ts_file%.ts}.js"
  if [ -f "$js_file" ]; then
    mkdir -p ".archive/$(dirname "$js_file")"
    mv "$js_file" ".archive/$(dirname "$js_file")/"
    echo "Archivado JS duplicado: $js_file -> .archive/$js_file"
  fi
done

echo "Limpieza completada."
echo "Los archivos originales se guardaron en el directorio .archive/ por seguridad."
