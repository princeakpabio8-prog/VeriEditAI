import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Newspaper, Handshake, Building2, TrendingUp, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoomsTab } from '@/components/lighthouse/tabs/RoomsTab';
import { FeedTab } from '@/components/lighthouse/tabs/FeedTab';
import { PartnershipsTab } from '@/components/lighthouse/tabs/PartnershipsTab';
import { OrganizationsTab } from '@/components/lighthouse/tabs/OrganizationsTab';
import { SignalsTab } from '@/components/lighthouse/tabs/SignalsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden bg-gradient-to-b from-[hsl(var(--lighthouse-deep))] to-background">
        {/* Lighthouse beam animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-[hsl(var(--lighthouse-beam))] to-transparent animate-pulse" />
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
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your central hub for truth verification and collaboration. Signal over noise.
            </p>

            {user && workspaceId && !workspaceLoading && (
              <Button
                onClick={() => navigate(`/lighthouse/${workspaceId}`)}
                size="lg"
                className="bg-[hsl(var(--lighthouse-beam))] hover:bg-[hsl(var(--lighthouse-signal))] mt-4"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Go to My Workspace
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <Card className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.verifiedArticles || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Verified Articles</div>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.organizations || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Organizations</div>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.activeRooms || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Active Rooms</div>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">
                  {stats?.communityMembers || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Community Members</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start overflow-x-auto bg-muted/50">
              <TabsTrigger 
                value="rooms" 
                className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20"
              >
                <Radio className="h-4 w-4" />
                Rooms
              </TabsTrigger>
              <TabsTrigger 
                value="feed" 
                className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20"
              >
                <Newspaper className="h-4 w-4" />
                Feed
              </TabsTrigger>
              <TabsTrigger 
                value="partnerships" 
                className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20"
              >
                <Handshake className="h-4 w-4" />
                Partnerships
              </TabsTrigger>
              <TabsTrigger 
                value="organizations" 
                className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20"
              >
                <Building2 className="h-4 w-4" />
                Organizations
              </TabsTrigger>
              <TabsTrigger 
                value="signals" 
                className="gap-2 data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20"
              >
                <TrendingUp className="h-4 w-4" />
                Signals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rooms" className="mt-6">
              <RoomsTab />
            </TabsContent>

            <TabsContent value="feed" className="mt-6">
              <FeedTab />
            </TabsContent>

            <TabsContent value="partnerships" className="mt-6">
              <PartnershipsTab />
            </TabsContent>

            <TabsContent value="organizations" className="mt-6">
              <OrganizationsTab />
            </TabsContent>

            <TabsContent value="signals" className="mt-6">
              <SignalsTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
