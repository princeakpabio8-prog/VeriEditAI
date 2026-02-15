import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Newspaper, Handshake, Building2, TrendingUp, Briefcase, Users, Youtube } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoomsTab } from '@/components/lighthouse/tabs/RoomsTab';
import { FeedTab } from '@/components/lighthouse/tabs/FeedTab';
import { PartnershipsTab } from '@/components/lighthouse/tabs/PartnershipsTab';
import { OrganizationsTab } from '@/components/lighthouse/tabs/OrganizationsTab';
import { SignalsTab } from '@/components/lighthouse/tabs/SignalsTab';
import { YouTubeIntelligenceTab } from '@/components/lighthouse/tabs/YouTubeIntelligenceTab';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { FloatingWorkspaceButton } from '@/components/lighthouse/FloatingWorkspaceButton';
import { LiveActivityStream } from '@/components/lighthouse/LiveActivityStream';
import { DynamicMeta } from '@/components/DynamicMeta';

export default function LighthouseHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'rooms';

  // Removed auto-navigation to prevent content flash on mobile devices

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const { data: stats } = useQuery({
    queryKey: ['lighthouse-hub-stats'],
    queryFn: async () => {
      const [verifiedArticles, organizations, rooms, members] = await Promise.all([
        supabase.from('news_feed').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('lighthouse_rooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('room_memberships').select('user_id', { count: 'exact', head: true }),
      ]);

      return {
        verifiedArticles: verifiedArticles.count || 0,
        organizations: organizations.count || 0,
        activeRooms: rooms.count || 0,
        communityMembers: members.count || 0,
      };
    },
  });

  // Real-time stats subscription
  useEffect(() => {
    const channel = supabase
      .channel('hub-stats-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'news_feed' },
        () => {}
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lighthouse_rooms' },
        () => {}
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Remember last visited tab (desktop only to avoid mobile flicker)
  useEffect(() => {
    if (activeTab && window.innerWidth >= 768) {
      localStorage.setItem('lighthouse_last_tab', activeTab);
    }
  }, [activeTab]);

  // Restore last tab on mount (desktop only)
  useEffect(() => {
    if (window.innerWidth >= 768) {
      const lastTab = localStorage.getItem('lighthouse_last_tab');
      if (lastTab && !searchParams.has('tab')) {
        setSearchParams({ tab: lastTab });
      }
    }
  }, []);
  
  if (import.meta.env.DEV) {
    console.debug('[LighthouseHub] Mounted - Tab:', activeTab, 'User:', user?.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title="The Lighthouse Hub - Real-Time Truth Verification"
        description={`Join the live truth verification hub with ${stats?.activeRooms || 0} active rooms, ${stats?.verifiedArticles || 0} verified articles, and ${stats?.communityMembers || 0} community members verifying claims in real-time. Signal over noise.`}
        url="https://verieditai.com/lighthouse"
        type="website"
      />
      <Navigation />
      
      <main className="pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 md:pt-24 md:pb-12 px-4 overflow-hidden bg-gradient-to-b from-[hsl(var(--lighthouse-deep))]/20 to-background">
        {/* Enhanced Lighthouse beam animation with particles */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-b from-[hsl(var(--lighthouse-beam))] via-[hsl(var(--lighthouse-signal))] to-transparent animate-lighthouse-beam" />
          <div className="absolute top-0 left-1/3 w-px h-1/2 bg-gradient-to-b from-[hsl(var(--lighthouse-beam))]/30 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-0 right-1/3 w-px h-1/2 bg-gradient-to-b from-[hsl(var(--lighthouse-beam))]/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--lighthouse-ocean))]/50 border border-[hsl(var(--lighthouse-beam))]/30">
              <Radio className="w-4 h-4 text-[hsl(var(--lighthouse-beam))]" />
              <span className="text-sm text-[hsl(var(--lighthouse-beam))]">Truth Verification Hub</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-[hsl(var(--lighthouse-glow))] to-[hsl(var(--lighthouse-signal))] bg-clip-text text-transparent leading-tight">
              The Lighthouse Hub
            </h1>
            
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Your central hub for truth verification and collaboration. Signal over noise.
            </p>
          </div>

          {/* Interactive Stats Cards with Live Activity */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-8 md:mt-12">
            <Card
              className="relative z-0 min-h-[100px] bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 card-hover-lift transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: '0ms' }}
              onClick={() => handleTabChange('feed')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('feed')}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Newspaper className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.verifiedArticles || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Verified Articles</div>
              </CardContent>
            </Card>
            <Card 
              className="relative z-0 min-h-[100px] bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 card-hover-lift transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: '0ms' }}
              onClick={() => handleTabChange('organizations')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('organizations')}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Building2 className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.organizations || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Organizations</div>
              </CardContent>
            </Card>
            <Card 
              className="relative z-0 min-h-[100px] bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 card-hover-lift transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: '0ms' }}
              onClick={() => handleTabChange('rooms')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('rooms')}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Radio className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.activeRooms || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Active Rooms</div>
              </CardContent>
            </Card>
            <Card 
              className="relative z-0 min-h-[100px] bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 card-hover-lift transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: '0ms' }}
              onClick={() => {}}
              role="button"
              tabIndex={0}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.communityMembers || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Community Members</div>
              </CardContent>
            </Card>
            
            {/* Live Activity Stream */}
            <div className="col-span-2 md:col-span-5 lg:col-span-1 lg:row-span-2">
              <LiveActivityStream />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section with sticky navigation on mobile */}
      <section className="py-8 px-4 pb-4 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 md:pb-0 md:static">
              <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 scrollbar-hide flex-nowrap">
                <TabsTrigger 
                  value="rooms" 
                  className="gap-1.5 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10 shrink-0"
                >
                  <Radio className="h-4 w-4" />
                  Rooms
                </TabsTrigger>
                <TabsTrigger 
                  value="feed" 
                  className="gap-1.5 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10 shrink-0"
                >
                  <Newspaper className="h-4 w-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger 
                  value="partnerships" 
                  className="gap-1.5 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10 shrink-0"
                >
                  <Handshake className="h-4 w-4" />
                  Partners
                </TabsTrigger>
                <TabsTrigger 
                  value="organizations" 
                  className="gap-1.5 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10 shrink-0"
                >
                  <Building2 className="h-4 w-4" />
                  Orgs
                </TabsTrigger>
                <TabsTrigger 
                  value="signals" 
                  className="gap-1.5 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10 shrink-0"
                >
                  <TrendingUp className="h-4 w-4" />
                  Signals
                </TabsTrigger>
                <TabsTrigger 
                  value="youtube" 
                  className="gap-1.5 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10 shrink-0"
                >
                  <Youtube className="h-4 w-4" />
                  YouTube
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="rooms" className="mt-6 animate-fade-in">
              <RoomsTab />
            </TabsContent>

            <TabsContent value="feed" className="mt-6 animate-fade-in">
              <FeedTab />
            </TabsContent>

            <TabsContent value="partnerships" className="mt-6 animate-fade-in">
              <PartnershipsTab />
            </TabsContent>

            <TabsContent value="organizations" className="mt-6 animate-fade-in">
              <OrganizationsTab />
            </TabsContent>

            <TabsContent value="signals" className="mt-6 animate-fade-in">
              <SignalsTab />
            </TabsContent>

            <TabsContent value="youtube" className="mt-6 animate-fade-in">
              <YouTubeIntelligenceTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      </main>

      <FloatingWorkspaceButton />

      <Footer />
    </div>
  );
}
