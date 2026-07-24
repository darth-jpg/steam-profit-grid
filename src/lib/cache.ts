interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Guarda um valor na memória com um TTL em segundos
   */
  public set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtém um valor do cache se ainda não tiver expirado
   * @param key Chave de identificação
   * @param ttlSeconds Tempo de vida máximo em segundos
   */
  public get<T>(key: string, ttlSeconds: number = 900): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ageInSeconds = (Date.now() - entry.timestamp) / 1000;
    if (ageInSeconds > ttlSeconds) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Limpa manualmente uma chave ou todo o cache
   */
  public clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Retorna informações sobre o estado atual do cache
   */
  public getInfo(key: string): { exists: boolean; ageSeconds?: number } {
    const entry = this.cache.get(key);
    if (!entry) return { exists: false };
    return {
      exists: true,
      ageSeconds: Math.floor((Date.now() - entry.timestamp) / 1000),
    };
  }
}

// Exporta uma instância única de cache em memória
export const serverCache = new SimpleCache();
