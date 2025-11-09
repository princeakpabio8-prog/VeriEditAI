/**
 * Image caching utilities for offline support
 * Uses IndexedDB for storing image blobs
 */

const DB_NAME = 'viral-claims-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const MAX_CACHE_SIZE = 50; // Maximum number of images to cache
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  claimId: string;
}

class ImageCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.cleanupOldEntries();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('claimId', 'claimId', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Cache an image from URL
   */
  async cacheImage(url: string, claimId: string): Promise<void> {
    try {
      const db = await this.ensureDB();

      // Check if already cached
      const existing = await this.get(url);
      if (existing) {
        console.log('Image already cached:', url);
        return;
      }

      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Store in IndexedDB
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const cachedImage: CachedImage = {
        url,
        blob,
        timestamp: Date.now(),
        claimId,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedImage);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('Image cached successfully:', url);

      // Enforce cache size limit
      await this.enforceCacheLimit();
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }

  /**
   * Get cached image
   */
  async get(url: string): Promise<string | null> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const cachedImage = await new Promise<CachedImage | undefined>((resolve, reject) => {
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!cachedImage) {
        return null;
      }

      // Check if cache entry is expired
      if (Date.now() - cachedImage.timestamp > CACHE_DURATION) {
        await this.delete(url);
        return null;
      }

      // Convert blob to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(cachedImage.blob);
      });
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }

  /**
   * Delete a cached image
   */
  async delete(url: string): Promise<void> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(url);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete cached image:', error);
    }
  }

  /**
   * Get all cached images for a claim
   */
  async getClaimImages(claimId: string): Promise<Array<{ url: string; dataUrl: string }>> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('claimId');

      const cachedImages = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = index.getAll(claimId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const results = await Promise.all(
        cachedImages.map(async (cached) => {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(cached.blob);
          });
          return { url: cached.url, dataUrl };
        })
      );

      return results;
    } catch (error) {
      console.error('Failed to get claim images:', error);
      return [];
    }
  }

  /**
   * Clean up old cache entries
   */
  private async cleanupOldEntries(): Promise<void> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const allKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const key of allKeys) {
        const cached = await new Promise<CachedImage | undefined>((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (cached && Date.now() - cached.timestamp > CACHE_DURATION) {
          await new Promise<void>((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old entries:', error);
    }
  }

  /**
   * Enforce maximum cache size
   */
  private async enforceCacheLimit(): Promise<void> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const allEntries = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = index.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (allEntries.length > MAX_CACHE_SIZE) {
        // Sort by timestamp (oldest first)
        allEntries.sort((a, b) => a.timestamp - b.timestamp);

        // Delete oldest entries
        const entriesToDelete = allEntries.slice(0, allEntries.length - MAX_CACHE_SIZE);
        
        for (const entry of entriesToDelete) {
          await new Promise<void>((resolve, reject) => {
            const request = store.delete(entry.url);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }

        console.log(`Removed ${entriesToDelete.length} old cached images`);
      }
    } catch (error) {
      console.error('Failed to enforce cache limit:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clear(): Promise<void> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('Image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const db = await this.ensureDB();

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const allEntries = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const totalSize = allEntries.reduce((sum, entry) => sum + entry.blob.size, 0);

      return {
        count: allEntries.length,
        totalSize,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache();
