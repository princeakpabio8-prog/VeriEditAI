import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DynamicMeta } from '@/components/DynamicMeta';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  ArrowLeft,
  Share2,
  ExternalLink,
  Clock,
  User,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  entity_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  view_count: number;
  share_count: number;
  click_count: number;
}

export default function ActivityDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (activityId) {
      fetchActivity();
      incrementViewCount();
    }
  }, [activityId]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_stream')
        .select('*')
        .eq('id', activityId)
        .eq('is_public', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: 'Activity not found',
          description: 'This activity may have been removed or is no longer public.',
          variant: 'destructive',
        });
        navigate('/activity-feed');
        return;
      }
      
      setActivity(data as ActivityItem);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast({
        title: 'Error loading activity',
        description: 'Failed to load activity details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      if (!activityId) return;
      // Fetch current count and increment
      const { data } = await supabase
        .from('activity_stream')
        .select('view_count')
        .eq('id', activityId)
        .single();
      
      if (data) {
        await supabase
          .from('activity_stream')
          .update({ view_count: data.view_count + 1 })
          .eq('id', activityId);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'facebook' | 'copy') => {
    if (!activity) return;
    
    const activityUrl = window.location.href;
    const text = getActivityText(activity);
    
    // Track share
    await supabase
      .from('activity_stream')
      .update({ share_count: activity.share_count + 1 })
      .eq('id', activity.id);

    if (platform === 'copy') {
      await navigator.clipboard.writeText(activityUrl);
      toast({
        title: 'Link copied!',
        description: 'Activity link copied to clipboard',
      });
      return;
    }

    const encodedText = encodeURIComponent(text + ' on VeriEdit AI 🛡️');
    const encodedUrl = encodeURIComponent(activityUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const getActivityText = (activity: ActivityItem) => {
    const { activity_type, metadata } = activity;
    const username = metadata.username || 'Someone';
    
    switch (activity_type) {
      case 'verification_complete':
        return `${username} verified content with ${metadata.trust_score || 'N/A'}/100 trust score`;
      case 'thread_created':
        return `${username} created a new thread: "${metadata.title || 'Untitled'}"`;
      case 'room_created':
        return `${username} created room: "${metadata.room_name || 'Unnamed Room'}"`;
      case 'room_joined':
        return `${username} joined "${metadata.room_name || 'a room'}"`;
      case 'comment_posted':
        return `${username} commented on a thread`;
      case 'high_trust_score':
        return `${username} achieved a high trust score of ${metadata.trust_score || 'N/A'}!`;
      case 'user_follow':
        return `${username} followed ${metadata.followed_username || 'someone'}`;
      default:
        return `${username} performed an action`;
    }
  };

  const navigateToEntity = () => {
    if (!activity || !activity.entity_id) return;
    
    switch (activity.activity_type) {
      case 'thread_created':
      case 'comment_posted':
        navigate(`/lighthouse/thread/${activity.entity_id}`);
        break;
      case 'room_created':
      case 'room_joined':
        navigate(`/lighthouse/${activity.entity_id}`);
        break;
      default:
        navigate('/lighthouse');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!activity) {
    return null;
  }

  const activityTitle = getActivityText(activity);
  const trustScore = activity.metadata.trust_score;

  return (
    <>
      <DynamicMeta
        title={activityTitle}
        description={`See the details of this verification activity on VeriEdit AI. Join ${activity.view_count} others who viewed this activity.`}
        url={window.location.href}
        type="article"
        trustScore={trustScore}
        author={activity.metadata.username || 'Anonymous'}
        publishedTime={activity.created_at}
      />
      
      <Navigation />
      
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/activity-feed')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activity Feed
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{activityTitle}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {activity.metadata.username || 'Anonymous'}
                    </span>
                  </div>
                </div>
                
                {trustScore && (
                  <Badge variant={trustScore >= 70 ? 'default' : 'destructive'} className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {trustScore}/100
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {activity.metadata.title && (
                <div>
                  <h3 className="font-semibold mb-2">Thread Title</h3>
                  <p className="text-muted-foreground">{activity.metadata.title}</p>
                </div>
              )}

              {activity.metadata.room_name && (
                <div>
                  <h3 className="font-semibold mb-2">Room</h3>
                  <p className="text-muted-foreground">{activity.metadata.room_name}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{activity.view_count}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{activity.share_count}</div>
                  <div className="text-xs text-muted-foreground">Shares</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{activity.click_count}</div>
                  <div className="text-xs text-muted-foreground">Clicks</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Share this activity</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleShare('twitter')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button variant="outline" onClick={() => handleShare('linkedin')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" onClick={() => handleShare('facebook')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button variant="outline" onClick={() => handleShare('copy')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>

              {activity.entity_id && (
                <>
                  <Separator />
                  <Button onClick={navigateToEntity} className="w-full" size="lg">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Want to contribute to the verification community?
            </p>
            <Button onClick={() => navigate('/lighthouse')} size="lg">
              Join the Lighthouse Hub
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
