import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Newspaper, Handshake, Building2, TrendingUp, Briefcase, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoomsTab } from '@/components/lighthouse/tabs/RoomsTab';
import { FeedTab } from '@/components/lighthouse/tabs/FeedTab';
import { PartnershipsTab } from '@/components/lighthouse/tabs/PartnershipsTab';
import { OrganizationsTab } from '@/components/lighthouse/tabs/OrganizationsTab';
import { SignalsTab } from '@/components/lighthouse/tabs/SignalsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { FloatingWorkspaceButton } from '@/components/lighthouse/FloatingWorkspaceButton';
import { LiveActivityStream } from '@/components/lighthouse/LiveActivityStream';

export default function LighthouseHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'rooms';

  // Auto-navigate to workspace for authenticated users (unless they're browsing or chose a tab)
  useEffect(() => {
    const isBrowsing = searchParams.get('browse') === 'true';
    if (user && workspaceId && !workspaceLoading && !searchParams.has('tab') && !isBrowsing) {
      navigate(`/lighthouse/${workspaceId}`);
    }
  }, [user, workspaceId, workspaceLoading, navigate, searchParams]);

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

  // Remember last visited tab
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('lighthouse_last_tab', activeTab);
    }
  }, [activeTab]);

  // Restore last tab on mount
  useEffect(() => {
    const lastTab = localStorage.getItem('lighthouse_last_tab');
    if (lastTab && !searchParams.has('tab')) {
      setSearchParams({ tab: lastTab });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-[hsl(var(--lighthouse-glow))] to-[hsl(var(--lighthouse-signal))] bg-clip-text text-transparent">
              The Lighthouse Hub
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your central hub for truth verification and collaboration. Signal over noise.
            </p>
          </div>

          {/* Interactive Stats Cards with Live Activity */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-8 md:mt-12">
            <Card
              className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => handleTabChange('feed')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('feed')}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Newspaper className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))] animate-fade-in">
                  {stats?.verifiedArticles || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Verified Articles</div>
              </CardContent>
            </Card>
            <Card 
              className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => handleTabChange('organizations')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('organizations')}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Building2 className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))] animate-fade-in">
                  {stats?.organizations || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Organizations</div>
              </CardContent>
            </Card>
            <Card 
              className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => handleTabChange('rooms')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('rooms')}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Radio className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))] animate-fade-in">
                  {stats?.activeRooms || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Active Rooms</div>
              </CardContent>
            </Card>
            <Card 
              className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:bg-[hsl(var(--lighthouse-ocean))]/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => {}}
              role="button"
              tabIndex={0}
            >
              <CardContent className="pt-4 md:pt-6 text-center">
                <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[hsl(var(--lighthouse-beam))] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-[hsl(var(--lighthouse-beam))] animate-fade-in">
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
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 md:pb-0 md:static">
              <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 scrollbar-hide">
                <TabsTrigger 
                  value="rooms" 
                  className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10"
                  title="Verification Rooms - Collaborative spaces for verifying claims"
                >
                  <Radio className="h-4 w-4" />
                  <span className="hidden sm:inline">Rooms</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="feed" 
                  className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10"
                  title="News Feed - Latest verified articles"
                >
                  <Newspaper className="h-4 w-4" />
                  <span className="hidden sm:inline">Feed</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="partnerships" 
                  className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10"
                  title="Partnerships - Explore partnership opportunities"
                >
                  <Handshake className="h-4 w-4" />
                  <span className="hidden sm:inline">Partnerships</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="organizations" 
                  className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10"
                  title="Organizations - Browse verified organizations"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Organizations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="signals" 
                  className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20 transition-all hover:bg-[hsl(var(--lighthouse-beam))]/10"
                  title="Signals - Trending verification signals"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Signals</span>
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
          </Tabs>
        </div>
      </section>

      <FloatingWorkspaceButton />

      <Footer />
    </div>
  );
}
