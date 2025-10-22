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
  return url.includes('nft-badge-template.png')
}

function isFallbackImage(url: string) {
  return url.includes('nft-badge-fallback.png')
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

        // Check cache first, but never serve cached template or fallback
        const cached = imageCache.get(metadataUri)
        if (cached && !isTemplateImage(cached) && !isFallbackImage(cached)) {
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

        // If it's a template, trigger AI generation and start polling
        if (isTemplateImage(meta.image)) {
          console.warn(`[NFT Image] ⚠️ Template detected for badge: ${badgeId}, triggering AI generation`)
          
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
                  console.log('[NFT Image] ✅ AI generation complete:', result.data)
                  // Start polling for the new image
                  pollForAIImage(0)
                }
              })
              .catch((err) => {
                console.error('[NFT Image] ❌ Invocation error:', err)
                if (!cancelled) {
                  setImageUrl(null)
                  setError('Failed to generate AI image')
                  setLoading(false)
                }
              })
            
            // Show fallback component while generating
            if (!cancelled) {
              setImageUrl(null)
              setError('Generating AI image...')
              setLoading(false)
            }
          } else {
            // No params to regenerate, show fallback
            if (!cancelled) {
              setImageUrl(null)
              setError('Template image - using fallback')
              setLoading(false)
            }
          }
          return
        }

        // If it's static fallback, start polling for AI image
        if (isFallbackImage(meta.image)) {
          console.log(`[NFT Image] 📦 Fallback detected, polling for AI image...`)
          pollForAIImage(pollingAttempts.get(metadataUri) || 0)
          
          if (!cancelled) {
            setImageUrl(null)
            setError('Loading AI-generated image...')
            setLoading(false)
          }
          return
        }

        // AI-generated image ready - verify and cache
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
