import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrustScoreDisplay } from '@/components/trust-score-display';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Eye, Calendar, Shield, MessageSquare, ThumbsUp, User } from 'lucide-react';
import { DynamicMeta } from '@/components/DynamicMeta';

interface ThreadData {
  thread: {
    id: string;
    title: string;
    content: string;
    trust_score: number;
    view_count: number;
    comment_count: number;
    upvote_count: number;
    created_at: string;
    image_urls: string[];
    author: {
      full_name: string;
      username: string;
      avatar_url: string;
    };
  };
  share: {
    view_count: number;
    share_count: number;
    created_at: string;
    og_title: string;
    og_description: string;
    og_image_url: string;
  };
}

export default function ShareThread() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      fetchThread();
    }
  }, [shareToken]);

  const fetchThread = async () => {
    try {
      setLoading(true);

      // Fetch public thread data
      const { data: publicThread, error: publicError } = await supabase
        .from('public_threads')
        .select(`
          *,
          thread:room_threads!inner (
            id,
            title,
            content,
            trust_score,
            view_count,
            comment_count,
            upvote_count,
            created_at,
            image_urls,
            author:profiles!room_threads_author_id_fkey (
              full_name,
              username,
              avatar_url
            )
          )
        `)
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (publicError) throw publicError;
      if (!publicThread) throw new Error('Thread not found');

      // Increment view count
      await supabase
        .from('public_threads')
        .update({ view_count: publicThread.view_count + 1 })
        .eq('share_token', shareToken);

      const threadData = publicThread.thread as any;
      
      setData({
        thread: {
          id: threadData.id,
          title: threadData.title,
          content: threadData.content,
          trust_score: threadData.trust_score,
          view_count: threadData.view_count,
          comment_count: threadData.comment_count,
          upvote_count: threadData.upvote_count,
          created_at: threadData.created_at,
          image_urls: threadData.image_urls || [],
          author: {
            full_name: threadData.author?.full_name || 'Anonymous',
            username: threadData.author?.username || '',
            avatar_url: threadData.author?.avatar_url || '',
          },
        },
        share: {
          view_count: publicThread.view_count + 1,
          share_count: publicThread.share_count,
          created_at: publicThread.created_at,
          og_title: publicThread.og_title,
          og_description: publicThread.og_description,
          og_image_url: publicThread.og_image_url,
        },
      });
    } catch (err: any) {
      console.error('Error fetching thread:', err);
      setError(err.message || 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading thread...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Thread Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'This thread link is invalid or has been removed.'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { thread, share } = data;
  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DynamicMeta
        title={share.og_title || thread.title}
        description={share.og_description}
        image={share.og_image_url}
        url={currentUrl}
        type="article"
        trustScore={thread.trust_score}
        author={thread.author.full_name}
        publishedTime={thread.created_at}
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">VeriedIT AI</span>
            </div>
            <Button onClick={() => navigate('/auth')} variant="default">
              Join the Community
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Badge */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-sm py-2 px-4">
            <Shield className="h-4 w-4 mr-2" />
            Lighthouse Truth Thread
          </Badge>
          {thread.trust_score && (
            <Badge variant="outline" className="text-sm py-2 px-4">
              Trust Score: {Math.round(thread.trust_score)}%
            </Badge>
          )}
        </div>

        {/* Thread Content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{thread.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{thread.author.full_name}</span>
                  {thread.author.username && <span>@{thread.author.username}</span>}
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  {new Date(thread.created_at).toLocaleDateString()}
                </div>
              </div>
              {thread.trust_score && (
                <div className="flex-shrink-0">
                  <TrustScoreDisplay score={thread.trust_score} size="sm" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>

            {/* Images */}
            {thread.image_urls && thread.image_urls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {thread.image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Thread image ${index + 1}`}
                    className="rounded-lg w-full h-auto object-cover"
                  />
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 pt-4 border-t flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {share.view_count} views
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {thread.upvote_count} upvotes
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {thread.comment_count} comments
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Join the Truth Movement</h2>
              <p className="text-muted-foreground">
                Share your own verified threads and collaborate with truth-seekers worldwide
              </p>
              <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:underline"
            >
              VeriedIT AI
            </button>{' '}
            - Trust Infrastructure for the AI Era
          </p>
        </div>
      </main>
    </div>
  );
}
