import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DynamicMeta } from '@/components/DynamicMeta';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  FileCheck, 
  MessageSquare,
  Share2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { generateActivityStreamSchema, injectStructuredData, removeStructuredData } from '@/lib/structured-data';

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

const activityIcons = {
  verification_complete: FileCheck,
  thread_created: MessageSquare,
  room_created: Users,
  room_joined: Users,
  comment_posted: MessageSquare,
  high_trust_score: TrendingUp,
  user_follow: Users,
};

const activityColors = {
  verification_complete: 'text-green-500',
  thread_created: 'text-blue-500',
  room_created: 'text-purple-500',
  room_joined: 'text-indigo-500',
  comment_posted: 'text-yellow-500',
  high_trust_score: 'text-emerald-500',
  user_follow: 'text-pink-500',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public-activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_stream',
          filter: 'is_public=eq.true'
        },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityItem, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      removeStructuredData('activity-stream-schema');
    };
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      // Inject structured data for top 10 activities
      const topActivities = activities.slice(0, 10);
      const schema = generateActivityStreamSchema({
        activities: topActivities.map(activity => ({
          id: activity.id,
          activityType: activity.activity_type,
          description: getActivityText(activity),
          timestamp: activity.created_at,
          userName: activity.metadata?.username || 'Anonymous User',
          url: getActivityUrl(activity),
        })),
        totalActivities: totalActivities,
      });
      injectStructuredData(schema, 'activity-stream-schema');
    }
  }, [activities]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('activity_stream')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities((data || []) as ActivityItem[]);
      setTotalActivities(count || 0);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
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

  const getActivityUrl = (activity: ActivityItem) => {
    const { activity_type, entity_id } = activity;
    
    if (!entity_id) return `/lighthouse`;
    
    switch (activity_type) {
      case 'thread_created':
      case 'comment_posted':
        return `/lighthouse/activity/${activity.id}`;
      case 'room_created':
      case 'room_joined':
        return `/lighthouse/${entity_id}`;
      default:
        return `/lighthouse`;
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    // Track click
    supabase
      .from('activity_stream')
      .update({ click_count: activity.click_count + 1 })
      .eq('id', activity.id)
      .then();

    const url = getActivityUrl(activity);
    navigate(url);
  };

  const handleShare = async (activity: ActivityItem, platform: 'twitter' | 'linkedin' | 'copy') => {
    const activityUrl = `${window.location.origin}/lighthouse/activity/${activity.id}`;
    const text = getActivityText(activity);
    
    // Track share
    await supabase
      .from('activity_stream')
      .update({ share_count: activity.share_count + 1 })
      .eq('id', activity.id);

    if (platform === 'copy') {
      await navigator.clipboard.writeText(activityUrl);
      return;
    }

    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(activityUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const Icon = Activity;

  return (
    <>
      <DynamicMeta
        title="Live Activity Feed - Truth Verification in Real-Time"
        description={`Follow ${totalActivities}+ real-time verification activities. See what's being verified, discussed, and discovered on the Lighthouse platform right now.`}
        url={`${window.location.origin}/activity-feed`}
        type="website"
      />
      
      <Navigation />
      
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <header className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Live Activity Feed</h1>
              <Badge variant="outline" className="animate-pulse">LIVE</Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time stream of verification activities happening across the Lighthouse platform. 
              Every claim verified, every discussion started, every truth discovered.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActivities.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Live Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activities.length}</div>
                <p className="text-xs text-muted-foreground">Recent activities</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Live updates from the verification community
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mb-4 opacity-20" />
                    <p>No activities yet. Be the first to verify something!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activities.map((activity) => {
                      const ActivityIcon = activityIcons[activity.activity_type as keyof typeof activityIcons] || Activity;
                      const iconColor = activityColors[activity.activity_type as keyof typeof activityColors] || 'text-gray-500';
                      
                      return (
                        <article
                          key={activity.id}
                          className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                          onClick={() => handleActivityClick(activity)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-accent ${iconColor}`}>
                              <ActivityIcon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-relaxed">
                                {getActivityText(activity)}
                              </p>
                              
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </span>
                                
                                {activity.view_count > 0 && (
                                  <span>{activity.view_count} views</span>
                                )}
                                
                                {activity.share_count > 0 && (
                                  <span>{activity.share_count} shares</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(activity, 'copy');
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
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
