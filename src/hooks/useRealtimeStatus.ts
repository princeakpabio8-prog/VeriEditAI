import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export function useRealtimeStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [lastConnected, setLastConnected] = useState<Date>(new Date());

  useEffect(() => {
    // Monitor connection status
    const channel = supabase
      .channel('connection-monitor')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          setLastConnected(new Date());
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        } else if (status === 'TIMED_OUT') {
          setStatus('reconnecting');
        }
      });

    // Monitor online/offline status
    const handleOnline = () => setStatus('connected');
    const handleOffline = () => setStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { status, isOnline: status === 'connected', lastConnected };
}
