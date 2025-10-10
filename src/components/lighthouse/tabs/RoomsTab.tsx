import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Shield, TrendingUp, Users, Plus } from 'lucide-react';
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

export function RoomsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

      <CreateRoomDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
