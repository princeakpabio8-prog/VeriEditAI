import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Shield, TrendingUp, Users, Plus, Lock } from 'lucide-react';
import { CreateRoomDialog } from '@/components/lighthouse/CreateRoomDialog';
import { RoomCard } from '@/components/lighthouse/RoomCard';
import { MobileLoadingSkeleton } from '@/components/MobileLoadingSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLighthouseRooms } from '@/hooks/useLighthouseRooms';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const ROOM_CATEGORIES = [
  { value: 'all', label: 'All Rooms', icon: Radio },
  { value: 'politics', label: 'Politics', icon: Shield },
  { value: 'health', label: 'Health', icon: TrendingUp },
  { value: 'climate', label: 'Climate', icon: TrendingUp },
  { value: 'technology', label: 'Technology', icon: TrendingUp },
  { value: 'media', label: 'Media', icon: Users },
];

export function RoomsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { rooms, loading } = useLighthouseRooms(selectedCategory, 'public');

  // Fetch user's own rooms (all types including workspace)
  const { data: myRooms = [], isLoading: myRoomsLoading } = useQuery({
    queryKey: ['my-lighthouse-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lighthouse_rooms')
        .select('*')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Verification Rooms</h2>
          <p className="text-muted-foreground">
            Join collaborative spaces for verifying claims and building trust
          </p>
        </div>
        <Button 
          onClick={() => user ? setShowCreateDialog(true) : navigate('/auth')}
          className="bg-[hsl(var(--lighthouse-beam))] hover:bg-[hsl(var(--lighthouse-signal))] min-h-[44px] min-w-[44px]"
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          {!isMobile && "Create Room"}
        </Button>
      </div>

      {/* My Rooms Section */}
      {user && myRooms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            My Rooms
            <Badge variant="secondary" className="text-xs">{myRooms.length}</Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => (
              <div key={room.id} className="relative">
                {room.room_type === 'workspace' && (
                  <Badge variant="outline" className="absolute top-2 right-2 z-10 text-xs gap-1 bg-background/80 backdrop-blur-sm">
                    <Lock className="w-3 h-3" />
                    Workspace
                  </Badge>
                )}
                <RoomCard
                  id={room.id}
                  name={room.name}
                  description={room.description || ''}
                  category={room.category}
                  memberCount={room.member_count}
                  threadCount={room.thread_count}
                  trustRating={room.trust_rating || 0}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Rooms */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="bg-[hsl(var(--lighthouse-ocean))]/50">
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

        <TabsContent value={selectedCategory} className="mt-6">
          {loading ? (
            <MobileLoadingSkeleton variant="card" count={isMobile ? 3 : 6} />
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCategory === 'all' 
                  ? 'Be the first to create a verification room!'
                  : `No ${selectedCategory} rooms yet. Create one to get started!`}
              </p>
              <Button 
                onClick={() => user ? setShowCreateDialog(true) : navigate('/auth')}
                className="bg-[hsl(var(--lighthouse-beam))] hover:bg-[hsl(var(--lighthouse-signal))]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Room
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  id={room.id}
                  name={room.name}
                  description={room.description || ''}
                  category={room.category}
                  memberCount={room.member_count}
                  threadCount={room.thread_count}
                  trustRating={room.trust_rating || 0}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateRoomDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
