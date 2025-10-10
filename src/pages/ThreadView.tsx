import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LighthouseBeamIndicator } from '@/components/lighthouse/LighthouseBeamIndicator';
import { ArrowLeft, MessageSquare, ThumbsUp, Shield, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ThreadComments } from '@/components/lighthouse/ThreadComments';

export default function ThreadView() {
  const { roomId, threadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [thread, setThread] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch thread with author info
        const { data: threadData, error: threadError } = await supabase
          .from('room_threads')
          .select(`
            *,
            profiles!room_threads_author_id_fkey(full_name)
          `)
          .eq('id', threadId)
          .single();

        if (threadError) throw threadError;
        setThread(threadData);
        setUpvoteCount(threadData.upvote_count || 0);

        // Fetch room info
        const { data: roomData, error: roomError } = await supabase
          .from('lighthouse_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

        // Fetch user's vote
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: voteData } = await supabase
            .from('thread_votes')
            .select('vote_type')
            .eq('thread_id', threadId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (voteData) {
            setUserVote(voteData.vote_type as 'up' | 'down');
          }
        }

        // Fetch verification if exists
        if (threadData.verification_id) {
          const { data: verificationData } = await supabase
            .from('verifications')
            .select('*, sources(*)')
            .eq('id', threadData.verification_id)
            .single();

          setVerification(verificationData);
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && threadId) {
      fetchData();
    }

    // Priority 1: Subscribe to real-time upvote updates
    const votesChannel = supabase
      .channel(`thread_votes:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thread_votes',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          // Refetch upvote count when votes change
          supabase
            .from('room_threads')
            .select('upvote_count')
            .eq('id', threadId)
            .single()
            .then(({ data }) => {
              if (data) {
                setUpvoteCount(data.upvote_count || 0);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
    };
  }, [roomId, threadId]);

  const handleUpvote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upvote threads",
        variant: "destructive",
      });
      return;
    }

    try {
      if (userVote === 'up') {
        // Remove upvote
        await supabase
          .from('thread_votes')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', user.id);
        
        setUserVote(null);
        setUpvoteCount(prev => prev - 1);
      } else {
        // Add or update to upvote
        await supabase
          .from('thread_votes')
          .upsert({
            thread_id: threadId,
            user_id: user.id,
            vote_type: 'up'
          });
        
        setUserVote('up');
        setUpvoteCount(prev => prev + (userVote === 'down' ? 2 : 1));
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!thread || !room) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Thread not found</h1>
            <Button onClick={() => navigate('/lighthouse')}>
              Back to Lighthouse
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/lighthouse" className="hover:text-foreground">
              Lighthouse Room
            </Link>
            <span>›</span>
            <Link to={`/lighthouse/${roomId}`} className="hover:text-foreground">
              {room.name}
            </Link>
            <span>›</span>
            <span className="text-foreground">{thread.title}</span>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(`/lighthouse/${roomId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Room
          </Button>

          {/* Thread header */}
          <Card className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">{thread.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>by {thread.profiles?.full_name || 'Anonymous'}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {thread.is_auto_verified && thread.trust_score !== null && (
                <div className="flex items-center gap-3">
                  <LighthouseBeamIndicator trustScore={thread.trust_score} />
                  <Badge variant="secondary" className="gap-1 text-lg px-4 py-2">
                    <Shield className="h-4 w-4" />
                    {thread.trust_score}% Trust
                  </Badge>
                </div>
              )}
            </div>

            {/* Thread content */}
            <div className="prose prose-lg max-w-none mb-8">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>

            {/* Interactive upvotes */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button 
                variant={userVote === 'up' ? 'default' : 'outline'} 
                onClick={handleUpvote}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                {upvoteCount}
              </Button>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('comments-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {thread.comment_count} Comments
              </Button>
            </div>
          </Card>

          {/* Public viewing notice for anonymous users */}
          {!userVote && (
            <Card className="p-4 bg-[hsl(var(--lighthouse-ocean))]/20 border-[hsl(var(--lighthouse-beam))]/30">
              <p className="text-sm text-muted-foreground text-center">
                <Link to="/auth" className="text-[hsl(var(--lighthouse-beam))] hover:underline font-medium">
                  Sign in
                </Link>
                {' '}to upvote, comment, and join the discussion
              </p>
            </Card>
          )}

          {/* Verification results */}
          {verification && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Results
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trust Score</span>
                  <Badge variant="secondary" className="text-lg">
                    {verification.trust_score}%
                  </Badge>
                </div>

                {verification.sources && verification.sources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Sources ({verification.sources.length})</h3>
                    <div className="space-y-2">
                      {verification.sources.slice(0, 3).map((source: any) => (
                        <div key={source.id} className="flex items-start gap-2 text-sm">
                          <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {source.title || source.domain}
                            </a>
                            {source.reliability_score && (
                              <span className="ml-2 text-muted-foreground">
                                ({source.reliability_score}% reliable)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => navigate(`/verification-dashboard?id=${verification.id}`)}
                  className="w-full"
                >
                  View Full Verification Report
                </Button>
              </div>
            </Card>
          )}

          {/* Comments section */}
          <div id="comments-section">
            <ThreadComments threadId={threadId!} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
