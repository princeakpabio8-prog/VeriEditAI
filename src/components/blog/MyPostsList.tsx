import { Link } from 'react-router-dom';
import { useMyPosts, useDeleteBlogPost, BlogPost } from '@/hooks/useBlogPosts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, FileEdit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function MyPostsList() {
  const { data: posts, isLoading } = useMyPosts();
  const deleteMutation = useDeleteBlogPost();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        You haven't written any posts yet.
      </p>
    );
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-3">
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={post.status === 'published' ? 'default' : 'secondary'}
                    className="text-[10px] shrink-0"
                  >
                    {post.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {format(new Date(post.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-foreground truncate">{post.title}</h3>
              </div>
              <div className="flex gap-1 shrink-0">
                {post.status === 'published' && (
                  <Link to={`/blog/${post.slug}`}>
                    <Button size="icon" variant="ghost" className="h-9 w-9">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(post.id, post.title)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
