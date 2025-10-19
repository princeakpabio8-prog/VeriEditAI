import { Button } from "@/components/ui/button";
import { Shield, Menu, X, LogOut, User, Settings, BarChart3, Lock, UserCog, Puzzle, Gift, Newspaper, Radio, Code, Package, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserFeedback } from '@/components/user-feedback';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { signOut, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Derive auth state from hook
  const isAuthenticated = !!authUser;

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!authUser?.id) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    };
    
    checkAdminStatus();
  }, [authUser?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-trust bg-clip-text text-transparent">
              VeriEdit AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/dashboard?tab=discover" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Newspaper className="h-4 w-4" />
                  Discover
                </Link>
                <Link to="/lighthouse" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Radio className="h-4 w-4" />
                  Lighthouse
                </Link>
                <Link to="/dashboard?tab=badges" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Badges
                </Link>
                <Link to="/referrals" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  Referrals
                </Link>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <Link to="/lighthouse" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Radio className="h-4 w-4" />
                  Lighthouse
                </Link>
                <Link to="/auth?next=/dashboard?tab=badges" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Badges
                </Link>
                <Link to="/auth?next=/dashboard?tab=discover" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Newspaper className="h-4 w-4" />
                  Discover
                </Link>
                <Link to="/extensions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Extensions
                </Link>
              </>
            )}
            
            {/* Feedback and notifications for authenticated users */}
            {isAuthenticated && (
              <>
                <NotificationBell />
                <UserFeedback />
              </>
            )}
            
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{authUser?.email?.split('@')[0] || "Profile"}</span>
                </Button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/billing"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Billing & Plans
                    </Link>
                    <Link
                      to="/license"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      License Management
                    </Link>
                    <Link
                      to="/api"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      API Hub
                    </Link>
                    <Link
                      to="/dashboard?tab=bulk"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Bulk Verification
                    </Link>
                    <Link
                      to="/find-users"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Find Users
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile & Settings
                    </Link>
                    <Link
                      to="/extensions"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Puzzle className="h-4 w-4 mr-2" />
                      Extensions
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-4 pb-3 border-b border-border">
                <NotificationBell />
                <UserFeedback />
              </div>
            )}
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`block px-4 py-3 transition-colors ${
                    location.pathname === '/dashboard' ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard?tab=discover"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.pathname === '/dashboard' && location.search.includes('tab=discover') ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Newspaper className="h-4 w-4" />
                  Discover News
                </Link>
                <Link
                  to="/lighthouse"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.pathname.startsWith('/lighthouse') ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Radio className="h-4 w-4" />
                  Lighthouse
                </Link>
                <Link
                  to="/dashboard?tab=badges"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.search.includes('tab=badges') ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Award className="h-4 w-4" />
                  My Badges
                </Link>
                <Link
                  to="/referrals"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.pathname === '/referrals' ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Gift className="h-4 w-4" />
                  Referrals
                </Link>
                <Link
                  to="/dashboard?tab=bulk"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.search.includes('tab=bulk') ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  Bulk Verification
                </Link>
                <Link
                  to="/billing"
                  className={`block px-4 py-3 transition-colors ${
                    location.pathname === '/billing' ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Billing
                </Link>
                <Link
                  to="/about"
                  className={`block px-4 py-3 transition-colors ${
                    location.pathname === '/about' ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <Link
                  to="/lighthouse"
                  className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Radio className="h-4 w-4" />
                  Lighthouse
                </Link>
                <Link
                  to="/auth?next=/dashboard?tab=discover"
                  className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Newspaper className="h-4 w-4" />
                  Discover
                </Link>
                <Link
                  to="/extensions"
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Extensions
                </Link>
                <Link
                  to="/about"
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </>
            )}
            
            {isAuthenticated ? (
              <div className="border-t border-border pt-4 mt-4">
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  {authUser?.email}
                </div>
                <Link
                  to="/extensions"
                  className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Puzzle className="h-4 w-4 mr-2" />
                  Extensions
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.nav>
  );
};