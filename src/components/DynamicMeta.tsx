import { useEffect } from 'react';

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
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | VeriEdit AI`;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      updateMetaTag('description', description);
    }

    // Open Graph tags
    if (title) {
      updateMetaTag('og:title', title.includes('VeriEdit') ? title : `${title} | VeriEdit AI`, true);
    }
    if (description) {
      updateMetaTag('og:description', description, true);
    }
    if (image) {
      // Ensure absolute URL for OG image
      const absoluteImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;
      updateMetaTag('og:image', absoluteImage, true);
      updateMetaTag('og:image:secure_url', absoluteImage, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:type', 'image/png', true);
    }
    if (url) {
      updateMetaTag('og:url', url, true);
    }
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'VeriEdit AI', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    if (title) {
      updateMetaTag('twitter:title', title.includes('VeriEdit') ? title : `${title} | VeriEdit AI`);
    }
    if (description) {
      updateMetaTag('twitter:description', description);
    }
    if (image) {
      const absoluteImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;
      updateMetaTag('twitter:image', absoluteImage);
      updateMetaTag('twitter:image:src', absoluteImage);
    }

    // Trust Score as Twitter data
    if (trustScore !== undefined) {
      updateMetaTag('twitter:label1', 'Trust Score');
      updateMetaTag('twitter:data1', `${trustScore}/100`);
    }

    // Author info
    if (author) {
      updateMetaTag('article:author', author, true);
    }
    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
    }

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = 'VeriEdit AI - Truth Verification Platform';
    };
  }, [title, description, image, url, type, trustScore, author, publishedTime]);

  return null;
}
