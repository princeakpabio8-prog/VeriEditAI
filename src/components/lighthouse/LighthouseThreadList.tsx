import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useIsMobile } from '@/hooks/use-mobile';

interface Thread {
  id: string;
  room_id: string;
  title: string;
  content: string;
  author_name?: string | null;
  author_avatar?: string | null;
  trust_score: number | null;
  is_auto_verified: boolean | null;
  comment_count: number;
  upvote_count: number;
  created_at: string;
}

interface LighthouseThreadListProps {
  threads: Thread[];
  loading: boolean;
}

export function LighthouseThreadList({ threads, loading }: LighthouseThreadListProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={isMobile ? "p-4" : "p-6"}>
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <Card className={`${isMobile ? 'p-8' : 'p-12'} text-center`}>
        <MessageSquare className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} mx-auto mb-4 text-muted-foreground`} />
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>No threads yet</h3>
        <p className="text-muted-foreground text-sm">Be the first to start a discussion!</p>
      </Card>
    );
  }

  return (
    <div className={isMobile ? "space-y-3" : "space-y-4"}>
      {threads.map((thread) => (
        <Card
          key={thread.id}
          className={`${isMobile ? 'p-4 active:scale-[0.98]' : 'p-6'} hover:shadow-lg transition-all cursor-pointer group touch-manipulation`}
          onClick={() => navigate(`/lighthouse/${thread.room_id}/thread/${thread.id}`)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Title and badge */}
              <div className={`flex items-start gap-2 mb-2 ${isMobile ? 'flex-col' : ''}`}>
                {thread.is_auto_verified && thread.trust_score !== null && (
                  <Badge variant="secondary" className="gap-1 shrink-0 text-xs">
                    <Shield className="h-3 w-3" />
                    {thread.trust_score}%
                  </Badge>
                )}
                <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-semibold group-hover:text-primary transition-colors line-clamp-2`}>
                  {thread.title}
                </h3>
              </div>

              <p className={`text-muted-foreground ${isMobile ? 'line-clamp-2 text-sm' : 'line-clamp-2'} mb-3`}>
                {thread.content.substring(0, isMobile ? 120 : 200)}
                {thread.content.length > (isMobile ? 120 : 200) && '...'}
              </p>

              <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isMobile ? 'flex-wrap' : ''}`}>
                <UserAvatar
                  avatarUrl={thread.author_avatar}
                  fullName={thread.author_name}
                  size="xs"
                  clickable={false}
                />
                <span className="truncate max-w-[100px]">
                  {thread.author_name || 'Anonymous'}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span className="shrink-0 text-xs">
                  {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span className="text-xs">{thread.upvote_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="text-xs">{thread.comment_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
