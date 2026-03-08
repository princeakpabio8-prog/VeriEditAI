import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { DynamicMeta } from '@/components/DynamicMeta';
import { usePublishedPosts, BlogPost } from '@/hooks/useBlogPosts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Eye, BookOpen, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { injectStructuredData } from '@/lib/structured-data';
import { useEffect } from 'react';

const CATEGORIES = ['all', 'fact-checking', 'technology', 'media-literacy', 'updates', 'general'];

export default function Blog() {
  const [category, setCategory] = useState('all');
  const { data: posts, isLoading } = usePublishedPosts(category);
  const { user } = useAuth();

  useEffect(() => {
    const blogListSchema = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'VeriEdit AI Blog',
      description: 'Insights on fact-checking, media literacy, and truth verification technology.',
      url: `${window.location.origin}/blog`,
      publisher: {
        '@type': 'Organization',
        name: 'VeriEdit AI',
        url: window.location.origin,
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'blog-list-schema';
    script.textContent = JSON.stringify(blogListSchema);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title="Blog - Insights on Fact-Checking & Truth"
        description="Stay informed with VeriEdit AI's blog. Expert insights on fact-checking, media literacy, AI verification technology, and fighting misinformation."
        url={`${window.location.origin}/blog`}
        type="website"
      />
      <Navigation />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">VeriEdit Blog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Truth in Every <span className="text-primary">Word</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert insights on fact-checking, media literacy, and the technology behind truth verification.
            </p>
            {user && (
              <Link to="/blog/write">
                <Button className="mt-6 gap-2">
                  <PenLine className="h-4 w-4" />
                  Write a Post
                </Button>
              </Link>
            )}
          </motion.div>
        </section>

        {/* Category Filter */}
        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat === 'all' ? 'All Posts' : cat.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="max-w-5xl mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-card border-border overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <BlogPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-lg">No posts yet. Check back soon!</p>
              {user && (
                <Link to="/blog/write">
                  <Button variant="outline" className="mt-4 gap-2">
                    <PenLine className="h-4 w-4" />
                    Be the first to write
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function BlogPostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/blog/${post.slug}`}>
        <Card className="bg-card border-border overflow-hidden hover:border-primary/30 transition-all duration-300 group h-full">
          {post.cover_image_url ? (
            <div className="h-48 overflow-hidden">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/30" />
            </div>
          )}
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {post.category?.replace('-', ' ') || 'General'}
              </Badge>
              {post.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.excerpt || post.content.slice(0, 120)}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.published_at), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time_minutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.view_count}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
