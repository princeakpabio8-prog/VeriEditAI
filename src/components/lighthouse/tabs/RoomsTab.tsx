import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Shield, TrendingUp, Users, Plus } from 'lucide-react';
import { CreateRoomDialog } from '@/components/lighthouse/CreateRoomDialog';
import { RoomCard } from '@/components/lighthouse/RoomCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLighthouseRooms } from '@/hooks/useLighthouseRooms';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { rooms, loading } = useLighthouseRooms(selectedCategory);

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
          className="bg-[hsl(var(--lighthouse-beam))] hover:bg-[hsl(var(--lighthouse-signal))]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Room
        </Button>
      </div>

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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--lighthouse-beam))]"></div>
            </div>
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
