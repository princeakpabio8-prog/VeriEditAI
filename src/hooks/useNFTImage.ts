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

function isTemplateImage(url: string) {
  return url.includes('nft-badge-template.png') || url.includes('nft-badge-fallback.png')
}

const POLL_DELAYS_MS = [5000, 15000, 45000]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function useNFTImage(metadataUri: string | null, badgeId?: string, claimText?: string, trustScore?: number, rarityTier?: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        if (!metadataUri) {
          if (!cancelled) setLoading(false)
          return
        }

        // Check cache first, but never serve cached template
        const cached = imageCache.get(metadataUri)
        if (cached && !isTemplateImage(cached)) {
          if (!cancelled) {
            setImageUrl(cached)
            setLoading(false)
          }
          return
        }

        const fetchAndParse = async (): Promise<NFTMetadata | null> => {
          const resp = await fetch(metadataUri)
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

        const meta = await fetchAndParse()
        if (!meta?.image) throw new Error('No image in metadata')

        if (isTemplateImage(meta.image)) {
          console.warn(`[NFT Image] ⚠️ Template detected for badge: ${badgeId}, using static fallback`)
          
          // Trigger AI generation if params available
          if (badgeId && claimText && trustScore !== undefined && rarityTier && !regenerationAttempted.has(badgeId)) {
            regenerationAttempted.add(badgeId)
            console.log(`[NFT Image] 🎨 Triggering AI generation for badge ${badgeId}`)
            
            supabase.functions
              .invoke('generate-nft-badge-image', { 
                body: { 
                  badge_id: badgeId,
                  claim_text: claimText,
                  trust_score: trustScore,
                  rarity_tier: rarityTier
                } 
              })
              .then((result) => {
                if (result.error) {
                  console.error('[NFT Image] ❌ AI generation failed:', result.error)
                } else {
                  console.log('[NFT Image] ✅ AI generation triggered:', result.data)
                }
              })
              .catch((err) => console.error('[NFT Image] ❌ Invocation error:', err))
          }

          // Don't show template, force fallback component to render
          if (!cancelled) {
            setImageUrl(null)
            setError('Template image - using fallback')
            setLoading(false)
          }
          return
        }

        // Non-template: verify accessible, then cache
        if (await headOk(meta.image)) {
          imageCache.set(metadataUri, meta.image)
          if (!cancelled) {
            setImageUrl(meta.image)
            setError(null)
          }
        } else {
          if (!cancelled) {
            setImageUrl(null)
            setError('Image not yet generated')
          }
        }
      } catch (err) {
        console.error('❌ Error fetching NFT metadata:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setImageUrl(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [metadataUri, badgeId, claimText, trustScore, rarityTier])

  return { imageUrl, loading, error }
}
