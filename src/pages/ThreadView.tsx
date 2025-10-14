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
import { ArrowLeft, MessageSquare, ThumbsUp, Shield, ExternalLink, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ThreadComments } from '@/components/lighthouse/ThreadComments';
import { DynamicMeta } from '@/components/DynamicMeta';
import { generateClaimReviewSchema, injectStructuredData, removeStructuredData } from '@/lib/structured-data';
import { trackPageView, createShareableURL } from '@/lib/public-analytics';
import { ImageGallery } from '@/components/lighthouse/ImageGallery';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

export default function ThreadView() {
  const { roomId, threadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [thread, setThread] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Track page view
        if (threadId) {
          trackPageView('thread', threadId);
        }

        // Fetch thread with author info
        const { data: threadData, error: threadError } = await supabase
          .from('room_threads')
          .select('*')
          .eq('id', threadId)
          .single();
        
        if (threadError) throw threadError;
        
        // Fetch author profile separately
        let authorName = null;
        if (threadData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', threadData.author_id)
            .single();
          authorName = profileData?.full_name;
          setAuthorAvatar(profileData?.avatar_url || null);
        }

        setThread({ ...threadData, author_name: authorName });
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
        
        // Inject structured data for SEO
        if (threadData && threadData.is_auto_verified && threadData.trust_score !== null) {
          const structuredData = generateClaimReviewSchema({
            claimText: threadData.title,
            trustScore: threadData.trust_score,
            author: authorName || undefined,
            datePublished: threadData.created_at,
            url: window.location.href,
          });
          injectStructuredData(structuredData, `thread-${threadId}-structured-data`);
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
      if (threadId) {
        removeStructuredData(`thread-${threadId}-structured-data`);
      }
    };
  }, [roomId, threadId]);

  const handleUpvote = async () => {
    if (!user && !authLoading) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upvote threads",
        variant: "destructive",
      });
      return;
    }
    
    if (authLoading) {
      return; // Don't do anything while auth is loading
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
        
        // Notify thread author about upvote (only on new upvotes, not when switching from downvote)
        if (!userVote && thread?.author_id && thread.author_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: thread.author_id,
            type: 'upvote',
            message: `Someone upvoted your thread "${thread.title}"`,
            action_url: window.location.pathname,
            related_id: threadId,
          });
        }
        
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

  const handleShare = async (platform: string) => {
    const shareUrl = createShareableURL(window.location.href, platform);
    const shareText = `✅ Verified by VeriEdit AI | Trust Score: ${thread?.trust_score || 'N/A'}/100\n\n${thread?.title}\n\n`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-24 md:pb-16 px-4">
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

  // Prepare meta description
  const metaDescription = thread?.content?.slice(0, 155) + (thread?.content?.length > 155 ? '...' : '');
  const metaTitle = thread?.title || 'Verified Thread';

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title={metaTitle}
        description={metaDescription}
        url={window.location.href}
        type="article"
        trustScore={thread?.trust_score || undefined}
        author={thread?.author_name || undefined}
        publishedTime={thread?.created_at}
      />
      <Navigation />
      <div className="pt-24 pb-24 md:pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
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
          <Card className={isMobile ? "p-4" : "p-8"}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold mb-4`}>{thread.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <UserAvatar
                    avatarUrl={authorAvatar}
                    fullName={thread.author_name}
                    size="sm"
                  />
                  <span>by {thread.author_name || 'Anonymous'}</span>
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
            <div className="prose prose-lg max-w-none mb-6">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>

            {/* Thread images */}
            {thread.image_urls && thread.image_urls.length > 0 && (
              <div className="mb-8">
                <ImageGallery images={thread.image_urls} altPrefix="Thread image" />
              </div>
            )}

            {/* Interactive upvotes */}
            <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} gap-3 pt-6 border-t`}>
              <Button 
                variant={userVote === 'up' ? 'default' : 'outline'} 
                onClick={handleUpvote}
                className="gap-2"
                size={isMobile ? "mobile" : "default"}
                disabled={authLoading}
              >
                <ThumbsUp className="h-4 w-4" />
                {authLoading ? 'Loading...' : upvoteCount}
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
                size={isMobile ? "mobile" : "default"}
              >
                <MessageSquare className="h-4 w-4" />
                {thread.comment_count} Comments
              </Button>
              
              {!isMobile && (
                <div className="relative group">
                  <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full px-4 py-2 text-left hover:bg-accent rounded-t-lg"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="w-full px-4 py-2 text-left hover:bg-accent"
                    >
                      Share on LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full px-4 py-2 text-left hover:bg-accent"
                    >
                      Share on Facebook
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full px-4 py-2 text-left hover:bg-accent rounded-b-lg"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Public viewing notice for anonymous users */}
            {!user && (
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
            <ThreadComments threadId={threadId!} roomId={roomId!} />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
