import { useQuery } from '@tanstack/react-query';
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
}

export function useNewsFeed(limit: number = 20) {
  const { data: articles, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['news-feed', limit],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('news_feed')
        .select('id, title, link, summary, source, source_url, category, published_at, trust_score, verification_id, is_verified, image_url, video_url')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - news doesn't need instant refresh
    gcTime: 15 * 60 * 1000,
  });

  return {
    articles: (articles || []) as NewsArticle[],
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load news feed') : null,
    refetch,
  };
}
