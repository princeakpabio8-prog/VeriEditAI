import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  fromCache: boolean;
}

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string | undefined>();
  const [sourceLanguage, setSourceLanguage] = useState<string | undefined>();
  const [translatedContent, setTranslatedContent] = useState<string | undefined>();

  const translateContent = async (
    text: string,
    targetLanguage: string,
    verificationId?: string
  ): Promise<TranslationResult | null> => {
    setIsTranslating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          targetLanguage,
          verificationId,
        },
      });

      if (error) throw error;

      if (data) {
        setCurrentLanguage(targetLanguage);
        setSourceLanguage(data.sourceLanguage);
        setTranslatedContent(data.translatedText);

        if (data.fromCache) {
          toast({
            title: "Translation loaded",
            description: "Retrieved from cache",
          });
        } else {
          toast({
            title: "Translation complete",
            description: `Translated from ${data.sourceLanguage.toUpperCase()} to ${targetLanguage.toUpperCase()}`,
          });
        }

        return data;
      }

      return null;
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "Failed to translate content",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const resetTranslation = () => {
    setCurrentLanguage(undefined);
    setSourceLanguage(undefined);
    setTranslatedContent(undefined);
  };

  return {
    translateContent,
    resetTranslation,
    isTranslating,
    currentLanguage,
    sourceLanguage,
    translatedContent,
  };
};
