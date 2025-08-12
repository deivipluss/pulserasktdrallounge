# Pulseras KTD Lounge - Aplicación de Ruleta para Eventos

Una aplicación web para un evento especial donde los asistentes pueden escanear un código QR en sus pulseras para participar en un juego de ruleta y ganar premios.

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
- `/public/tokens/`: CSV files con premios preasignados por fecha (YYYY-MM-DD.csv)
- `/docs/`: Documentación adicional y soluciones a problemas específicos

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

## Estructura de Archivos CSV de Tokens

Los archivos CSV de tokens predefinidos deben ubicarse en el directorio `/public/tokens/` para ser accesibles desde el cliente. Cada archivo CSV sigue esta estructura:

```
id,day,prize,sig,url
ktd-2025-08-11-001,2025-08-11,chupetines,662dd0c306e1b62e56d6406185b79c71f941ed2bc458b5307c81ed6f540e40f6,https://pulserasktdrallounge.vercel.app/jugar?id=ktd-2025-08-11-001&sig=662dd0c306e1b62e56d6406185b79c71f941ed2bc458b5307c81ed6f540e40f6
```

El sistema busca automáticamente el archivo CSV correspondiente a la fecha del token (formato `YYYY-MM-DD.csv`).

## Modo de Desarrollo

En desarrollo, el middleware redirige automáticamente a la página de generación de tokens cuando se visita `/jugar` sin un token válido, para facilitar las pruebas.

## Seguridad

- Los tokens son validados con HMAC SHA-256 usando comparaciones seguras contra ataques de timing
- Los tokens solo pueden usarse una vez (almacenamiento en localStorage y cookies)
- La validación ocurre en el middleware antes de permitir el acceso a la página del juego
- La página de administración está protegida por un token configurable

## Licencia

Este proyecto es propiedad exclusiva y solo debe usarse según lo autorizado.