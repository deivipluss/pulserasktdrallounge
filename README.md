# Pulseras KTD Lounge - Aplicación de Ruleta para Eventos

Una aplicación web para un evento especial donde los asistentes pueden escanear un código QR en sus pulseras para participar en un juego de ruleta y ganar premios.

## Solución a Problemas de Visualización de Premios

Se ha corregido un error crítico en la ruleta donde los premios visualizados no correspondían con los premios ganados. Ver [SOLUCION_RULETA.md](SOLUCION_RULETA.md) para detalles de la implementación.

### Herramientas de Depuración

Para verificar el funcionamiento correcto de la ruleta:

1. Accede a la página: [http://localhost:3001/jugar?id=ktd-2025-08-20-001](http://localhost:3001/jugar?id=ktd-2025-08-20-001)
2. Abre la consola del navegador (F12)
3. Carga el script de verificación:
   ```javascript
   fetch('/verificar-ruleta.js').then(r => r.text()).then(code => eval(code))
   ```
4. Consulta la guía detallada: [http://localhost:3001/debug-guide.html](http://localhost:3001/debug-guide.html)

## Actualización: Sistema de Premio Garantizado y Accesibilidad Mejorada

Esta actualización implementa un sistema de "Nuevo intento" con premio garantizado para la ruleta y mejoras significativas en accesibilidad:

1. **Primer Giro:** Si cae en "Nuevo intento", se activa el modo de reintento
2. **Reintento:** Un segundo giro automático con premio garantizado preseleccionado
3. **Seguridad:** No es posible obtener "Nuevo intento" en el segundo giro
4. **Bloqueo:** Después de recibir un premio real, la pulsera queda bloqueada
5. **Accesibilidad:** Contraste AA, roles ARIA, y gestión del foco mejorada

## Características

- 🎲 Juego de ruleta interactivo con 7 segmentos personalizables
- 🎯 Sistema de "Nuevo intento" con premio garantizado
- 🔒 Sistema de validación de tokens con HMAC SHA-256
- ⏱️ Control de acceso basado en tiempo (zona horaria América/Lima)
- 🎭 Tokens de uso único por usuario
- 🎨 Diseño vibrante "modo fiesta" con Tailwind CSS
- 📱 Experiencia responsive para móviles y escritorio con soporte para safe-area insets
- 🔊 Efectos de sonido con Web Audio API (carga diferida)
- 📳 Vibración táctil en dispositivos móviles con patrones personalizados
- ✨ Microinteracciones y animaciones con framer-motion
- 🎉 Efectos visuales de confeti y chispas al ganar
- 🛠️ Herramientas de desarrollo para pruebas
- 🌈 Componente Wheel con 7 segmentos de colores personalizados
- ♿ Accesibilidad avanzada (contraste AA, roles ARIA, focus management)
- 📊 Sistema de pesos personalizados para la distribución de premios
- 🔄 Modos de operación "free" y "force" para la ruleta
- 🎫 Sistema de tokens preasignados con csv-parse

## Tecnologías

- Next.js 15.4.6 con App Router
- TypeScript
- Tailwind CSS
- framer-motion para animaciones y microinteracciones avanzadas
- Web Audio API para efectos de sonido optimizados sin lag
- canvas-confetti para efectos visuales de celebración
- Vibration API para feedback táctil en dispositivos móviles
- dayjs para manejo de fechas y zonas horarias
- zod para validación de datos
- js-cookie para manejo de cookies
- csv-parse 6.1.0 para procesamiento de archivos CSV con tokens preasignados

## Configuración

### Variables de entorno

Crea un archivo `.env.local` con las siguientes variables:

```bash
NEXT_PUBLIC_EVENT_TZ=America/Lima
EVENT_START_ISO=2025-08-11T19:00:00-05:00
QR_BASE_URL=https://ejemplo.com/qr
SIGNING_SECRET=clave_secreta_minimo_32_caracteres
ADMIN_TOKEN=admin-token-2025
DEFAULT_RETRY_PROBABILITY=0.15
DEFAULT_MAX_RETRIES=1
```

### Instalación

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Construir para producción
pnpm build

# Iniciar versión de producción
pnpm start

# Generar tokens preasignados
pnpm ts-node scripts/generate-tokens.ts
```

## Uso

### Para administradores:

1. Configurar la fecha del evento en `EVENT_START_ISO`
2. Generar tokens preasignados usando el script `scripts/generate-tokens.ts`
3. Crear códigos QR que apunten a la URL: `https://[dominio]/jugar?id=ID_UNICO&sig=FIRMA`
4. Acceder a `/status?token=ADMIN_TOKEN` para ajustar la probabilidad de "Nuevo intento" y el máximo de reintentos

### Para desarrolladores:

1. Usar la página `/dev/test-tokens` para generar y probar tokens
2. Verificar el estado del evento y la cuenta regresiva
3. Probar la validación de tokens y el flujo completo del juego
4. Explorar la demostración en `/demo/seven-wheel` para probar la ruleta en modos "free" y "force"

### Instrucciones para probar y depurar la ruleta

1. **Acceder a la página de juego**:
   - Con token predefinido: http://localhost:3000/jugar?id=ktd-2025-08-20-001
   - Con diferentes premios: prueba otros IDs como ktd-2025-08-20-002, ktd-2025-08-20-003, etc.

2. **Depurar desde la consola del navegador**:
   - Abre la consola del navegador (F12 o Cmd+Option+I en Mac)
   - Carga el script de verificación:
     ```javascript
     fetch('/verificar-ruleta.js').then(r => r.text()).then(code => eval(code))
     ```
   - O carga el script de prueba completo:
     ```javascript
     fetch('/test-ruleta.js').then(r => r.text()).then(code => eval(code))
     ```
   - Comandos disponibles:
     - `probarTodosLosPremios()` - Prueba todos los premios en secuencia
     - `probarPremio("Popcorn")` - Prueba un premio específico
     - `window.__showRouletteSectors()` - Muestra información sobre los sectores

3. **Verificar alineación de sectores**:
   - Activa el modo debug: `window.__debugRouletteMode = true`
   - Revisa la consola para mensajes detallados sobre cada sector

### URLs principales:

- `http://localhost:3000` - Página principal
- `http://localhost:3000/demo/seven-wheel` - Demostración de la ruleta
- `http://localhost:3000/status?token=admin-token-2025` - Panel de administración

## Estructura del Proyecto

- `/app/jugar`: Ruta principal del juego con la ruleta
- `/app/demo`: Demostraciones interactivas de los componentes
- `/app/demo/seven-wheel`: Demostración específica de la ruleta con 7 segmentos
- `/app/status`: Página de administración protegida para configurar probabilidades
- `/app/lib/token-utils.ts`: Utilidades para validación de tokens
- `/app/lib/env.ts`: Configuración y validación de variables de entorno
- `/app/lib/played-storage.ts`: Sistema para registro de usuarios que ya han jugado
- `/app/lib/hmac.ts`: Implementación de firma HMAC para enlaces QR
- `/app/lib/rate-limiter.ts`: Sistema de rate limiting por IP
- `/app/lib/prizes.ts`: Lógica de selección de premios con sistema de pesos personalizados
- `/app/lib/audio-service.ts`: Servicio para gestión de sonidos y vibraciones
- `/app/components/Wheel.tsx`: Componente de ruleta con 7 segmentos y modos free/force
- `/app/components/SpinController.tsx`: Controlador para la ruleta
- `/app/components/ResultDialog.tsx`: Diálogo accesible que muestra el resultado del giro
- `/scripts/generate-tokens.ts`: Script para generar tokens preasignados en formato CSV

## Modos de Operación de la Ruleta

El componente `Wheel` soporta dos modos de operación:

- **Modo "free"**: Utiliza un sistema de pesos personalizados para determinar la probabilidad de cada premio
- **Modo "force"**: Permite forzar un premio específico, ignorando los pesos (útil para garantizar premios)

## Accesibilidad

La aplicación implementa múltiples mejoras de accesibilidad:

- **Contraste AA**: Colores ajustados automáticamente para garantizar un ratio de contraste 4.5:1
- **Roles ARIA**: Diálogos y componentes interactivos con roles y atributos ARIA adecuados
- **Focus Management**: Gestión del foco para navegación por teclado
- **Safe-Area Insets**: Soporte para insets seguros en dispositivos móviles con notches o bordes redondeados
- **Áreas táctiles ampliadas**: Botones CTA con área táctil aumentada para mejor usabilidad

## Modo de Desarrollo

En desarrollo, el middleware redirige automáticamente a la página de generación de tokens cuando se visita `/jugar` sin un token válido, para facilitar las pruebas.

## Seguridad

- Los tokens son validados con HMAC SHA-256 usando comparaciones seguras contra ataques de timing
- Los tokens solo pueden usarse una vez (almacenamiento en localStorage y cookies)
- La validación ocurre en el middleware antes de permitir el acceso a la página del juego
- La página de administración está protegida por un token configurable

## Licencia

Este proyecto es propiedad exclusiva y solo debe usarse según lo autorizado.