interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  private getStorageKey(key: string): string {
    return `cache_${key}`;
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiresAt;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    if (this.memoryCache.size >= this.maxSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
  }

  set<T>(key: string, data: T, options: { ttl?: number; storage?: 'memory' | 'localStorage' | 'sessionStorage' } = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const expiresAt = Date.now() + ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt
    };

    const storage = options.storage || 'memory';

    if (storage === 'memory') {
      this.evictExpired();
      this.evictOldest();
      this.memoryCache.set(key, item);
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        storageObj.setItem(this.getStorageKey(key), JSON.stringify(item));
      } catch (error) {
        console.warn(`Failed to store in ${storage}:`, error);
        // Fallback to memory cache
        this.memoryCache.set(key, item);
      }
    }
  }

  get<T>(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): T | null {
    let item: CacheItem<T> | null = null;

    if (storage === 'memory') {
      item = this.memoryCache.get(key) || null;
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        const stored = storageObj.getItem(this.getStorageKey(key));
        if (stored) {
          item = JSON.parse(stored);
        }
      } catch (error) {
        console.warn(`Failed to read from ${storage}:`, error);
        // Fallback to memory cache
        item = this.memoryCache.get(key) || null;
      }
    }

    if (!item) return null;

    if (this.isExpired(item)) {
      this.delete(key, storage);
      return null;
    }

    return item.data;
  }

  delete(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): void {
    if (storage === 'memory') {
      this.memoryCache.delete(key);
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        storageObj.removeItem(this.getStorageKey(key));
      } catch (error) {
        console.warn(`Failed to delete from ${storage}:`, error);
      }
    }
  }

  clear(storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): void {
    if (storage === 'memory') {
      this.memoryCache.clear();
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        const keys = Object.keys(storageObj).filter(key => key.startsWith('cache_'));
        keys.forEach(key => storageObj.removeItem(key));
      } catch (error) {
        console.warn(`Failed to clear ${storage}:`, error);
      }
    }
  }

  // Verification-specific cache methods
  cacheVerificationResult(verificationId: string, result: any): void {
    this.set(`verification_${verificationId}`, result, { 
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      storage: 'localStorage' 
    });
  }

  getCachedVerificationResult(verificationId: string): any | null {
    return this.get(`verification_${verificationId}`, 'localStorage');
  }

  cacheUserVerifications(userId: string, verifications: any[]): void {
    this.set(`user_verifications_${userId}`, verifications, {
      ttl: 10 * 60 * 1000, // 10 minutes
      storage: 'sessionStorage'
    });
  }

  getCachedUserVerifications(userId: string): any[] | null {
    return this.get(`user_verifications_${userId}`, 'sessionStorage');
  }

  // Analytics cache
  cacheAnalytics(timeRange: string, data: any): void {
    this.set(`analytics_${timeRange}`, data, {
      ttl: 5 * 60 * 1000, // 5 minutes
      storage: 'memory'
    });
  }

  getCachedAnalytics(timeRange: string): any | null {
    return this.get(`analytics_${timeRange}`, 'memory');
  }
}

// Global cache instance
export const cache = new CacheManager({
  maxSize: 200,
  ttl: 5 * 60 * 1000 // 5 minutes default
});

// Verification cache utilities
export const verificationCache = {
  result: (id: string, data?: any) => {
    if (data !== undefined) {
      cache.cacheVerificationResult(id, data);
    }
    return cache.getCachedVerificationResult(id);
  },
  
  userVerifications: (userId: string, data?: any[]) => {
    if (data !== undefined) {
      cache.cacheUserVerifications(userId, data);
    }
    return cache.getCachedUserVerifications(userId);
  },
  
  analytics: (timeRange: string, data?: any) => {
    if (data !== undefined) {
      cache.cacheAnalytics(timeRange, data);
    }
    return cache.getCachedAnalytics(timeRange);
  }
};