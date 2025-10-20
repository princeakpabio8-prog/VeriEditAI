import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  summary: string;
  source: string;
  source_url: string;
  category: string;
  published_at: string;
  trust_score: number | null;
  verification_id: string | null;
  is_verified: boolean;
  image_url: string | null;
  video_url: string | null;
  metadata: any;
}

export function useNewsFeed(limit: number = 20) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();

    // Real-time subscription
    const channel = supabase
      .channel('news-feed-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_feed'
        },
        () => {
          // Refetch when data changes
          fetchArticles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('news_feed')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching news feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news feed');
    } finally {
      setLoading(false);
    }
  };

  return { articles, loading, error, refetch: fetchArticles };
}
