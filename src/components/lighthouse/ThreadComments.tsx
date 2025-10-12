import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Link } from 'react-router-dom';
import { ImageUploader } from './ImageUploader';
import { ImageGallery } from './ImageGallery';
import { MentionInput } from '@/components/mentions/MentionInput';
import { notifyThreadAuthorNewComment, parseMentionsAndNotify } from '@/lib/notification-helpers';
import { useIsMobile } from '@/hooks/use-mobile';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  image_urls?: string[];
}

interface ThreadCommentsProps {
  threadId: string;
  roomId: string;
}

const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be less than 2000 characters")
});

export function ThreadComments({ threadId, roomId }: ThreadCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<any[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchComments();
    
    // Subscribe to new comments
    const channel = supabase
      .channel(`thread_comments:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thread_comments',
          filter: `thread_id=eq.${threadId}`
        },
        async (payload) => {
          // Fetch the comment with author info
          const { data: commentData } = await supabase
            .from('thread_comments')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (commentData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', commentData.author_id)
              .single();

            setComments(prev => [...prev, {
              ...commentData,
              author_name: profileData?.full_name || null,
              author_avatar: profileData?.avatar_url || null
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('thread_comments')
        .select('*')
        .eq('thread_id', threadId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        // Fetch author names and avatars for all comments
        const authorIds = [...new Set(commentsData.map(c => c.author_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', authorIds);

        const profileMap = new Map(
          profilesData?.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]) || []
        );

        const commentsWithAuthors = commentsData.map(comment => ({
          ...comment,
          author_name: profileMap.get(comment.author_id)?.full_name || null,
          author_avatar: profileMap.get(comment.author_id)?.avatar_url || null
        }));

        setComments(commentsWithAuthors);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    try {
      commentSchema.parse({ content: newComment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid comment",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('thread_comments')
        .insert({
          thread_id: threadId,
          author_id: user.id,
          content: newComment.trim(),
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          image_metadata: imageMetadata.length > 0 ? imageMetadata : null
        });

      if (error) throw error;

      // Notify thread author about new comment
      await notifyThreadAuthorNewComment(threadId, roomId, user.id);

      // Parse and notify mentioned users
      if (mentionedUsers.length > 0) {
        for (const username of mentionedUsers) {
          const { data: mentionedProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('username', username)
            .single();

          if (mentionedProfile && mentionedProfile.user_id !== user.id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: mentionedProfile.user_id,
                type: 'mention',
                message: `mentioned you in a comment`,
                actionUrl: `/threads/${threadId}`,
                metadata: {
                  thread_id: threadId,
                  room_id: roomId,
                  comment_content: newComment.substring(0, 100)
                }
              });
          }
        }
      }

      setNewComment('');
      setImageUrls([]);
      setImageMetadata([]);
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleImageUpload = (urls: string[], metadata: any[]) => {
    setImageUrls(urls);
    setImageMetadata(metadata);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </h2>
        <p className="text-muted-foreground">Loading comments...</p>
      </Card>
    );
  }

  return (
    <Card className={isMobile ? "p-4" : "p-6"}>
      <h2 className={`${isMobile ? "text-lg" : "text-xl"} font-semibold mb-6 flex items-center gap-2`}>
        <MessageSquare className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <MentionInput
          value={newComment}
          onChange={setNewComment}
          onMentionsChange={setMentionedUsers}
          placeholder="Share your thoughts... (type @ to mention users)"
          rows={4}
        />
        
        <ImageUploader
          maxImages={3}
          maxSizeMB={5}
          onUploadComplete={handleImageUpload}
          uploadPath="comments"
        />
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {newComment.length}/2000
          </span>
          <Button 
            type="submit" 
            disabled={submitting || !newComment.trim()} 
            className="gap-2"
            size={isMobile ? "mobile" : "default"}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`flex gap-3 ${isMobile ? 'p-3 touch-manipulation' : 'gap-4'}`}>
              <UserAvatar
                avatarUrl={comment.author_avatar}
                fullName={comment.author_name}
                userId={comment.author_id}
                size={isMobile ? "md" : "sm"}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link 
                    to={`/profile/${comment.author_id}`}
                    className={`font-medium hover:text-primary transition-colors ${isMobile ? 'text-base' : ''}`}
                  >
                    {comment.author_name || 'Anonymous'}
                  </Link>
                   <span className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                     {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                   </span>
                 </div>
                 <p className={`${isMobile ? 'text-base' : 'text-sm'} whitespace-pre-wrap mb-3`}>{comment.content}</p>
                 {comment.image_urls && comment.image_urls.length > 0 && (
                   <ImageGallery images={comment.image_urls} altPrefix="Comment image" />
                 )}
               </div>
             </div>
           ))
         )}
      </div>
    </Card>
  );
}