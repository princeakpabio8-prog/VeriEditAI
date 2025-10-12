import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Star, Plus, ArrowLeft, Briefcase, Trees } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLighthouseThreads } from '@/hooks/useLighthouseThreads';
import { LighthouseThreadList } from '@/components/lighthouse/LighthouseThreadList';
import { CreateThreadDialog } from '@/components/lighthouse/CreateThreadDialog';
import { TruthGarden } from '@/components/lighthouse/TruthGarden';
import { useAuth } from '@/contexts/AuthContext';

export default function LighthouseRoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWorkspace, setIsWorkspace] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  
  const { threads, loading: threadsLoading, createThread } = useLighthouseThreads(roomId || '');

  const handleCreateThread = async (title: string, content: string, autoVerify: boolean) => {
    const thread = await createThread(title, content, autoVerify);
    if (thread?.id) {
      setPendingThreadId(thread.id);
    }
    return thread;
  };

  const handleNavigateToThread = () => {
    if (pendingThreadId && roomId) {
      navigate(`/lighthouse/${roomId}/thread/${pendingThreadId}`);
      setPendingThreadId(null);
      setCreateDialogOpen(false);
    }
  };

  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lighthouse_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (error) throw error;
        setRoom(data);
        setIsWorkspace(data?.room_type === 'workspace' && data?.creator_id === user?.id);
      } catch (error) {
        console.error('Error fetching room:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Room not found</h1>
            <Button asChild>
              <Link to="/lighthouse">Back to Lighthouse</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      climate: 'bg-emerald-500/10 text-emerald-500',
      politics: 'bg-blue-500/10 text-blue-500',
      health: 'bg-pink-500/10 text-pink-500',
      technology: 'bg-purple-500/10 text-purple-500',
      general: 'bg-slate-500/10 text-slate-500'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/lighthouse" className="hover:text-foreground">
                Lighthouse Hub
              </Link>
              <span>›</span>
              <span className="text-foreground">{room.name}</span>
            </div>
            
            <Button variant="outline" size="sm" asChild>
              <Link to="/lighthouse?browse=true" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Hub
              </Link>
            </Button>
          </div>

          {/* Room header */}
          <div className="space-y-4">
            {isWorkspace && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(var(--lighthouse-ocean))]/30 border border-[hsl(var(--lighthouse-beam))]/30">
                <Briefcase className="h-5 w-5 text-[hsl(var(--lighthouse-beam))]" />
                <span className="text-sm font-medium text-[hsl(var(--lighthouse-beam))]">
                  Personal Workspace
                </span>
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCategoryColor(room.category)} variant="secondary">
                    {room.category}
                  </Badge>
                  {isWorkspace && (
                    <Badge variant="outline" className="border-[hsl(var(--lighthouse-beam))]">
                      Workspace
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-3">{room.name}</h1>
                {room.description && (
                  <p className="text-lg text-muted-foreground">{room.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{room.member_count} members</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{room.thread_count} threads</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{room.trust_rating}% trust</span>
              </div>
            </div>

            {user ? (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Plant a Seed
              </Button>
            ) : (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/auth">
                  <Plus className="h-4 w-4" />
                  Sign in to plant seeds
                </Link>
              </Button>
            )}
          </div>

          {/* Tabs: Discussions & Garden */}
          <Tabs defaultValue="discussions" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="discussions" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussions
              </TabsTrigger>
              <TabsTrigger value="garden" className="gap-2">
                <Trees className="h-4 w-4" />
                The Garden
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="discussions" className="space-y-4">
              <h2 className="text-2xl font-semibold">Discussions</h2>
              <LighthouseThreadList threads={threads} loading={threadsLoading} />
            </TabsContent>
            
            <TabsContent value="garden" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">The Garden</h2>
                  <Badge variant="outline" className="gap-1">
                    <Trees className="h-3 w-3" />
                    3D Visualization
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm italic">
                  Watch your forest of truth flourish as verification strengthens each seed.
                </p>
              </div>
              <TruthGarden roomId={roomId || ''} threads={threads as any} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />

      <CreateThreadDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setPendingThreadId(null);
          }
        }}
        onCreateThread={handleCreateThread}
        onThreadCreated={(threadId) => {
          if (roomId) {
            navigate(`/lighthouse/${roomId}/thread/${threadId}`);
          }
        }}
      />
    </div>
  );
}
