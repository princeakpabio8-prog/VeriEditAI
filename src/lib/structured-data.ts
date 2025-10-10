/**
 * Structured Data (Schema.org JSON-LD) helpers for SEO
 * Generates rich snippets for verified claims, articles, and organizations
 */

interface ClaimReviewData {
  claimText: string;
  trustScore: number;
  author?: string;
  datePublished: string;
  url: string;
}

interface ArticleData {
  headline: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  author?: string;
  trustScore?: number;
}

interface OrganizationData {
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  trustScore?: number;
  verifiedPartner?: boolean;
}

export function generateClaimReviewSchema(data: ClaimReviewData): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    "claimReviewed": data.claimText,
    "url": data.url,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": data.trustScore,
      "bestRating": 100,
      "worstRating": 0,
      "ratingExplanation": `AI-verified trust score of ${data.trustScore}/100 based on multi-source analysis`
    },
    "author": {
      "@type": "Organization",
      "name": "VeriEdit AI",
      "url": "https://verieditai.com"
    },
    "datePublished": data.datePublished,
    "itemReviewed": {
      "@type": "Claim",
      "author": data.author ? {
        "@type": "Person",
        "name": data.author
      } : undefined,
      "datePublished": data.datePublished,
      "appearance": {
        "@type": "WebPage",
        "url": data.url
      }
    }
  };

  return JSON.stringify(schema);
}

export function generateArticleSchema(data: ArticleData): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": data.headline,
    "description": data.description,
    "url": data.url,
    "image": data.imageUrl,
    "datePublished": data.datePublished,
    "author": data.author ? {
      "@type": "Person",
      "name": data.author
    } : {
      "@type": "Organization",
      "name": "VeriEdit AI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "VeriEdit AI",
      "url": "https://verieditai.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://verieditai.com/logo.png"
      }
    }
  };

  // Add trust score if available
  if (data.trustScore !== undefined) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": data.trustScore,
      "bestRating": 100,
      "worstRating": 0,
      "ratingCount": 1
    };
  }

  return JSON.stringify(schema);
}

export function generateOrganizationSchema(data: OrganizationData): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.name,
    "description": data.description,
    "url": data.url,
    "logo": data.logo,
  };

  // Add verification badge if verified partner
  if (data.verifiedPartner) {
    schema["award"] = "VeriEdit AI Verified Partner";
  }

  // Add trust rating if available
  if (data.trustScore !== undefined) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": data.trustScore,
      "bestRating": 100,
      "worstRating": 0
    };
  }

  return JSON.stringify(schema);
}

/**
 * Injects JSON-LD structured data into the page
 */
export function injectStructuredData(jsonLd: string, id: string = 'structured-data') {
  // Remove existing script if present
  const existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.remove();
  }

  // Create and inject new script
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = jsonLd;
  document.head.appendChild(script);
}

/**
 * Remove structured data script from page
 */
export function removeStructuredData(id: string = 'structured-data') {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}
