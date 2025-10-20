import { useState, useEffect } from 'react'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string | number }>
}

const imageCache = new Map<string, string>()

export function useNFTImage(metadataUri: string | null) {
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
          // Check if image URL is accessible
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
            console.warn('Image URL not accessible:', metadata.image)
            // Image exists in metadata but isn't accessible - fallback will be used
            setImageUrl(null)
            setError('Image not yet generated')
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
  }, [metadataUri])

  return { imageUrl, loading, error }
}
