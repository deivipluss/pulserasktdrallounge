'use client';

/**
 * Servicio para manejar sonidos con Web Audio API
 * Proporciona una mejor experiencia en iOS y evita lag
 */
class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private sources: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private loaded: boolean = false;
  private loadPromise: Promise<void> | null = null;
  
  // Rutas a los archivos de sonido
  private soundPaths = {
    spin: '/sounds/spin.mp3',
    tick: '/sounds/tick.mp3',
    win: '/sounds/win.mp3'
  };

  // Obtener instancia (Singleton)
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Inicializar el contexto de audio de forma diferida
  private initContext() {
    if (typeof window === 'undefined') return;
    
    // Crear contexto de audio solo cuando sea necesario
    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
        }
      } catch (e) {
        console.warn('Web Audio API no soportada:', e);
      }
    }
    
    return this.audioContext;
  }

  // Cargar todos los sonidos de forma diferida
  public async load() {
    if (this.loaded || this.loadPromise) return this.loadPromise;
    
    this.loadPromise = new Promise<void>(async (resolve) => {
      const context = this.initContext();
      if (!context) {
        this.loaded = true;
        resolve();
        return;
      }
      
      // Cargar cada sonido en paralelo
      const loadPromises = Object.entries(this.soundPaths).map(
        ([id, path]) => this.loadSound(id, path)
      );
      
      try {
        await Promise.all(loadPromises);
        this.loaded = true;
        resolve();
      } catch (e) {
        console.warn('Error al cargar sonidos:', e);
        this.loaded = true;
        resolve();
      }
    });
    
    return this.loadPromise;
  }

  // Cargar un sonido específico
  private async loadSound(id: string, url: string): Promise<void> {
    const context = this.initContext();
    if (!context) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);
    } catch (e) {
      console.warn(`Error al cargar sonido ${id}:`, e);
    }
  }

  // Reproducir un sonido
  public play(id: string, options: { loop?: boolean; volume?: number } = {}) {
    const context = this.initContext();
    if (!context || !this.buffers.has(id)) return;
    
    // Detener el mismo sonido si ya está reproduciéndose
    this.stop(id);
    
    // Crear nodos de audio
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    
    // Configurar nodos
    source.buffer = this.buffers.get(id)!;
    source.loop = options.loop || false;
    gainNode.gain.value = options.volume !== undefined ? options.volume : 0.5;
    
    // Conectar nodos
    source.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Resumir el contexto de audio (necesario para iOS/Chrome)
    if (context.state === 'suspended') {
      context.resume();
    }
    
    // Iniciar reproducción
    source.start(0);
    
    // Guardar referencias para poder detenerlo después
    this.sources.set(id, source);
    this.gainNodes.set(id, gainNode);
    
    // Limpiar referencia cuando termine
    if (!options.loop) {
      source.onended = () => {
        this.sources.delete(id);
        this.gainNodes.delete(id);
      };
    }
  }

  // Detener un sonido
  public stop(id: string) {
    const source = this.sources.get(id);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Ignorar errores si ya estaba detenido
      }
      this.sources.delete(id);
      this.gainNodes.delete(id);
    }
  }

  // Verificar si el audio está disponible
  public isAudioAvailable(): boolean {
    return !!this.audioContext;
  }
}

// Exportar una única instancia
export const audioService = AudioService.getInstance();

// Función para vibrar el dispositivo (con degradación elegante)
export const vibrateDevice = (pattern: number[] = [20, 30, 20]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export default audioService;
