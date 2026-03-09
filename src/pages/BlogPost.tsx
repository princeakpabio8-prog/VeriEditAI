import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { DynamicMeta } from '@/components/DynamicMeta';
import { useBlogPost } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Eye, ArrowLeft, Share2, Twitter, Linkedin, MessageCircle, Facebook, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { ShareFAB } from '@/components/blog/ShareFAB';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');

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

  // Use edge function URL for social sharing so crawlers get proper OG meta tags
  const socialShareUrl = `https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/blog-share/${slug}`;
  const directUrl = `${window.location.origin}/blog/${slug}`;
  const shareText = post ? `${post.title} — VeriEdit AI Blog` : '';
  const shareUrl = socialShareUrl;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 sm:pt-24 pb-24 sm:pb-16 max-w-3xl mx-auto px-4">
          <Skeleton className="h-6 sm:h-8 w-2/3 mb-4" />
          <Skeleton className="h-48 sm:h-64 w-full mb-6 rounded-xl" />
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
        <main className="pt-20 sm:pt-24 pb-24 sm:pb-16 max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">This blog post doesn't exist or has been removed.</p>
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

      <article className="pt-20 sm:pt-24 pb-24 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-4 sm:px-6"
        >
          {/* Back link - larger touch target */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary active:text-primary transition-colors mb-6 sm:mb-8 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3 sm:mb-4">
              <Badge variant="secondary" className="capitalize text-xs">
                {post.category?.replace('-', ' ') || 'General'}
              </Badge>
              {post.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[11px] sm:text-xs">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {format(new Date(post.published_at), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {post.reading_time_minutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {post.view_count} views
              </span>
            </div>
          </header>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="rounded-lg sm:rounded-xl overflow-hidden mb-6 sm:mb-8 border border-border -mx-4 sm:mx-0">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[250px] sm:max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Content - mobile optimized prose */}
          <div className="prose prose-invert prose-base sm:prose-lg max-w-none
            prose-headings:text-foreground prose-headings:text-lg prose-headings:sm:text-xl
            prose-h2:text-xl prose-h2:sm:text-2xl
            prose-p:text-muted-foreground prose-p:text-[15px] prose-p:sm:text-base prose-p:leading-relaxed
            prose-a:text-primary prose-a:break-words
            prose-strong:text-foreground prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
            prose-code:bg-secondary prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm
            prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto prose-pre:text-xs prose-pre:sm:text-sm
            prose-img:rounded-lg prose-img:sm:rounded-xl prose-img:border prose-img:border-border
            prose-li:text-muted-foreground prose-li:text-[15px] prose-li:sm:text-base
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Share section */}
          <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Share this post</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl + '?utm_source=twitter&utm_medium=social&utm_campaign=blog_share')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none min-w-[calc(50%-4px)] sm:min-w-0"
              >
                <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                  <Twitter className="h-4 w-4" /> X / Twitter
                </Button>
              </a>
              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl + '?utm_source=facebook&utm_medium=social&utm_campaign=blog_share')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none min-w-[calc(50%-4px)] sm:min-w-0"
              >
                <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                  <Facebook className="h-4 w-4" /> Facebook
                </Button>
              </a>
              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl + '?utm_source=linkedin&utm_medium=social&utm_campaign=blog_share')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none min-w-[calc(50%-4px)] sm:min-w-0"
              >
                <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </Button>
              </a>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl + '?utm_source=whatsapp&utm_medium=social&utm_campaign=blog_share')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none min-w-[calc(50%-4px)] sm:min-w-0"
              >
                <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
              {/* Copy Link */}
              <Button
                size="sm"
                variant="outline"
                className="gap-2 flex-1 sm:flex-none min-h-[44px] min-w-[calc(50%-4px)] sm:min-w-0"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied to clipboard!');
                }}
              >
                <Share2 className="h-4 w-4" /> Copy Link
              </Button>
              {/* Native share (mobile) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none min-h-[44px] min-w-[calc(50%-4px)] sm:min-w-0"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: post.title,
                        text: shareText,
                        url: shareUrl,
                      });
                    } catch {
                      // user cancelled
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" /> More...
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </article>

      {/* Floating share button */}
      <ShareFAB title={post.title} url={shareUrl} text={shareText} />

      <Footer />
    </div>
  );
}
