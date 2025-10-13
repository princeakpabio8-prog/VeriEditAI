import { Home, Radio, Newspaper, User, Users, Info } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import { Badge } from "./badge";
import { useNotifications } from "@/hooks/useNotifications";

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isAuthenticated = !!user;

  const handleDiscoverClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/auth?next=/dashboard?tab=discover');
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
    {
      label: "About",
      icon: Info,
      path: "/about",
      activeCheck: (path: string) => path === "/about",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-safe">
      <div className="grid grid-cols-6 items-center h-16 px-2 py-1">
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
