// Enhanced Verification Cache with Performance Optimization
// This improves verification speed by implementing intelligent caching
import { lower, safeString } from './string';

interface CachedVerification {
  content: string;
  result: any;
  timestamp: number;
  userId: string;
  confidence: number;
  sources: any[];
  methods: string[];
  category: string;
  embedding?: number[];
}

class EnhancedVerificationCache {
  private cache = new Map<string, CachedVerification>();
  private readonly maxSize = 500; // Increased cache size
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly storageKey = 'enhanced-verification-cache';

  constructor() {
    this.loadFromStorage();
    // Clean expired entries every hour
    setInterval(() => this.cleanExpired(), 60 * 60 * 1000);
  }

  private generateKey(content: string, userId: string): string {
    // Create content hash for consistent caching (null-safe)
    const normalizedContent = lower(content ?? '').trim().slice(0, 500);
    const safeUser = safeString(userId);
    let hash = '';
    try {
      // Safely encode possibly non-ASCII content
      const enc = new TextEncoder();
      const data = enc.encode(normalizedContent);
      const bin = Array.from(data, b => String.fromCharCode(b)).join('');
      hash = btoa(bin).slice(0, 32);
    } catch {
      // Fallback simple hash
      let h = 0;
      for (let i = 0; i < normalizedContent.length; i++) {
        h = ((h << 5) - h) + normalizedContent.charCodeAt(i);
        h |= 0;
      }
      hash = Math.abs(h).toString(36).slice(0, 32);
    }
    return `${safeUser}:${hash}`;
  }

  get(content: string, userId: string): any | null {
    const key = this.generateKey(content, userId);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('✅ Cache hit for verification');
    return cached.result;
  }

  async set(content: string, userId: string, result: any): Promise<void> {
    const key = this.generateKey(content, userId);
    
    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < Math.floor(this.maxSize * 0.2); i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    // Try to get embedding from result metadata
    let embedding = result.metadata?.embedding || null;
    
    const cached: CachedVerification = {
      content: content.substring(0, 1000), // Store truncated content
      result,
      timestamp: Date.now(),
      userId,
      confidence: result.confidence || 0,
      sources: result.sources || [],
      methods: result.verification_method || [],
      category: result.category || 'general',
      embedding
    };

    this.cache.set(key, cached);
    this.saveToStorage();
  }

  // Enhanced cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalEntries = entries.length;
    const averageConfidence = totalEntries > 0 
      ? Math.round(entries.reduce((sum, entry) => sum + entry.confidence, 0) / totalEntries)
      : 0;
    
    const categoryDistribution = entries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const methodsUsed = new Set(
      entries.flatMap(entry => entry.methods)
    ).size;

    return {
      totalEntries,
      averageConfidence,
      categoryDistribution,
      uniqueMethodsUsed: methodsUsed,
      cacheSize: `${(JSON.stringify(this.cache).length / 1024).toFixed(1)}KB`,
      oldestEntry: totalEntries > 0 ? new Date(Math.min(...entries.map(e => e.timestamp))) : null,
      newestEntry: totalEntries > 0 ? new Date(Math.max(...entries.map(e => e.timestamp))) : null
    };
  }

  // Cosine similarity for embeddings
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Find similar verifications using semantic similarity when available
  findSimilar(content: string, userId: string, threshold = 0.7, embedding?: number[]): CachedVerification[] {
    const entries = Array.from(this.cache.values()).filter(cached => cached.userId === userId);
    
    // If we have embeddings, use semantic similarity
    if (embedding) {
      return entries
        .filter(cached => cached.embedding)
        .map(cached => ({
          ...cached,
          similarity: this.cosineSimilarity(embedding, cached.embedding!)
        }))
        .filter((cached: any) => cached.similarity >= threshold)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 5) as any;
    }
    
    // Fallback to word-based similarity
    const normalizedContent = lower(content ?? '').trim();
    const words = normalizedContent.split(/\s+/).filter(w => w.length > 3);
    
    return entries
      .map(cached => {
        const cachedWords = lower(cached.content ?? '').split(/\s+/).filter(w => w.length > 3);
        const commonWords = words.filter(word => cachedWords.includes(word));
        const similarity = commonWords.length / Math.max(words.length, cachedWords.length);
        
        return { ...cached, similarity } as CachedVerification & { similarity: number };
      })
      .filter((cached: any) => cached.similarity >= threshold)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5) as any;
  }

  private cleanExpired(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.maxAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned ${removedCount} expired cache entries`);
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries()).slice(0, 100); // Save only recent 100
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save verification cache:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
        this.cleanExpired(); // Clean any expired entries on load
      }
    } catch (error) {
      console.warn('Failed to load verification cache:', error);
      this.cache = new Map();
    }
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
  }
}

export const enhancedVerificationCache = new EnhancedVerificationCache();