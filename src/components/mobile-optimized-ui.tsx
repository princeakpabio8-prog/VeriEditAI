import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePWA } from '@/hooks/use-pwa';
import { useOfflineSupport } from '@/hooks/use-offline-support';
import { 
  Smartphone, 
  Download, 
  Share, 
  WifiOff, 
  RefreshCw, 
  Settings, 
  Menu,
  X,
  Home,
  Search,
  BarChart3,
  User
} from 'lucide-react';

interface MobileOptimizedUIProps {
  children: React.ReactNode;
}

export const MobileOptimizedUI = ({ children }: MobileOptimizedUIProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { status: pwaStatus, installApp, shareApp, updateApp } = usePWA();
  const { status: offlineStatus, retryQueue } = useOfflineSupport();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">Trust Lighthouse</h1>
          <div className="flex items-center gap-2">
            {/* Offline indicator */}
            {!offlineStatus.isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            
            {/* Queue indicator */}
            {offlineStatus.queueLength > 0 && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                {offlineStatus.queueLength}
              </Badge>
            )}
            
            {/* Menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-16">
        {children}
      </main>

      {/* Mobile Menu Drawer */}
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>App Settings</DrawerTitle>
                <DrawerDescription>Manage your mobile app experience</DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            <Tabs defaultValue="app" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="app">App</TabsTrigger>
                <TabsTrigger value="offline">Offline</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="app" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">PWA Features</CardTitle>
                    <CardDescription>Progressive Web App capabilities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!pwaStatus.isInstalled && pwaStatus.isInstallable && (
                      <Button
                        onClick={installApp}
                        className="w-full gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Install App
                      </Button>
                    )}
                    
                    {pwaStatus.isInstalled && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Smartphone className="h-3 w-3 mr-1" />
                          App Installed
                        </Badge>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => shareApp()}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Share className="h-4 w-4" />
                      Share App
                    </Button>

                    <Button
                      onClick={updateApp}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Update App (Clear Cache)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="offline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Offline Status</CardTitle>
                    <CardDescription>Sync and offline capabilities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Status</span>
                      <Badge variant={offlineStatus.isOnline ? "secondary" : "destructive"}>
                        {offlineStatus.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Queue Length</span>
                      <Badge variant="outline">
                        {offlineStatus.queueLength} items
                      </Badge>
                    </div>
                    
                    {offlineStatus.lastSync && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Sync</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(offlineStatus.lastSync).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    {offlineStatus.queueLength > 0 && (
                      <Button
                        onClick={retryQueue}
                        variant="outline"
                        className="w-full gap-2"
                        disabled={!offlineStatus.isOnline}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry Sync
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mobile Settings</CardTitle>
                    <CardDescription>App preferences and configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Display Mode</span>
                      <Badge variant="outline">
                        {pwaStatus.isStandalone ? 'Standalone' : 'Browser'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Offline Support</span>
                      <Badge variant={offlineStatus.isSupported ? "secondary" : "destructive"}>
                        {offlineStatus.isSupported ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => window.location.href = '/settings'}
                    >
                      <Settings className="h-4 w-4" />
                      Advanced Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// Touch-optimized components for mobile
export const MobileCard = ({ children, ...props }: React.ComponentProps<typeof Card>) => (
  <Card {...props} className={`touch-manipulation ${props.className || ''}`}>
    {children}
  </Card>
);

export const MobileButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
  <Button
    {...props}
    className={`min-h-[44px] touch-manipulation ${props.className || ''}`}
  >
    {children}
  </Button>
);

// Swipe-to-refresh component
export const SwipeToRefresh = ({ onRefresh, children }: { onRefresh: () => void; children: React.ReactNode }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        isAtTop = true;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop) return;
      
      currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, 100));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 60) {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
      setPullDistance(0);
      isAtTop = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, pullDistance]);

  return (
    <div className="relative">
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 transition-all duration-150"
          style={{ height: `${pullDistance}px` }}
        >
          <div className="text-sm text-muted-foreground">
            {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        </div>
      )}
      
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center bg-primary/10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Refreshing...</span>
          </div>
        </div>
      )}
      
      <div style={{ paddingTop: pullDistance > 0 ? `${pullDistance}px` : '0' }}>
        {children}
      </div>
    </div>
  );
};