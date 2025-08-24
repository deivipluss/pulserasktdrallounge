# Guía de Tokens del Sistema

## Problema de "Acceso Denegado" en Producción

Si los tokens funcionan localmente pero muestran "Acceso Denegado" en producción, el problema es que los tokens fueron firmados con una clave de desarrollo diferente a la que se usa en producción.

## Solución: Generar Tokens Compatibles con Producción

Para resolver este problema, hemos creado scripts que permiten regenerar tokens firmados con la clave de producción:

1. **Para generar o actualizar tokens para producción:**
   ```
   ./generar-tokens-produccion.sh
   ```
   Este script te pedirá la clave de firma de producción y actualizará los tokens en el archivo CSV del día actual.

2. **Para verificar si un token específico es válido:**
   ```
   ./verificar-token-produccion.sh ktd-2025-08-24-019
   ```
   Este script te mostrará las firmas de desarrollo y producción para un token, junto con las URLs para pruebas.

## Cómo Funcionan los Tokens

Cada token tiene los siguientes componentes:
- **ID:** Un identificador único (ej: `ktd-2025-08-24-019`)
- **Firma:** Generada con HMAC SHA-256 usando una clave secreta y el ID como entrada
- **Premio:** El premio asignado al token (agua, chupetines, etc.)

### Validación de Tokens

El sistema valida los tokens de la siguiente manera:
1. El middleware intercepta las solicitudes a `/jugar`
2. Verifica la presencia de los parámetros `id` y `sig` en la URL
3. En desarrollo, permite cualquier token (bypass de seguridad)
4. En producción, redirige a `/api/verify-token` para validar el token
5. Si el token es válido, permite el acceso a la página de juego
6. Si no es válido, redirige a "Acceso Denegado"

## Recomendaciones de Seguridad

1. Nunca compartas la clave de firma de producción en repositorios públicos
2. Usa claves diferentes para desarrollo y producción
3. La clave debe tener al menos 32 caracteres para seguridad adecuada
