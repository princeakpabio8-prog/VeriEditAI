import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No threads yet</h3>
        <p className="text-muted-foreground">Be the first to start a discussion!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card
          key={thread.id}
          className="p-6 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => navigate(`/lighthouse/${thread.room_id}/thread/${thread.id}`)}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {thread.is_auto_verified && thread.trust_score !== null && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {thread.trust_score}% Trust
                  </Badge>
                )}
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {thread.title}
                </h3>
              </div>

              <p className="text-muted-foreground line-clamp-2 mb-4">
                {thread.content.substring(0, 200)}
                {thread.content.length > 200 && '...'}
              </p>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <UserAvatar
                  avatarUrl={thread.author_avatar}
                  fullName={thread.author_name}
                  size="xs"
                />
                <span>
                  by {thread.author_name || 'Anonymous'}
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{thread.upvote_count}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{thread.comment_count}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
