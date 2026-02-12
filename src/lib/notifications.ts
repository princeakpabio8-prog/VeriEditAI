import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
  id: string;
  type: 'verification_complete' | 'verification_failed' | 'usage_warning' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  userId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.checkPermission();
    this.initializeServiceWorker();
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    // SERVICE WORKER DISABLED - caused mobile caching issues
    // Do NOT register /sw.js to prevent stale bundle problems
    console.log('Service Worker registration disabled (mobile stability)');
    return;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      if (this.serviceWorkerRegistration) {
        // Use service worker for persistent notifications
        await this.serviceWorkerRegistration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/icon-72x72.png',
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          tag: options.data?.id || Date.now().toString()
        } as any);
      } else {
        // Fallback to basic notification
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          data: options.data
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service Worker not available');
      return null;
    }

    try {
      // Note: You'll need to add your VAPID public key here
      const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      this.subscription = await (this.serviceWorkerRegistration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey ? this.urlBase64ToUint8Array(applicationServerKey) : undefined
      });

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array<ArrayBuffer>;
  }
}

// Global notification manager
export const notificationManager = new NotificationManager();

// React hook for real-time notifications
export const useRealTimeNotifications = (userId: string | undefined) => {
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  const handleNotification = useCallback((payload: NotificationPayload) => {
    // Show toast notification
    toast({
      title: payload.title,
      description: payload.message,
      variant: payload.type.includes('failed') || payload.type.includes('warning') ? 'destructive' : 'default',
    });

    // Show browser notification if supported
    notificationManager.showNotification({
      title: payload.title,
      body: payload.message,
      data: payload,
      requireInteraction: payload.priority === 'urgent'
    });
  }, [toast]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to real-time notifications
    channelRef.current = supabase.channel(`notifications:${userId}`)
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        handleNotification(payload);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, handleNotification]);

  const sendNotification = useCallback(async (payload: Omit<NotificationPayload, 'id' | 'timestamp' | 'userId'>) => {
    if (!userId) return;

    const notification: NotificationPayload = {
      ...payload,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId
    };

    // Send via Supabase realtime
    await supabase.channel(`notifications:${userId}`)
      .send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });
  }, [userId]);

  return { sendNotification };
};

// Verification-specific notifications
export const useVerificationNotifications = (userId: string | undefined) => {
  const { sendNotification } = useRealTimeNotifications(userId);

  const notifyVerificationComplete = useCallback(async (verificationId: string, trustScore: number) => {
    await sendNotification({
      type: 'verification_complete',
      title: 'Verification Complete',
      message: `Analysis finished with ${trustScore}% trust score`,
      data: { verificationId, trustScore },
      priority: 'normal'
    });
  }, [sendNotification]);

  const notifyVerificationFailed = useCallback(async (verificationId: string, error: string) => {
    await sendNotification({
      type: 'verification_failed',
      title: 'Verification Failed',
      message: `Analysis failed: ${error}`,
      data: { verificationId, error },
      priority: 'high'
    });
  }, [sendNotification]);

  const notifyUsageWarning = useCallback(async (currentUsage: number, maxUsage: number) => {
    const percentage = Math.round((currentUsage / maxUsage) * 100);
    await sendNotification({
      type: 'usage_warning',
      title: 'Usage Warning',
      message: `You've used ${percentage}% of your monthly verification limit`,
      data: { currentUsage, maxUsage, percentage },
      priority: percentage >= 90 ? 'urgent' : 'normal'
    });
  }, [sendNotification]);

  return {
    notifyVerificationComplete,
    notifyVerificationFailed,
    notifyUsageWarning
  };
};

// System-wide notification utilities
export const systemNotifications = {
  maintenance: async (startTime: string, duration: string) => {
    await notificationManager.showNotification({
      title: 'Scheduled Maintenance',
      body: `System maintenance starting at ${startTime} for ${duration}`,
      requireInteraction: true,
      data: { type: 'maintenance', startTime, duration }
    });
  },

  update: async (version: string, features: string[]) => {
    await notificationManager.showNotification({
      title: 'New Features Available',
      body: `Version ${version} includes: ${features.join(', ')}`,
      data: { type: 'update', version, features }
    });
  },

  security: async (message: string) => {
    await notificationManager.showNotification({
      title: 'Security Alert',
      body: message,
      requireInteraction: true,
      data: { type: 'security', message }
    });
  }
};