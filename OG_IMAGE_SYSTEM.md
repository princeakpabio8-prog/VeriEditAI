# Open Graph Image Generation

## Overview

The app automatically generates beautiful, branded Open Graph (OG) images for social media sharing. These images are displayed when users share verification links on platforms like Twitter, Facebook, LinkedIn, and WhatsApp.

## Features

- **Auto-generated Images**: OG images are automatically created when sharing verification results
- **Trust Score Display**: Large, color-coded trust score (green for high, orange for medium, red for low)
- **Claim Preview**: Shows the claim text being fact-checked
- **Branding**: Includes VeriedIT AI branding and visual identity
- **Social Optimization**: 1200x630px images optimized for all major social platforms

## How It Works

1. When a user shares a verification, the `useOGImage` hook automatically generates an OG image
2. The image is created by the `generate-og-image` edge function using the OG Edge library
3. Images are stored in the `og-images` Supabase storage bucket
4. The image URL is added to the page's meta tags via `DynamicMeta` component
5. Social platforms fetch and display the image when links are shared

## Image Elements

Each OG image includes:
- **Header Badge**: "✓ Verified" or "🔥 TRENDING" for viral claims
- **Trust Score Card**: Large percentage display with color coding
- **Content Preview**: First 100 characters of the claim
- **Branding Footer**: "AI-Powered Truth Verification" and "veried.it"
- **Gradient Background**: Color-coded based on trust score

## Color Coding

- **Green Gradient** (70%+): High trust score - verified content
- **Orange Gradient** (40-69%): Medium trust score - disputed content
- **Red Gradient** (<40%): Low trust score - debunked content
- **Blue Gradient**: Default for non-scored content

## Usage

### In Components

```tsx
import { useOGImage } from '@/hooks/useOGImage';

function MyComponent() {
  const { imageUrl, generating } = useOGImage({
    contentType: 'verification',
    title: 'Claim text here',
    trustScore: 85,
    content: 'Full claim content',
    status: 'verified'
  });

  // Use imageUrl in DynamicMeta or social share buttons
}
```

### In Share Pages

The `DynamicMeta` component automatically includes the OG image:

```tsx
<DynamicMeta
  title="Fact-Check Result"
  description="AI-verified claim"
  image={ogImageUrl}
  url={shareUrl}
  trustScore={85}
/>
```

## Social Media Preview

When shared on social platforms, users will see:
- **Twitter/X**: Large image card with trust score and claim preview
- **Facebook**: Rich preview with image, title, and description
- **LinkedIn**: Professional card layout with verification badge
- **WhatsApp**: Image thumbnail with shareable link

## Storage

OG images are stored in Supabase Storage:
- Bucket: `og-images`
- Format: PNG (optimal quality and compatibility)
- Cache: 24 hours
- Public access: Yes (needed for social platforms to fetch)

## Performance

- Images are generated once and cached
- Lazy generation: Only created when actually needed
- Async generation: Doesn't block UI
- Fallback: App works fine if generation fails

## Supported Content Types

1. **verification**: Fact-check results with trust scores
2. **thread**: Discussion threads (future)
3. **viral_claim**: Trending claims with engagement metrics

## Technical Details

- **Library**: [@deno/og_edge](https://deno.land/x/og_edge)
- **Image Size**: 1200x630px (optimal for all platforms)
- **Format**: PNG
- **Generation**: Server-side (Supabase Edge Function)
- **Storage**: Supabase Storage bucket

## Future Enhancements

- [ ] Custom templates per verification type
- [ ] User-customizable branding
- [ ] Multiple language support
- [ ] Video preview generation
- [ ] Animated GIF support
