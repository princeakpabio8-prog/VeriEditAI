# Hot Claims Carousel - Image System

## Overview
The Hot Claims Carousel now features 100% visual engagement with images on every card, eliminating text-only fallbacks that increase bounce rate.

## Image Sources (Priority Order)

### 1. **Original Content Images** (Highest Priority)
- RSS feed images extracted from news articles
- YouTube thumbnails from video claims
- Social media post images
- Stored in `viral_claims.image_url`

### 2. **AI-Generated Images** (High-Engagement Claims)
- Auto-generated for EPIC and LEGENDARY tier claims (engagement > 10,000)
- Uses existing `generate-claim-image` edge function
- Triggered automatically for new high-value claims
- Stored in `viral_claims.image_url` after generation

### 3. **Enhanced Visual Fallbacks** (All Other Claims)
- Rich gradient backgrounds based on rarity tier:
  - **LEGENDARY**: Divine Gold (amber → yellow → orange)
  - **EPIC**: Purple-Pink (purple → fuchsia → pink)
  - **RARE**: Electric Blue (cyan → blue → indigo)
  - **UNCOMMON**: Green-Gold (emerald → teal → green)
  - **COMMON**: Silver (slate)
- Large platform icons (𝕏, 🔴, ▶️, etc.)
- Animated floating particles
- Shimmer effects
- Dynamic text overlay with claim headline
- Engagement score display

## Image Extraction Process

### RSS Feed Enhancement (`fetch-rss-news`)
Extracts images from multiple sources:
1. **Open Graph meta tags** (`og:image`)
2. **Twitter Card images** (`twitter:image`)
3. **Media RSS tags** (`media:thumbnail`, `media:content`, `media:group`)
4. **Enclosure tags** (image/* types)
5. **HTML img tags** (srcset, src, data-src)

### Image Proxy
All external images route through `image-proxy` edge function for:
- CORS handling
- Size validation (max 10MB)
- Format verification
- Performance optimization

## Automatic Image Enrichment

### Background Job (`enrich-claim-images`)
- **Trigger**: Can be called manually or scheduled
- **Purpose**: Backfills images for claims that lack them
- **Process**:
  1. Queries `viral_claims` where `image_url IS NULL`
  2. Limits to top 10 by engagement score
  3. Calls `generate-claim-image` for each
  4. Updates `viral_claims.image_url`
- **Rate Limiting**: 1 second delay between generations

### Auto-Generation (Frontend)
- Enabled in `HotClaimsWidget.tsx`
- Only generates for:
  - Claims without images
  - Engagement score > 10,000
  - Rarity tier: EPIC or LEGENDARY
- Prevents duplicate generation attempts

## Component Structure

### ClaimImageFallback Component
**Location**: `src/components/viral/ClaimImageFallback.tsx`

**Features**:
- Responsive aspect ratio (16:9)
- Multi-layer gradient backgrounds
- Animated floating particles
- Large watermark platform icon
- Rarity badges with gradients
- Race-to-verify badge (for #1 claim)
- Rank indicator (🥇🥈🥉 or #N)
- Engagement score display
- Hover glow effects

**Props**:
```typescript
{
  claimText: string;        // Claim headline
  platform: string;         // Platform name (Twitter, Reddit, etc.)
  rarityTier: string;       // LEGENDARY, EPIC, RARE, UNCOMMON, COMMON
  engagementScore: number;  // Total engagement count
  rank?: number;            // Position in carousel (1-based)
  showRaceBadge?: boolean;  // Show "RACE TO VERIFY" badge
}
```

### HotClaimsCarousel Component
**Location**: `src/components/viral/HotClaimsCarousel.tsx`

Uses Embla Carousel for smooth sliding:
- Touch/swipe support
- Navigation arrows
- Dot indicators
- Responsive design

## Edge Functions

### 1. `generate-claim-image`
Generates AI images for claims:
- Input: `claim_text`, `viral_claim_id`
- Output: `image_url` (Supabase Storage URL)
- Uses Lovable AI image generation
- Stores in `public-images` bucket

### 2. `enrich-claim-images`
Batch enrichment job:
- Fetches claims without images
- Generates images for top 10
- Updates database
- Returns processing stats

### 3. `fetch-rss-news`
Enhanced RSS parser:
- Multi-source image extraction
- Open Graph support
- Stores in `news_feed.image_url`

### 4. `image-proxy`
Image CDN/proxy:
- CORS handling
- Size validation
- Format checks
- Caching headers

## Usage

### Manual Enrichment
Call the edge function to backfill images:
```typescript
const { data, error } = await supabase.functions.invoke('enrich-claim-images');
// Returns: { processed: 5, failed: 0, total: 5 }
```

### Automatic Generation
Already enabled for high-engagement claims in `HotClaimsWidget`:
```typescript
// Auto-generates for EPIC+ claims with score > 10,000
useEffect(() => {
  hotClaims.forEach((claim) => {
    const shouldGenerate = !claim.image_url && 
                          claim.engagement_score > 10000 &&
                          (claim.rarity_tier === 'EPIC' || claim.rarity_tier === 'LEGENDARY');
    if (shouldGenerate) generateClaimImage(claim);
  });
}, [hotClaims]);
```

## Performance Optimizations

1. **Lazy Loading**: All carousel images use `loading="lazy"`
2. **Aspect Ratio Lock**: 16:9 prevents layout shift
3. **Max Height**: 300px caps image size
4. **Fallback Handling**: Instant fallback on image load errors
5. **Caching**: Generated images stored permanently
6. **Rate Limiting**: 1s delay between generation requests

## Design System Integration

All fallback colors use semantic HSL tokens:
```css
--gradient-hero: linear-gradient(135deg, hsl(195 100% 50% / 0.1), hsl(180 100% 25% / 0.2));
```

Animations defined in `index.css`:
- `float-particles`: Floating particle animation
- `claim-fallback-shimmer`: Shimmer effect
- Both use CSS custom properties for smooth performance

## Testing

### Check Image Coverage
```sql
SELECT 
  COUNT(*) as total,
  COUNT(image_url) as with_images,
  COUNT(*) - COUNT(image_url) as without_images
FROM viral_claims
WHERE status IN ('detected', 'trending', 'monitoring');
```

### Trigger Enrichment
```typescript
// In browser console
await supabase.functions.invoke('enrich-claim-images')
```

## Future Enhancements

1. **Stock Photo Integration**: Use Unsplash/Pexels APIs for free stock photos
2. **Scheduled Enrichment**: Cron job to auto-enrich daily
3. **Image Optimization**: WebP conversion, compression
4. **A/B Testing**: Track engagement metrics with/without images
5. **User Uploads**: Allow users to suggest better images
