import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OGImageOptions {
  contentType: 'verification' | 'thread' | 'viral_claim';
  title: string;
  trustScore?: number;
  content?: string;
  author?: string;
  platform?: string;
  engagementScore?: number;
  status?: string;
}

export function useOGImage(options: OGImageOptions | null, autoGenerate = true) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options || !autoGenerate || generating || imageUrl) return;

    const generateImage = async () => {
      setGenerating(true);
      setError(null);

      try {
        console.log('Generating OG image:', options);
        
        const { data, error: invokeError } = await supabase.functions.invoke('generate-og-image', {
          body: options
        });

        if (invokeError) {
          throw invokeError;
        }

        if (data?.imageUrl) {
          console.log('OG image generated successfully:', data.imageUrl);
          setImageUrl(data.imageUrl);
        } else {
          throw new Error('No image URL returned');
        }
      } catch (err: any) {
        console.error('Failed to generate OG image:', err);
        setError(err.message || 'Failed to generate image');
      } finally {
        setGenerating(false);
      }
    };

    generateImage();
  }, [options, autoGenerate, generating, imageUrl]);

  const regenerate = async () => {
    if (!options) return;
    
    setImageUrl(null);
    setGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-og-image', {
        body: options
      });

      if (invokeError) throw invokeError;
      
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  return {
    imageUrl,
    generating,
    error,
    regenerate
  };
}
