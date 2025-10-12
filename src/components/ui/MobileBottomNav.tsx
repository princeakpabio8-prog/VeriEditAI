import { Home, Radio, Newspaper } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = item.activeCheck(location.pathname);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all",
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
      </div>
    </nav>
  );
};
