import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string | number }>
}

const imageCache = new Map<string, string>()
const regenerationAttempted = new Set<string>()
const pollingAttempts = new Map<string, number>()

function isTemplateImage(url: string) {
  // Legacy template check - these are OLD templates before Canva
  return url.includes('truth-badge-template.png') || url.includes('nft-badge-template.png')
}

function isFallbackImage(url: string) {
  return url.includes('nft-badge-fallback.png') || url.includes('lovableproject.com/nft-badge-fallback.png')
}

function isCanvaTemplate(url: string) {
  // NEW: Check if it's one of our Canva rarity templates
  return /\/(legendary|epic|rare|uncommon|common)-truth-badge\.jpg$/i.test(url)
}


const POLL_DELAYS_MS = [3000, 5000, 8000, 12000, 15000]
const MAX_POLL_ATTEMPTS = 5
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function useNFTImage(
  metadataUri: string | null, 
  badgeId?: string, 
  claimText?: string, 
  trustScore?: number, 
  rarityTier?: string,
  isVisible: boolean = true // Only fetch/poll when badge is visible
) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip loading if not visible (virtualized scrolling)
    if (!isVisible) {
      setLoading(false);
      return;
    }

    let cancelled = false
    let pollTimer: NodeJS.Timeout | null = null

    const run = async () => {
      try {
        if (!metadataUri) {
          if (!cancelled) setLoading(false)
          return
        }

        // Check cache first, but never serve cached template or fallback (legacy only)
        const cached = imageCache.get(metadataUri)
        if (cached && !isTemplateImage(cached) && !isFallbackImage(cached)) {
          if (!cancelled) {
            setImageUrl(cached)
            setLoading(false)
          }
          return
        }

        // Canva templates are final - cache them too!
        if (cached && isCanvaTemplate(cached)) {
          if (!cancelled) {
            setImageUrl(cached)
            setLoading(false)
          }
          return
        }

        const fetchAndParse = async (): Promise<NFTMetadata | null> => {
          const resp = await fetch(metadataUri, { cache: 'no-cache' })
          if (!resp.ok) throw new Error('Failed to fetch metadata')
          return (await resp.json()) as NFTMetadata
        }

        const headOk = async (url: string, retries = 2) => {
          for (let i = 0; i < retries; i++) {
            try {
              const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' })
              if (res.ok) return true
              await sleep(1000 * (i + 1))
            } catch (e) {
              if (i === retries - 1) return false
              await sleep(1000 * (i + 1))
            }
          }
          return false
        }

        const pollForAIImage = async (attemptNum: number = 0): Promise<void> => {
          if (cancelled || attemptNum >= MAX_POLL_ATTEMPTS) {
            if (attemptNum >= MAX_POLL_ATTEMPTS) {
              console.warn(`[NFT Image] ⏱️ Polling timeout after ${MAX_POLL_ATTEMPTS} attempts`)
              if (!cancelled) {
                setImageUrl(null)
                setError('AI generation in progress - refresh to check')
                setLoading(false)
              }
            }
            return
          }

          const meta = await fetchAndParse()
          if (!meta?.image) throw new Error('No image in metadata')

          // Check if AI-generated image is ready (not template, not fallback)
          if (!isTemplateImage(meta.image) && !isFallbackImage(meta.image)) {
            // Verify the image is actually accessible
            if (await headOk(meta.image)) {
              console.log(`[NFT Image] ✅ AI-generated image ready after ${attemptNum} polls`)
              imageCache.set(metadataUri, meta.image)
              pollingAttempts.delete(metadataUri)
              
              if (!cancelled) {
                setImageUrl(meta.image)
                setError(null)
                setLoading(false)
                
                // Trigger OpenSea metadata refresh
                if (badgeId) {
                  console.log('[NFT Image] 🔄 Triggering OpenSea metadata refresh')
                  supabase.functions
                    .invoke('refresh-opensea-metadata', {
                      body: { token_id: badgeId }
                    })
                    .catch(err => console.warn('[NFT Image] OpenSea refresh error:', err))
                }
              }
              return
            }
          }

          // Still template or fallback - continue polling
          const delay = POLL_DELAYS_MS[Math.min(attemptNum, POLL_DELAYS_MS.length - 1)]
          console.log(`[NFT Image] 🔄 Poll attempt ${attemptNum + 1}/${MAX_POLL_ATTEMPTS}, waiting ${delay}ms...`)
          
          pollingAttempts.set(metadataUri, attemptNum + 1)
          pollTimer = setTimeout(() => pollForAIImage(attemptNum + 1), delay)
        }

        const meta = await fetchAndParse()
        if (!meta?.image) throw new Error('No image in metadata')

        // Check if it's a rarity-based template image (our new Canva templates)
        const isRarityTemplate = /\/(legendary|epic|rare|uncommon|common)-truth-badge\.jpg$/i.test(meta.image)
        
        // If it's a rarity-based template, it's the final image - use it directly
        if (isRarityTemplate) {
          console.log(`[NFT Image] ✅ Using Canva template image: ${meta.image}`)
          if (await headOk(meta.image)) {
            imageCache.set(metadataUri, meta.image)
            if (!cancelled) {
              setImageUrl(meta.image)
              setError(null)
              setLoading(false)
              
              // Trigger OpenSea metadata refresh
              if (badgeId) {
                console.log('[NFT Image] 🔄 Triggering OpenSea metadata refresh')
                supabase.functions
                  .invoke('refresh-opensea-metadata', {
                    body: { token_id: badgeId }
                  })
                  .catch(err => console.warn('[NFT Image] OpenSea refresh error:', err))
              }
            }
          } else {
            if (!cancelled) {
              setImageUrl(null)
              setError('Image not accessible')
              setLoading(false)
            }
          }
          return
        }

        // If it's an old template (legacy), DO NOT trigger AI generation - these are deprecated
        if (isTemplateImage(meta.image)) {
          console.warn(`[NFT Image] ⚠️ Legacy template detected - this badge was minted before Canva templates`)
          
          if (!cancelled) {
            setImageUrl(null)
            setError('Legacy badge - using fallback')
            setLoading(false)
          }
          return
        }

        // Legacy fallback handling - DO NOT regenerate for old badges
        if (isFallbackImage(meta.image)) {
          console.log(`[NFT Image] 📦 Legacy fallback image - badge minted before Canva templates`)

          if (!cancelled) {
            setImageUrl(null)
            setError('Legacy badge - using fallback')
            setLoading(false)
          }
          return
        }

        // Final image (AI-generated or Canva template) - verify and cache
        if (await headOk(meta.image)) {
          imageCache.set(metadataUri, meta.image)
          if (!cancelled) {
            setImageUrl(meta.image)
            setError(null)
            setLoading(false)
          }
        } else {
          if (!cancelled) {
            setImageUrl(null)
            setError('Image not accessible')
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('❌ Error fetching NFT metadata:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setImageUrl(null)
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [metadataUri, badgeId, claimText, trustScore, rarityTier, isVisible])

  return { imageUrl, loading, error }
}
