import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BlogPost {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  reading_time_minutes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function usePublishedPosts(category?: string) {
  return useQuery({
    queryKey: ['blog-posts', 'published', category],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
}

export function useMyPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['blog-posts', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BlogPost[];
    },
    enabled: !!user?.id,
  });
}

export function useSaveBlogPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: {
      id?: string;
      title: string;
      content: string;
      excerpt?: string;
      cover_image_url?: string;
      category?: string;
      tags?: string[];
      status?: 'draft' | 'published';
      meta_title?: string;
      meta_description?: string;
    }) => {
      const slug = generateSlug(post.title) + '-' + Date.now().toString(36);
      const reading_time_minutes = estimateReadingTime(post.content);
      const published_at = post.status === 'published' ? new Date().toISOString() : null;

      if (post.id) {
        const updateData: any = {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || post.content.slice(0, 160),
          cover_image_url: post.cover_image_url,
          category: post.category || 'general',
          tags: post.tags || [],
          status: post.status || 'draft',
          meta_title: post.meta_title || post.title,
          meta_description: post.meta_description || post.content.slice(0, 155),
          reading_time_minutes,
          updated_at: new Date().toISOString(),
        };
        if (post.status === 'published') {
          updateData.published_at = published_at;
        }

        const { data, error } = await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', post.id)
          .select()
          .single();
        if (error) throw error;
        return data as BlogPost;
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert({
            author_id: user!.id,
            title: post.title,
            slug,
            content: post.content,
            excerpt: post.excerpt || post.content.slice(0, 160),
            cover_image_url: post.cover_image_url,
            category: post.category || 'general',
            tags: post.tags || [],
            status: post.status || 'draft',
            published_at,
            meta_title: post.meta_title || post.title,
            meta_description: post.meta_description || post.content.slice(0, 155),
            reading_time_minutes,
          })
          .select()
          .single();
        if (error) throw error;
        return data as BlogPost;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}
