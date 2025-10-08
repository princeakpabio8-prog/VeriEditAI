import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewsCard } from "./news-card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "./loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Newspaper } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: { name: string };
  publishedAt: string;
}

const CATEGORIES = [
  { id: 'general', label: 'All News' },
  { id: 'technology', label: 'Technology' },
  { id: 'health', label: 'Health' },
  { id: 'business', label: 'Business' },
  { id: 'science', label: 'Science' },
];

export const NewsDiscovery = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('general');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('fetch-news', {
        body: { category, pageSize: 20 },
      });

      if (fetchError) throw fetchError;

      setArticles(data?.articles || []);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickVerify = (article: Article) => {
    const verificationContent = `${article.title}\n\n${article.description}\n\nSource: ${article.url}`;
    
    sessionStorage.setItem('pendingVerification', JSON.stringify({
      content: verificationContent,
      contentType: 'text',
      metadata: {
        source: 'news_discovery',
        newsSource: article.source.name,
        newsUrl: article.url,
        publishedAt: article.publishedAt,
      }
    }));

    toast({
      title: "Starting verification...",
      description: "Analyzing this news article for you.",
    });

    navigate('/verify');
  };

  if (loading && articles.length === 0) {
    return <LoadingState variant="card" count={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Discover & Verify News</h2>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={category === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {articles.length === 0 && !loading && (
        <Alert>
          <Newspaper className="h-4 w-4" />
          <AlertDescription>
            No news articles available at the moment. Try a different category.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <NewsCard
            key={`${article.url}-${index}`}
            article={article}
            onQuickVerify={() => handleQuickVerify(article)}
          />
        ))}
      </div>
    </div>
  );
};
