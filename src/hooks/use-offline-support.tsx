import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { verificationCache } from '@/lib/cache';

interface OfflineQueueItem {
  id: string;
  type: 'verification' | 'analytics' | 'user_action';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

interface OfflineStatus {
  isOnline: boolean;
  isSupported: boolean;
  queueLength: number;
  lastSync: string | null;
}

export const useOfflineSupport = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isSupported: 'serviceWorker' in navigator && 'localStorage' in window,
    queueLength: 0,
    lastSync: null
  });
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const { toast } = useToast();

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offline-queue');
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
        setStatus(prev => ({ ...prev, queueLength: parsedQueue.length }));
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('offline-queue', JSON.stringify(queue));
    setStatus(prev => ({ ...prev, queueLength: queue.length }));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "Back Online",
        description: "Syncing queued data...",
      });
      processQueue();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "You're Offline",
        description: "Data will be synced when you reconnect.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    setQueue(prev => [...prev, queueItem]);

    // Cache verification data for offline access
    if (item.type === 'verification') {
      verificationCache.result(queueItem.id, item.data);
    }

    return queueItem.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (!status.isOnline || queue.length === 0) return;

    const itemsToProcess = [...queue];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of itemsToProcess) {
      try {
        await processQueueItem(item);
        // Remove successfully processed item
        setQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);
        
        // Retry logic
        if (item.retryCount < item.maxRetries) {
          const retryItem = {
            ...item,
            retryCount: item.retryCount + 1
          };
          failedItems.push(retryItem);
        } else {
          // Max retries reached, remove from queue
          setQueue(prev => prev.filter(q => q.id !== item.id));
          toast({
            title: "Sync Failed",
            description: `Failed to sync ${item.type} after ${item.maxRetries} attempts`,
            variant: "destructive",
          });
        }
      }
    }

    // Update queue with failed items that should be retried
    if (failedItems.length > 0) {
      setQueue(prev => prev.map(item => {
        const failedItem = failedItems.find(f => f.id === item.id);
        return failedItem || item;
      }));
    }

    if (queue.length > failedItems.length) {
      setStatus(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: `${queue.length - failedItems.length} items synced successfully`,
      });
    }
  }, [status.isOnline, queue, toast]);

  const processQueueItem = async (item: OfflineQueueItem): Promise<void> => {
    switch (item.type) {
      case 'verification':
        await processVerificationItem(item);
        break;
      case 'analytics':
        await processAnalyticsItem(item);
        break;
      case 'user_action':
        await processUserActionItem(item);
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  };

  const processVerificationItem = async (item: OfflineQueueItem): Promise<void> => {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update cache with server result
    verificationCache.result(item.data.verificationId, result);
  };

  const processAnalyticsItem = async (item: OfflineQueueItem): Promise<void> => {
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  };

  const processUserActionItem = async (item: OfflineQueueItem): Promise<void> => {
    const response = await fetch('/api/user-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  };

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem('offline-queue');
    toast({
      title: "Queue Cleared",
      description: "All offline data has been cleared",
    });
  }, [toast]);

  const retryQueue = useCallback(() => {
    if (status.isOnline) {
      processQueue();
    } else {
      toast({
        title: "No Connection",
        description: "Please check your internet connection and try again",
        variant: "destructive",
      });
    }
  }, [status.isOnline, processQueue, toast]);

  // Offline verification handler
  const handleOfflineVerification = useCallback((verificationData: any) => {
    const queueId = addToQueue({
      type: 'verification',
      data: verificationData,
      maxRetries: 3
    });

    // Store optimistic result for immediate UI feedback
    const optimisticResult = {
      id: verificationData.verificationId || queueId,
      status: 'pending',
      trust_score: null,
      result_summary: 'Verification queued for processing when online',
      created_at: new Date().toISOString(),
      offline: true
    };

    verificationCache.result(queueId, optimisticResult);

    toast({
      title: "Verification Queued",
      description: "Your verification will be processed when you're back online",
    });

    return queueId;
  }, [addToQueue, toast]);

  // Analytics tracking for offline events
  const trackOfflineEvent = useCallback((eventName: string, eventData: any) => {
    addToQueue({
      type: 'analytics',
      data: {
        event: eventName,
        properties: eventData,
        timestamp: new Date().toISOString()
      },
      maxRetries: 2
    });
  }, [addToQueue]);

  return {
    status,
    queue,
    addToQueue,
    processQueue,
    clearQueue,
    retryQueue,
    handleOfflineVerification,
    trackOfflineEvent
  };
};