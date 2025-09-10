import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/contexts/LicenseContext';

interface QueueItem {
  id: string;
  content: string;
  type: 'text' | 'url' | 'file';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'normal' | 'high';
  progress: number;
  result?: any;
  error?: string;
  retryCount: number;
  estimatedTime?: number;
  startTime?: Date;
  endTime?: Date;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageTime: number;
  successRate: number;
}

export const useVerificationQueue = () => {
  const { user } = useAuth();
  const { incrementUsage } = useLicense();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Add items to queue
  const addToQueue = useCallback((items: Omit<QueueItem, 'id' | 'status' | 'progress' | 'retryCount'>[]) => {
    const newItems: QueueItem[] = items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      retryCount: 0,
      priority: item.priority || 'normal'
    }));

    setQueue(prev => {
      const combined = [...prev, ...newItems];
      // Sort by priority: high -> normal -> low
      return combined.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });

    return newItems;
  }, []);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear completed items
  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(item => item.status !== 'completed'));
  }, []);

  // Clear failed items
  const clearFailed = useCallback(() => {
    setQueue(prev => prev.filter(item => item.status !== 'failed'));
  }, []);

  // Retry failed items
  const retryFailed = useCallback(() => {
    setQueue(prev => prev.map(item => 
      item.status === 'failed' 
        ? { ...item, status: 'pending', error: undefined, retryCount: item.retryCount + 1 }
        : item
    ));
  }, []);

  // Update item status
  const updateItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Process verification for a single item
  const processItem = useCallback(async (item: QueueItem): Promise<void> => {
    try {
      updateItem(item.id, { 
        status: 'processing', 
        startTime: new Date(),
        progress: 10 
      });

      // Check usage limits
      const usageResult = await incrementUsage(1);
      if (!usageResult.success) {
        throw new Error(usageResult.error || 'Usage limit exceeded');
      }

      updateItem(item.id, { progress: 20 });

      // Simulate verification API call
      const { data, error } = await supabase.functions.invoke('verify', {
        body: {
          content: item.content,
          contentType: item.type,
        },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      updateItem(item.id, { progress: 80 });

      if (error) throw error;

      // Success
      updateItem(item.id, {
        status: 'completed',
        progress: 100,
        result: data,
        endTime: new Date()
      });

    } catch (error: any) {
      console.error(`Verification failed for item ${item.id}:`, error);
      updateItem(item.id, {
        status: 'failed',
        progress: 0,
        error: error.message || 'Verification failed',
        endTime: new Date()
      });
    }
  }, [incrementUsage, updateItem]);

  // Start queue processing
  const startQueue = useCallback(async () => {
    if (isProcessing || queue.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    abortController.current = new AbortController();

    const pendingItems = queue.filter(item => item.status === 'pending');
    
    for (const item of pendingItems) {
      if (isPaused || abortController.current?.signal.aborted) break;

      setCurrentItem(item.id);
      await processItem(item);

      // Small delay between items to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsProcessing(false);
    setCurrentItem(null);
  }, [isProcessing, queue, isPaused, processItem]);

  // Pause queue processing
  const pauseQueue = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume queue processing
  const resumeQueue = useCallback(() => {
    setIsPaused(false);
    if (!isProcessing) {
      startQueue();
    }
  }, [isProcessing, startQueue]);

  // Stop queue processing
  const stopQueue = useCallback(() => {
    setIsPaused(false);
    setIsProcessing(false);
    setCurrentItem(null);
    abortController.current?.abort();
    
    // Reset processing items to pending
    setQueue(prev => prev.map(item => 
      item.status === 'processing' 
        ? { ...item, status: 'pending', progress: 0 }
        : item
    ));
  }, []);

  // Get queue statistics
  const getStats = useCallback((): QueueStats => {
    const total = queue.length;
    const pending = queue.filter(item => item.status === 'pending').length;
    const processing = queue.filter(item => item.status === 'processing').length;
    const completed = queue.filter(item => item.status === 'completed').length;
    const failed = queue.filter(item => item.status === 'failed').length;
    
    const completedItems = queue.filter(item => item.status === 'completed' && item.startTime && item.endTime);
    const averageTime = completedItems.length > 0
      ? completedItems.reduce((acc, item) => {
          const duration = item.endTime!.getTime() - item.startTime!.getTime();
          return acc + duration;
        }, 0) / completedItems.length
      : 0;

    const successRate = total > 0 ? (completed / (completed + failed)) * 100 : 0;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      averageTime,
      successRate
    };
  }, [queue]);

  // Batch operations
  const batchOperations = {
    prioritizeAll: (priority: QueueItem['priority']) => {
      setQueue(prev => prev.map(item => 
        item.status === 'pending' ? { ...item, priority } : item
      ));
    },
    
    removeByStatus: (status: QueueItem['status']) => {
      setQueue(prev => prev.filter(item => item.status !== status));
    },
    
    retryByType: (type: QueueItem['type']) => {
      setQueue(prev => prev.map(item => 
        item.type === type && item.status === 'failed'
          ? { ...item, status: 'pending', error: undefined, retryCount: item.retryCount + 1 }
          : item
      ));
    }
  };

  return {
    // State
    queue,
    isProcessing,
    isPaused,
    currentItem,
    
    // Actions
    addToQueue,
    removeFromQueue,
    clearCompleted,
    clearFailed,
    retryFailed,
    updateItem,
    
    // Queue control
    startQueue,
    pauseQueue,
    resumeQueue,
    stopQueue,
    
    // Utilities
    getStats,
    batchOperations
  };
};