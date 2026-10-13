import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Users, TrendingUp, Shield, Plus } from 'lucide-react';
import { CreateRoomDialog } from '@/components/lighthouse/CreateRoomDialog';
import { RoomCard } from '@/components/lighthouse/RoomCard';
import { useAuth } from '@/contexts/AuthContext';

const ROOM_CATEGORIES = [
  { value: 'all', label: 'All Rooms', icon: Radio },
  { value: 'politics', label: 'Politics', icon: Shield },
  { value: 'health', label: 'Health', icon: TrendingUp },
  { value: 'climate', label: 'Climate', icon: TrendingUp },
  { value: 'technology', label: 'Technology', icon: TrendingUp },
  { value: 'media', label: 'Media', icon: Users },
];

export default function LighthouseRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--lighthouse-ocean))]/50 border border-[hsl(var(--lighthouse-beam))]/30">
              <Radio className="w-4 h-4 text-[hsl(var(--lighthouse-beam))]" />
              <span className="text-sm text-[hsl(var(--lighthouse-beam))]">Collaborative Verification Hub</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium text-foreground">
              The Lighthouse Room
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Where truth-seekers gather to verify claims, discuss misinformation, and build trust together. Signal over noise.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => user ? setShowCreateDialog(true) : navigate('/auth')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/lighthouse/signals')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Signal Feed
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">127</div>
                <div className="text-sm text-muted-foreground mt-1">Active Rooms</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">2.4K</div>
                <div className="text-sm text-muted-foreground mt-1">Truth Seekers</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[hsl(var(--lighthouse-beam))]">8.9K</div>
                <div className="text-sm text-muted-foreground mt-1">Verified Claims</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Room Browser */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="max-w-full overflow-x-auto">
              {ROOM_CATEGORIES.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="data-[state=active]:bg-[hsl(var(--lighthouse-beam))]/20"
                >
                  <cat.icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RoomCard
                  id="sample-1"
                  name="Climate Data Verification"
                  description="Collaborative fact-checking of climate change claims and data"
                  category="climate"
                  memberCount={234}
                  threadCount={45}
                  trustRating={0.92}
                />
                <RoomCard
                  id="sample-2"
                  name="Election 2024 Watch"
                  description="Real-time verification of election-related claims"
                  category="politics"
                  memberCount={567}
                  threadCount={128}
                  trustRating={0.88}
                />
                <RoomCard
                  id="sample-3"
                  name="Medical Misinformation"
                  description="Debunking false health claims with peer review"
                  category="health"
                  memberCount={412}
                  threadCount={89}
                  trustRating={0.95}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
      <CreateRoomDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
