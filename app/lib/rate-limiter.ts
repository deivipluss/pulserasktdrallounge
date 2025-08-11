'use server';

// Una clase simple para gestionar rate limiting por IP
export class RateLimiter {
  // Bucket para almacenar las solicitudes por IP (se reinicia con cada invocación serverless)
  private static requestBucket = new Map<string, { count: number, timestamp: number }>();
  
  // Límites configurables
  private maxRequests: number;
  private windowMs: number;
  
  /**
   * Constructor
   * @param maxRequests - Número máximo de solicitudes en la ventana de tiempo
   * @param windowMs - Ventana de tiempo en milisegundos
   */
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  /**
   * Verifica si una IP ha excedido el límite de solicitudes
   * @param ip - Dirección IP a verificar
   * @returns true si se permite la solicitud, false si se excedió el límite
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    
    // Limpiar entradas antiguas (esto normalmente no sería necesario en serverless,
    // pero es útil para pruebas locales con servidor en ejecución continua)
    this.cleanup(now);
    
    // Obtener o crear el registro para esta IP
    const record = RateLimiter.requestBucket.get(ip) || { count: 0, timestamp: now };
    
    // Si el registro es antiguo, reiniciarlo
    if (now - record.timestamp > this.windowMs) {
      record.count = 1;
      record.timestamp = now;
      RateLimiter.requestBucket.set(ip, record);
      return true;
    }
    
    // Incrementar contador
    record.count++;
    RateLimiter.requestBucket.set(ip, record);
    
    // Verificar si excede el límite
    return record.count <= this.maxRequests;
  }
  
  /**
   * Limpia entradas antiguas del bucket
   */
  private cleanup(now: number): void {
    for (const [ip, record] of RateLimiter.requestBucket.entries()) {
      if (now - record.timestamp > this.windowMs) {
        RateLimiter.requestBucket.delete(ip);
      }
    }
  }
  
  /**
   * Obtiene el número de solicitudes restantes para una IP
   */
  getRemainingRequests(ip: string): number {
    const record = RateLimiter.requestBucket.get(ip);
    if (!record) return this.maxRequests;
    
    // Si el registro es antiguo, reiniciarlo
    if (Date.now() - record.timestamp > this.windowMs) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - record.count);
  }
}
