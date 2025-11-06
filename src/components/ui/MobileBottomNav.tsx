import { Home, Radio, Newspaper, User, Award, Wallet } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import { Badge } from "./badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./button";

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isMobile = useIsMobile();
  const isAuthenticated = !!user;
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  if (import.meta.env.DEV) {
    console.debug('[MobileBottomNav] Mounted, isMobile:', isMobile, 'Location:', location.pathname);
  }

  if (!isMobile) return null;

  const handleDiscoverClick = (e: React.MouseEvent) => {
    if (import.meta.env.DEV) {
      console.debug('[MobileBottomNav] Discover clicked, authenticated:', isAuthenticated);
    }
    
    if (!isAuthenticated) {
      e.preventDefault();
      
      // Show brief toast before redirecting
      const toast = document.createElement('div');
      toast.textContent = 'Sign in to view Discover';
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      
      navigate('/auth?next=/dashboard?tab=discover');
    }
  };

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      try {
        // Try injected first (mobile wallet apps), fallback to walletConnect
        const injectedConnector = connectors.find((c) => c.id === 'injected');
        const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');
        const connector = injectedConnector || walletConnectConnector;
        
        if (connector) {
          await connectAsync({ connector });
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const navItems = [
    {
      label: "Home",
      icon: Home,
      path: "/",
      activeCheck: (path: string) => path === "/",
    },
    {
      label: "Badges",
      icon: Award,
      path: isAuthenticated ? "/dashboard?tab=badges" : "/auth?feature=nft",
      activeCheck: (path: string) => path === "/dashboard" && location.search.includes("tab=badges"),
    },
    {
      label: "Lighthouse",
      icon: Radio,
      path: "/lighthouse",
      activeCheck: (path: string) => path.startsWith("/lighthouse"),
    },
    {
      label: "Discover",
      icon: Newspaper,
      path: isAuthenticated ? "/dashboard?tab=discover" : "/auth?next=/dashboard?tab=discover",
      activeCheck: (path: string) => path === "/dashboard" && location.search.includes("tab=discover"),
      onClick: handleDiscoverClick,
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[70] bg-card/95 backdrop-blur-lg border-t border-border"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="grid items-center h-16 px-2 py-1" style={{ gridTemplateColumns: `repeat(${isAuthenticated ? 6 : 5}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const isActive = item.activeCheck(location.pathname);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-lg transition-all",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Wallet Connect */}
        <button
          onClick={handleWalletClick}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-lg transition-all",
            isConnected
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Wallet className={cn("h-5 w-5 mb-1", isConnected && "scale-110")} />
          <span className="text-xs font-medium">
            {isConnected ? `${address?.slice(0, 4)}...` : "Wallet"}
          </span>
        </button>

        {/* Notifications */}
        {isAuthenticated && (
          <div className="flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-lg relative">
            <NotificationBell />
            <span className="text-xs font-medium text-muted-foreground mt-1">Alerts</span>
          </div>
        )}
        
        {/* Profile */}
        <Link
          to={isAuthenticated ? "/profile" : "/auth"}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-lg transition-all relative",
            location.pathname === "/profile"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <div className="relative">
            <User className={cn("h-5 w-5", location.pathname === "/profile" && "scale-110")} />
            {isAuthenticated && unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium mt-1">{isAuthenticated ? "Profile" : "Sign In"}</span>
        </Link>
      </div>
    </nav>
  );
};
