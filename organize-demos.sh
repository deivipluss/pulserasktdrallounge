#!/bin/bash
# Script para organizar archivos de demostración/prueba

echo "Organizando componentes de prueba y demo..."

# Crear directorios para organización
mkdir -p app/examples/components
mkdir -p app/examples/pages
mkdir -p app/examples/api

# Mover componentes de demostración
declare -a demo_components=(
  "ApiTest.tsx"
  "Confetti.tsx" 
  "StyleDemo.tsx"
  "SpinController.tsx"
)

for component in "${demo_components[@]}"; do
  if [ -f "app/components/$component" ]; then
    mv "app/components/$component" "app/examples/components/"
    echo "Movido: app/components/$component -> app/examples/components/"
  fi
done

# Mover rutas API de prueba
if [ -d "app/api/test-csv" ]; then
  mv "app/api/test-csv" "app/examples/api/"
  echo "Movido: app/api/test-csv -> app/examples/api/"
fi

# Mover páginas de prueba
if [ -d "app/dev/test-tokens" ]; then
  mv "app/dev/test-tokens" "app/examples/pages/"
  echo "Movido: app/dev/test-tokens -> app/examples/pages/"
fi

echo "Organización completada."
