import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { DynamicMeta } from '@/components/DynamicMeta';
import { useBlogPost } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Eye, ArrowLeft, Share2, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');

  // Inject Article structured data
  useEffect(() => {
    if (!post) return;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.excerpt || post.content.slice(0, 155),
      image: post.cover_image_url,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@type': 'Organization', name: 'VeriEdit AI' },
      publisher: {
        '@type': 'Organization',
        name: 'VeriEdit AI',
        url: window.location.origin,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${window.location.origin}/blog/${post.slug}`,
      },
      wordCount: post.content.split(/\s+/).length,
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `blog-article-${post.id}`;
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [post]);

  const shareUrl = `${window.location.origin}/blog/${slug}`;
  const shareText = post ? `${post.title} — VeriEdit AI Blog` : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 max-w-3xl mx-auto px-4">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-64 w-full mb-6 rounded-xl" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || post.content.slice(0, 155)}
        image={post.cover_image_url || undefined}
        url={shareUrl}
        type="article"
        author="VeriEdit AI"
        publishedTime={post.published_at || undefined}
      />
      <Navigation />

      <article className="pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-4"
        >
          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="capitalize">
                {post.category?.replace('-', ' ') || 'General'}
              </Badge>
              {post.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.reading_time_minutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.view_count} views
              </span>
            </div>
          </header>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="rounded-xl overflow-hidden mb-8 border border-border">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary
            prose-strong:text-foreground prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
            prose-code:bg-secondary prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
            prose-pre:bg-secondary prose-pre:border prose-pre:border-border
            prose-img:rounded-xl prose-img:border prose-img:border-border
            prose-li:text-muted-foreground
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Share */}
          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Share this post</p>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl + '?utm_source=twitter&utm_medium=social&utm_campaign=blog_share')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-2">
                  <Twitter className="h-4 w-4" /> Twitter
                </Button>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl + '?utm_source=linkedin&utm_medium=social&utm_campaign=blog_share')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-2">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                }}
              >
                <Share2 className="h-4 w-4" /> Copy Link
              </Button>
            </div>
          </div>
        </motion.div>
      </article>

      <Footer />
    </div>
  );
}
