import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, TrendingUp, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RoomCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  threadCount: number;
  trustRating: number;
}

export function RoomCard({
  id,
  name,
  description,
  category,
  memberCount,
  threadCount,
  trustRating,
}: RoomCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMember, setIsMember] = useState(false);
  const [currentMemberCount, setCurrentMemberCount] = useState(memberCount);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    checkMembership();
  }, [id]);

  const checkMembership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('room_memberships')
      .select('id')
      .eq('room_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    setIsMember(!!data);
  };

  const handleJoinRoom = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join rooms",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (isMember) return;

    setJoining(true);
    try {
      const { error } = await supabase
        .from('room_memberships')
        .insert({
          room_id: id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      setIsMember(true);
      setCurrentMemberCount(prev => prev + 1);
      toast({
        title: "Joined room!",
        description: `You are now a member of ${name}`,
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const getTrustColor = (rating: number) => {
    if (rating >= 0.9) return 'text-green-400';
    if (rating >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <Card 
      className="group cursor-pointer bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:border-[hsl(var(--lighthouse-beam))]/50 transition-all hover:scale-105"
      onClick={() => navigate(`/lighthouse/${id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-[hsl(var(--lighthouse-beam))] transition-colors">
              {name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
            <Button
              size="sm"
              variant={isMember ? "secondary" : "default"}
              onClick={handleJoinRoom}
              disabled={isMember || joining}
              className="gap-1"
            >
              {isMember ? (
                <>
                  <Check className="w-3 h-3" />
                  Joined
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  {joining ? 'Joining...' : 'Join'}
                </>
              )}
            </Button>
          </div>
        </div>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{currentMemberCount}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>{threadCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-4 h-4 ${getTrustColor(trustRating)}`} />
            <span className={`font-semibold ${getTrustColor(trustRating)}`}>
              {(trustRating * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
