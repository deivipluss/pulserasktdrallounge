# Guía de Implementación de la Ruleta de Premios

## Sistema de Pesos y Modos

Esta ruleta ofrece un sistema avanzado de distribución de premios con diferentes modos de operación:

### Modo Libre (free)

- Utiliza pesos para determinar la probabilidad de cada premio
- La sección "Nuevo intento" tiene un peso configurable (15-25%)
- Los pesos de las demás secciones se pueden personalizar

### Modo Forzado (force)

- Ignora los pesos y alinea la ruleta con un premio específico
- Utilizado para garantizar un premio en el segundo giro
- Perfecto para premios preasignados en tokens

### Configuración de Pesos

```typescript
// Ejemplo de configuración de pesos
const customWeights = {
  1: 1,    // Trident
  2: 1,    // Cigarrillos 
  3: 1,    // Cerebritos
  4: 1,    // Popcorn
  5: 1,    // Agua
  6: 1.5,  // Chupetines (más probable)
};

// El peso de "Nuevo intento" se configura por separado
const retryWeight = 0.2; // 20% de probabilidad
```

### Flujo de Reintento

1. Primera tirada: Modo libre con pesos personalizados
   - Si cae en "Nuevo intento", se activa el modo de reintento
   
2. Segunda tirada (reintento): Modo forzado
   - Se selecciona un premio garantizado
   - La ruleta se alinea específicamente con ese premio
   - La sección "Nuevo intento" queda desactivada

## Propiedades del Componente Wheel

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `mode` | 'free' \| 'force' | Modo de operación de la ruleta |
| `forceSegmentId` | number | ID del segmento al que alinear en modo forzado |
| `retryWeight` | number | Probabilidad de "Nuevo intento" (0-1) |
| `weights` | Record<number, number> | Pesos personalizados por ID de premio |

## Instrucciones de Uso

1. Configurar los premios con sus IDs y colores
2. Definir los pesos personalizados para cada premio
3. Establecer la probabilidad del "Nuevo intento" (entre 0.15 y 0.25)
4. Usar modo 'free' para la primera tirada
5. Al obtener "Nuevo intento", cambiar a modo 'force' y establecer un premio garantizado

## Ejemplo

```tsx
<Wheel 
  prizes={prizes}
  mode={isRetry ? 'force' : 'free'}
  forceSegmentId={isRetry ? guaranteedPrizeId : null}
  retryWeight={0.2}
  weights={customWeights}
  onSpinEnd={handleSpinEnd}
/>
```
