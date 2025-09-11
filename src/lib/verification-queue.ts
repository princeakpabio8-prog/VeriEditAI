// Enhanced Verification Queue System for Scaling
import { supabase } from '@/integrations/supabase/client';

interface QueueItem {
  id: string;
  content: string;
  userId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  estimatedTime?: number;
}

export class VerificationQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private concurrentLimit = 3; // Concurrent verifications
  private currentlyProcessing = new Set<string>();
  private rateLimitWindow = 60000; // 1 minute
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    this.loadFromStorage();
    this.startWorker();
  }

  // Add verification to queue with smart prioritization
  async addToQueue(
    content: string, 
    userId: string, 
    options: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      category?: string;
      expedite?: boolean;
    } = {}
  ): Promise<string> {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      content,
      userId,
      priority: options.priority || 'normal',
      category: options.category,
      retryCount: 0,
      maxRetries: 3,
      timestamp: Date.now(),
      estimatedTime: this.estimateProcessingTime(content, options.category)
    };

    // Smart insertion based on priority
    if (options.expedite || options.priority === 'urgent') {
      this.queue.unshift(item);
    } else {
      this.insertByPriority(item);
    }

    this.saveToStorage();
    this.processNext();
    
    return item.id;
  }

  private insertByPriority(item: QueueItem) {
    const priorityWeights = { urgent: 4, high: 3, normal: 2, low: 1 };
    const insertIndex = this.queue.findIndex(
      queueItem => priorityWeights[item.priority] > priorityWeights[queueItem.priority]
    );
    
    if (insertIndex === -1) {
      this.queue.push(item);
    } else {
      this.queue.splice(insertIndex, 0, item);
    }
  }

  private estimateProcessingTime(content: string, category?: string): number {
    // Base time estimation in ms
    const baseTime = 3000;
    const contentLengthFactor = Math.min(content.length / 1000, 3);
    const categoryMultiplier = this.getCategoryComplexity(category);
    
    return Math.round(baseTime * (1 + contentLengthFactor) * categoryMultiplier);
  }

  private getCategoryComplexity(category?: string): number {
    const complexityMap: Record<string, number> = {
      'political': 1.5,
      'health & science': 1.4,
      'defence and war': 1.3,
      'climate & environment': 1.2,
      'sports': 0.8,
      'social media virality': 0.9
    };
    return complexityMap[category || 'news & current events'] || 1.0;
  }

  // Rate limiting and concurrency control
  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    if (this.currentlyProcessing.size >= this.concurrentLimit) return;
    if (this.isRateLimited()) return;

    this.processing = true;
    const item = this.queue.shift();
    
    if (!item) {
      this.processing = false;
      return;
    }

    this.currentlyProcessing.add(item.id);
    this.trackRateLimit();

    try {
      await this.processVerification(item);
    } catch (error) {
      await this.handleVerificationError(item, error);
    } finally {
      this.currentlyProcessing.delete(item.id);
      this.processing = false;
      this.saveToStorage();
      
      // Process next item
      setTimeout(() => this.processNext(), 100);
    }
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    return this.requestCount >= 60; // 60 requests per minute
  }

  private trackRateLimit() {
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  private async processVerification(item: QueueItem): Promise<void> {
    const { data, error } = await supabase.functions.invoke('verify', {
      body: {
        content: item.content,
        user_id: item.userId,
        category: item.category,
        priority: item.priority
      }
    });

    if (error) throw error;

    // Emit success event
    this.emitEvent('verification:complete', {
      id: item.id,
      result: data,
      processingTime: Date.now() - item.timestamp
    });
  }

  private async handleVerificationError(item: QueueItem, error: any): Promise<void> {
    item.retryCount++;
    
    if (item.retryCount < item.maxRetries) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, item.retryCount), 30000);
      
      setTimeout(() => {
        // Re-add to queue with lower priority
        item.priority = 'low';
        this.insertByPriority(item);
        this.saveToStorage();
      }, delay);
    } else {
      // Max retries reached - emit failure
      this.emitEvent('verification:failed', {
        id: item.id,
        error: error.message || 'Max retries exceeded'
      });
    }
  }

  // Event system for UI updates
  private eventListeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emitEvent(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // Persistence
  private saveToStorage() {
    try {
      localStorage.setItem('verification-queue', JSON.stringify({
        queue: this.queue,
        processing: Array.from(this.currentlyProcessing)
      }));
    } catch (error) {
      console.warn('Failed to save queue to storage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('verification-queue');
      if (stored) {
        const data = JSON.parse(stored);
        this.queue = data.queue || [];
        
        // Clean up old items (older than 1 hour)
        const cutoff = Date.now() - 3600000;
        this.queue = this.queue.filter(item => item.timestamp > cutoff);
      }
    } catch (error) {
      console.warn('Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  private startWorker() {
    // Process queue every 5 seconds
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processNext();
      }
    }, 5000);
  }

  // Public API
  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.currentlyProcessing.size,
      estimatedWaitTime: this.queue.reduce((total, item) => total + (item.estimatedTime || 3000), 0)
    };
  }

  clearQueue() {
    this.queue = [];
    this.saveToStorage();
  }

  removeFromQueue(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveToStorage();
  }
}

export const verificationQueue = new VerificationQueue();