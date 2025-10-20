import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string | number }>
}

const imageCache = new Map<string, string>()
const regenerationAttempted = new Set<string>()

export function useNFTImage(metadataUri: string | null, badgeId?: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!metadataUri) {
      setLoading(false)
      return
    }

    // Check cache first
    if (imageCache.has(metadataUri)) {
      setImageUrl(imageCache.get(metadataUri)!)
      setLoading(false)
      return
    }

    const fetchMetadata = async () => {
      try {
        setLoading(true)
        const response = await fetch(metadataUri)
        if (!response.ok) throw new Error('Failed to fetch metadata')
        
        const metadata: NFTMetadata = await response.json()
        
        if (metadata.image) {
          // Check if it's the broken template image
          const isTemplate = metadata.image.includes('nft-badge-template.png') || 
                            metadata.image.includes('nft-badge-fallback.png')
          
          if (isTemplate && badgeId && !regenerationAttempted.has(badgeId)) {
            // Trigger silent background regeneration
            regenerationAttempted.add(badgeId)
            
            const supabase = createClient(
              import.meta.env.VITE_SUPABASE_URL,
              import.meta.env.VITE_SUPABASE_ANON_KEY
            )
            
            // Silent background regeneration - no await
            supabase.functions.invoke('generate-nft-badge-image', {
              body: { badge_id: badgeId }
            }).catch(err => console.error('Silent regen failed:', err))
            
            // Show template for now
            imageCache.set(metadataUri, metadata.image)
            setImageUrl(metadata.image)
            setError(null)
          } else {
            // Normal flow - check if image is accessible
            try {
              const imageCheck = await fetch(metadata.image, { method: 'HEAD' })
              if (imageCheck.ok) {
                imageCache.set(metadataUri, metadata.image)
                setImageUrl(metadata.image)
                setError(null)
              } else {
                throw new Error('Image not accessible')
              }
            } catch (imgErr) {
              setImageUrl(null)
              setError('Image not yet generated')
            }
          }
        } else {
          throw new Error('No image in metadata')
        }
      } catch (err) {
        console.error('Error fetching NFT metadata:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setImageUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [metadataUri, badgeId])

  return { imageUrl, loading, error }
}
