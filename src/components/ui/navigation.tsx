import { Button } from "@/components/ui/button";
import { Shield, Menu, X, LogOut, User, Settings, BarChart3, Lock, UserCog, Puzzle, Gift, Newspaper, Radio, Code, Package, Award, Flame, MoreHorizontal, ChevronDown, Target, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserFeedback } from '@/components/user-feedback';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { LicenseStatusWidget } from '@/components/ui/LicenseStatusWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const { signOut, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Derive auth state from hook
  const isAuthenticated = !!authUser;

  // Show CTA button after scrolling past hero section
  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 600px (roughly past hero)
      setShowCTA(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/30 supports-[backdrop-filter]:bg-background/60"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/dashboard?tab=discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Discover
                </Link>
                <Link to="/viral-claims" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hot Claims
                </Link>
                <Link to="/bounties" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Bounties
                </Link>
                <Link to="/lighthouse" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Radio className="h-4 w-4" />
                  Lighthouse
                </Link>
                
                <LicenseStatusWidget />
                
                {/* More Dropdown */}
                <DropdownMenu open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      More <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard?tab=badges" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        <Award className="h-4 w-4 mr-2" />
                        Badges
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/achievements" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        <Award className="h-4 w-4 mr-2" />
                        Achievements
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        About
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/find-users" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Find Users
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/extensions" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        <Puzzle className="h-4 w-4 mr-2" />
                        Extensions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/referrals" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        <Gift className="h-4 w-4 mr-2" />
                        Referrals
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard?tab=bulk" className="flex items-center cursor-pointer" onClick={() => setIsMoreOpen(false)}>
                        <Package className="h-4 w-4 mr-2" />
                        Bulk Verification
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <a 
                  href={location.pathname === '/' ? '#features' : '/#features'} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Features
                </a>
                <a 
                  href={location.pathname === '/' ? '#pricing' : '/#pricing'} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Pricing
                </a>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link to="/lighthouse" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Radio className="h-4 w-4" />
                  Lighthouse
                </Link>
                <Link to="/auth?next=/dashboard?tab=badges" className="text-muted-foreground hover:text-foreground transition-colors">
                  Badges
                </Link>
                <Link to="/auth?next=/dashboard?tab=discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Discover
                </Link>
                <Link to="/extensions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Extensions
                </Link>
              </>
            )}
            
            {/* Sticky CTA - appears after scrolling past hero, only on homepage for non-auth users */}
            <AnimatePresence>
              {showCTA && !isAuthenticated && location.pathname === '/' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to="/verify">
                    <Button size="sm" className="group">
                      <Zap className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                      Try Now
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            
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
                      to="/api/docs"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      API Docs
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile & Settings
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
                  to="/viral-claims"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.pathname === '/viral-claims' ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Flame className="h-4 w-4" />
                  Hot Claims
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
                  to="/about"
                  className={`block px-4 py-3 transition-colors ${
                    location.pathname === '/about' ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
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
                  to="/dashboard?tab=bulk"
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    location.search.includes('tab=bulk') ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  Bulk Verification
                </Link>
              </>
            ) : (
              <>
                <a
                  href={location.pathname === '/' ? '#features' : '/#features'}
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  Features
                </a>
                <a
                  href={location.pathname === '/' ? '#pricing' : '/#pricing'}
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  Pricing
                </a>
                <a
                  href={location.pathname === '/' ? '#about' : '/#about'}
                  className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  About
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
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
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