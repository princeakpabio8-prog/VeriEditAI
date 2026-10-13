import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { canonicalUrl, SITE_URL } from '@/lib/seo';

interface DynamicMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  trustScore?: number;
  author?: string;
  publishedTime?: string;
}

export function DynamicMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  trustScore,
  author,
  publishedTime,
}: DynamicMetaProps) {
  const { pathname } = useLocation();
  // Share-service URLs are transport links, not the identity of this page.
  const pageUrl = canonicalUrl(pathname);
  const pageTitle = title?.includes('VeriEdit') ? title : title ? `${title} | VeriEdit AI` : undefined;
  const imageUrl = image ? new URL(image, SITE_URL).href : undefined;
  return (
    <Helmet>
      {pageTitle && <title>{pageTitle}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={pageUrl} />
      {pageTitle && <meta property="og:title" content={pageTitle} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="VeriEdit AI" />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      {pageTitle && <meta name="twitter:title" content={pageTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {trustScore !== undefined && <meta name="twitter:label1" content="Trust Score" />}
      {trustScore !== undefined && <meta name="twitter:data1" content={`${trustScore}/100`} />}
      {author && <meta property="article:author" content={author} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
    </Helmet>
  );
}
