// Enhanced Verification Result Caching System with 24-hour TTL and Performance Monitoring
export interface CachedVerification {
  content: string;
  result: any;
  timestamp: number;
  userId: string;
}

class VerificationCache {
  private cache = new Map<string, CachedVerification>();
  private readonly maxSize = 1000;
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.loadFromStorage();
  }

  get(content: string, userId: string): any | null {
    const key = this.generateKey(content, userId);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.missCount++;
      return null;
    }
    
    // Check if cache entry has expired (24 hours)
    const now = Date.now();
    const age = now - cached.timestamp;
    
    if (age > this.cacheExpiry) {
      console.log('🗑️ Cache entry expired, removing:', key.substring(0, 20) + '...');
      this.cache.delete(key);
      this.saveToStorage();
      this.missCount++;
      return null;
    }
    
    // Update access timestamp for LRU
    cached.timestamp = now;
    this.saveToStorage();
    this.hitCount++;
    
    console.log('🎯 Cache hit! Age:', Math.round(age / 1000 / 60), 'minutes');
    return cached.result;
  }

  set(content: string, userId: string, result: any): void {
    const key = this.generateKey(content, userId);
    
    // Clean expired entries before adding new ones
    this.cleanExpiredEntries();
    
    // If cache is at max size, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKeys = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, Math.floor(this.maxSize * 0.2)) // Remove 20% of oldest entries
        .map(([key]) => key);
      
      oldestKeys.forEach(key => this.cache.delete(key));
      console.log(`🧹 Cleaned ${oldestKeys.length} old cache entries`);
    }
    
    const cacheEntry: CachedVerification = {
      content,
      result,
      timestamp: Date.now(),
      userId
    };
    
    this.cache.set(key, cacheEntry);
    console.log('💾 Cached verification result for 24 hours');
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('verification_cache');
    }
  }

  getStats(): { 
    size: number; 
    oldestTimestamp: number | null;
    hitRate: number;
    totalEntries: number;
    cacheHealth: string;
  } {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => (now - entry.timestamp) <= this.cacheExpiry);
    
    const timestamps = validEntries.map(entry => entry.timestamp);
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null;
    
    // Calculate cache health
    const avgAge = validEntries.length > 0 
      ? validEntries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / validEntries.length
      : 0;
    
    const avgAgeHours = avgAge / (1000 * 60 * 60);
    const cacheHealth = avgAgeHours < 6 ? 'Excellent' : 
                       avgAgeHours < 12 ? 'Good' : 
                       avgAgeHours < 20 ? 'Fair' : 'Poor';
    
    return {
      size: validEntries.length,
      oldestTimestamp,
      hitRate: this.calculateHitRate(),
      totalEntries: this.cache.size,
      cacheHealth
    };
  }

  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount;
    if (total === 0) return 0;
    return Math.round((this.hitCount / total) * 100);
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

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

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          cache: Array.from(this.cache.entries()),
          hitCount: this.hitCount,
          missCount: this.missCount,
          timestamp: Date.now()
        };
        localStorage.setItem('verification_cache', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save cache to localStorage:', error);
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('verification_cache');
        if (stored) {
          const data = JSON.parse(stored);
          
          // Load cache entries
          if (data.cache && Array.isArray(data.cache)) {
            this.cache = new Map(data.cache);
          }
          
          // Load statistics
          this.hitCount = data.hitCount || 0;
          this.missCount = data.missCount || 0;
          
          // Clean expired entries on load
          this.cleanExpiredEntries();
        }
      } catch (error) {
        console.warn('Failed to load cache from localStorage:', error);
      }
    }
  }
}

export const verificationCache = new VerificationCache();