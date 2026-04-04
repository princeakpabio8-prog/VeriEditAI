import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, MessageSquare, Plus, UserPlus, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: string;
  activity_type: string;
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
  verification_complete: 'text-green-400',
  thread_created: 'text-blue-400',
  room_created: 'text-purple-400',
  room_joined: 'text-cyan-400',
  high_trust_score: 'text-yellow-400',
  user_follow: 'text-pink-400',
  comment_posted: 'text-indigo-400',
};

export function LiveActivityWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
    
    // Poll every 2 minutes instead of realtime subscription to save bandwidth
    const interval = setInterval(fetchActivities, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_stream')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setActivities(data as ActivityItem[]);
  };

  const getActivityText = (activity: ActivityItem) => {
    const name = activity.metadata.username || activity.metadata.full_name || 'Someone';
    switch (activity.activity_type) {
      case 'verification_complete': return `${name} verified a claim`;
      case 'thread_created': return `${name} created "${activity.metadata.title}"`;
      case 'room_created': return `${name} created room "${activity.metadata.room_name}"`;
      case 'high_trust_score': return `${name} achieved ${activity.metadata.trust_score}% trust score!`;
      default: return `${name} took an action`;
    }
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Real-Time Verification</h3>
              <p className="text-sm text-muted-foreground">Happening Now</p>
            </div>
          </div>
          {isLive && (
            <Badge variant="outline" className="animate-pulse border-green-500/50 text-green-400 bg-green-500/10">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-ping" />
              LIVE
            </Badge>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Waiting for activity...</p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || Activity;
              const iconColor = activityColors[activity.activity_type as keyof typeof activityColors];
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`p-2 rounded-full bg-muted/50 ${iconColor} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{getActivityText(activity)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button
          onClick={() => navigate('/activity-feed')}
          variant="outline"
          className="w-full group border-primary/30 hover:bg-primary/10"
        >
          View All Activity
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
}
