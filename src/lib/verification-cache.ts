// Verification Result Caching System
export interface CachedVerification {
  content: string;
  result: any;
  timestamp: number;
  userId: string;
}

class VerificationCache {
  private cache = new Map<string, CachedVerification>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100; // Maximum cached items

  private generateKey(content: string, userId: string): string {
    // Create a simple hash of content + userId that handles Unicode characters
    try {
      // Use TextEncoder to safely convert to bytes, then btoa
      const encoder = new TextEncoder();
      const data = encoder.encode(content + userId);
      const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString).slice(0, 20);
    } catch (error) {
      // Fallback: use a simple hash without btoa
      let hash = 0;
      const str = content + userId;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36).slice(0, 20);
    }
  }

  set(content: string, userId: string, result: any): void {
    const key = this.generateKey(content, userId);
    
    // Remove oldest items if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      content,
      result,
      timestamp: Date.now(),
      userId
    });

    // Persist to localStorage for cross-session caching
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('verification-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }

  get(content: string, userId: string): any | null {
    this.loadFromLocalStorage();
    
    const key = this.generateKey(content, userId);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem('verification-cache');
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('verification-cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
        
        // Clean expired entries
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
          if (now - value.timestamp > this.CACHE_DURATION) {
            this.cache.delete(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  getStats(): { size: number; oldestTimestamp: number | null } {
    this.loadFromLocalStorage();
    
    let oldestTimestamp = null;
    for (const cached of this.cache.values()) {
      if (!oldestTimestamp || cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestTimestamp
    };
  }
}

export const verificationCache = new VerificationCache();