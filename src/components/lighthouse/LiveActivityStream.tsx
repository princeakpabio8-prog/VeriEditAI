import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  UserPlus,
  TrendingUp,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateActivityStreamSchema, injectStructuredData, removeStructuredData } from '@/lib/structured-data';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  entity_id: string | null;
  metadata: {
    username?: string;
    full_name?: string;
    title?: string;
    room_name?: string;
    trust_score?: number;
  };
  created_at: string;
}

const activityIcons = {
  verification_complete: CheckCircle2,
  thread_created: MessageSquare,
  room_created: Plus,
  room_joined: UserPlus,
  high_trust_score: TrendingUp,
  user_follow: Users,
  comment_posted: MessageSquare,
};

const activityColors = {
  verification_complete: 'text-green-500',
  thread_created: 'text-blue-500',
  room_created: 'text-purple-500',
  room_joined: 'text-cyan-500',
  high_trust_score: 'text-yellow-500',
  user_follow: 'text-pink-500',
  comment_posted: 'text-indigo-500',
};

export function LiveActivityStream() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchInitialActivities();
    
    const channel = supabase
      .channel('activity-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_stream'
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityItem, ...prev].slice(0, 20));
          setIsLive(true);
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      removeStructuredData('activity-stream-schema');
    };
  }, []);

  // Inject structured data when activities change
  useEffect(() => {
    if (activities.length > 0) {
      const schemaData = generateActivityStreamSchema({
        activities: activities.slice(0, 10).map(activity => ({
          id: activity.id,
          activityType: activity.activity_type,
          description: getActivityText(activity),
          timestamp: activity.created_at,
          userName: activity.metadata.username || activity.metadata.full_name,
          url: activity.activity_type === 'thread_created' && activity.entity_id
            ? `https://verieditai.com/lighthouse/thread/${activity.entity_id}`
            : activity.activity_type === 'room_created' && activity.entity_id
            ? `https://verieditai.com/lighthouse/room/${activity.entity_id}`
            : undefined
        })),
        totalActivities: activities.length
      });

      injectStructuredData(schemaData, 'activity-stream-schema');
    }
  }, [activities]);

  const fetchInitialActivities = async () => {
    const { data } = await supabase
      .from('activity_stream')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setActivities(data as ActivityItem[]);
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const name = activity.metadata.username || activity.metadata.full_name || 'Someone';
    
    switch (activity.activity_type) {
      case 'verification_complete':
        return `${name} verified a claim`;
      case 'thread_created':
        return `${name} created "${activity.metadata.title}"`;
      case 'room_created':
        return `${name} created room "${activity.metadata.room_name}"`;
      case 'room_joined':
        return `${name} joined ${activity.metadata.room_name}`;
      case 'comment_posted':
        return `${name} commented on a thread`;
      case 'high_trust_score':
        return `${name} achieved ${activity.metadata.trust_score}% trust score!`;
      case 'user_follow':
        return `${name} followed someone`;
      default:
        return `${name} took an action`;
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.activity_type === 'thread_created' && activity.entity_id) {
      navigate(`/lighthouse/thread/${activity.entity_id}`);
    } else if (activity.activity_type === 'room_created' && activity.entity_id) {
      navigate(`/lighthouse/room/${activity.entity_id}`);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Live Activity</h3>
          </div>
          {isLive && (
            <Badge variant="outline" className="animate-pulse border-green-500/50 text-green-500">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-ping" />
              Live
            </Badge>
          )}
        </div>
      </div>
      
      <ScrollArea className={isMobile ? "h-[300px]" : "h-[400px]"}>
        <div className={`p-4 space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Waiting for activity...</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || Activity;
              const iconColor = activityColors[activity.activity_type as keyof typeof activityColors] || 'text-primary';
              
              return (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  className={`flex items-start gap-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group border border-transparent hover:border-primary/20 touch-manipulation ${isMobile ? 'p-3 min-h-[60px]' : 'p-3'}`}
                >
                  <div className={`p-2 rounded-full bg-muted/50 ${iconColor} ${isMobile ? 'shrink-0' : ''}`}>
                    <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-foreground group-hover:text-primary transition-colors ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
