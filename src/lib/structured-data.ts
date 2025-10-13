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

interface ActivityStreamData {
  activities: Array<{
    id: string;
    activityType: string;
    description: string;
    timestamp: string;
    userName?: string;
    url?: string;
  }>;
  totalActivities: number;
}

interface LighthouseHubData {
  verifiedArticles: number;
  organizations: number;
  activeRooms: number;
  communityMembers: number;
  url: string;
}

/**
 * Generate Schema.org structured data for Live Activity Stream
 */
export function generateActivityStreamSchema(data: ActivityStreamData): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Live Activity Stream - Truth Verification Activities",
    "description": "Real-time stream of verification activities, thread creations, and community engagement",
    "numberOfItems": data.totalActivities,
    "itemListElement": data.activities.map((activity, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Action",
        "name": activity.activityType,
        "description": activity.description,
        "startTime": activity.timestamp,
        "agent": activity.userName ? {
          "@type": "Person",
          "name": activity.userName
        } : undefined,
        "url": activity.url
      }
    }))
  };

  return JSON.stringify(schema);
}

/**
 * Generate Schema.org structured data for Lighthouse Hub
 */
export function generateLighthouseHubSchema(data: LighthouseHubData): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "The Lighthouse Hub - Truth Verification Platform",
    "description": `Central hub for truth verification and collaboration with ${data.verifiedArticles} verified articles, ${data.organizations} organizations, ${data.activeRooms} active rooms, and ${data.communityMembers} community members`,
    "url": data.url,
    "mainEntity": {
      "@type": "DiscussionForumPosting",
      "headline": "Real-Time Truth Verification Community",
      "text": "Collaborative platform for verifying claims, analyzing sources, and discovering verified information",
      "datePublished": new Date().toISOString(),
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/ReadAction",
          "userInteractionCount": data.verifiedArticles
        },
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/JoinAction",
          "userInteractionCount": data.communityMembers
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.8,
      "bestRating": 5,
      "worstRating": 1,
      "ratingCount": data.communityMembers
    }
  };

  return JSON.stringify(schema);
}
