import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ImageUploader } from './ImageUploader';
import { ImageGallery } from './ImageGallery';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
  image_urls?: string[];
}

interface ThreadCommentsProps {
  threadId: string;
}

const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be less than 2000 characters")
});

export function ThreadComments({ threadId }: ThreadCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<any[]>([]);
  const { toast } = useToast();

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
              .select('full_name')
              .eq('user_id', commentData.author_id)
              .single();

            setComments(prev => [...prev, {
              ...commentData,
              author_name: profileData?.full_name || null
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
        // Fetch author names for all comments
        const authorIds = [...new Set(commentsData.map(c => c.author_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', authorIds);

        const profileMap = new Map(
          profilesData?.map(p => [p.user_id, p.full_name]) || []
        );

        const commentsWithAuthors = commentsData.map(comment => ({
          ...comment,
          author_name: profileMap.get(comment.author_id) || null
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
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[100px]"
          maxLength={2000}
        />
        
        <ImageUploader
          maxImages={3}
          maxSizeMB={5}
          onUploadComplete={handleImageUpload}
          uploadPath={`${crypto.randomUUID()}/comments`}
        />
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {newComment.length}/2000
          </span>
          <Button type="submit" disabled={submitting || !newComment.trim()} className="gap-2">
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
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {(comment.author_name || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {comment.author_name || 'Anonymous'}
                  </span>
                   <span className="text-sm text-muted-foreground">
                     {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                   </span>
                 </div>
                 <p className="text-sm whitespace-pre-wrap mb-3">{comment.content}</p>
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