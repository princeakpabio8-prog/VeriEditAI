import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineState?: boolean;
}

export function OfflineIndicator({ className, showOnlineState = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justWentOnline, setJustWentOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustWentOnline(true);
      setTimeout(() => setJustWentOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustWentOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not configured to show online state
  if (isOnline && !showOnlineState && !justWentOnline) {
    return null;
  }

  return (
    <Badge
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 shadow-lg transition-all duration-300",
        isOnline
          ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white animate-fade-in"
          : "bg-gradient-to-r from-red-500 to-orange-500 text-white",
        justWentOnline && "animate-bounce",
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          {justWentOnline ? 'Back Online!' : 'Online'}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Offline Mode
        </>
      )}
    </Badge>
  );
}
