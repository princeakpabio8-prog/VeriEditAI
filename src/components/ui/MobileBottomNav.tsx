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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { useState } from "react";

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
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  
  if (import.meta.env.DEV) {
    console.debug('[MobileBottomNav] Mounted, isMobile:', isMobile, 'Location:', location.pathname);
  }

  if (!isMobile) return null;

  const handleWalletConnect = async () => {
    if (isConnected) {
      disconnect();
      setWalletSheetOpen(false);
      return;
    }

    try {
      // Try WalletConnect first (opens modal with all wallet options)
      const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect')
      if (walletConnectConnector) {
        await connectAsync({ connector: walletConnectConnector })
        setWalletSheetOpen(false)
        return
      }

      // Fallback to injected if WalletConnect not available
      const injectedConnector = connectors.find((c) => c.id === 'injected')
      if (injectedConnector) {
        await connectAsync({ connector: injectedConnector })
        setWalletSheetOpen(false)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setWalletSheetOpen(false)
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
      label: "Blog",
      icon: Newspaper,
      path: "/blog",
      activeCheck: (path: string) => path.startsWith("/blog"),
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-border"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="grid items-center h-16 px-2 py-1" style={{ gridTemplateColumns: `repeat(${isAuthenticated ? 7 : 6}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const isActive = item.activeCheck(location.pathname);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center flex-1 py-2 px-0 rounded-md transition-all",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Wallet Connect */}
        <Button variant="ghost"
          onClick={handleWalletConnect}
          className={cn(
            "flex min-w-0 h-full flex-col items-center justify-center flex-1 py-2 px-0 rounded-md transition-all",
            isConnected
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Wallet className={cn("h-5 w-5 mb-1", isConnected && "scale-110")} />
          <span className="text-[10px] font-medium">
            {isConnected ? `${address?.slice(0, 4)}...` : "Wallet"}
          </span>
        </Button>

        {/* Notifications */}
        {isAuthenticated && (
          <div className="flex min-w-0 h-full flex-col items-center justify-center flex-1 py-2 px-0 rounded-md relative">
            <NotificationBell />
            <span className="text-[10px] font-medium text-muted-foreground mt-1">Alerts</span>
          </div>
        )}
        
        {/* Profile */}
        <Link
          to={isAuthenticated ? "/profile" : "/auth"}
          className={cn(
            "flex min-w-0 h-full flex-col items-center justify-center flex-1 py-2 px-0 rounded-md transition-all relative",
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
          <span className="text-[10px] font-medium mt-1">{isAuthenticated ? "Profile" : "Sign In"}</span>
        </Link>
      </div>
    </nav>
  );
};
