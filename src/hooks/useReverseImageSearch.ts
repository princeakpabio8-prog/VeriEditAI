import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReverseImageSearch = (verificationId: string | null) => {
  return useQuery({
    queryKey: ['reverse-image-search', verificationId],
    queryFn: async () => {
      if (!verificationId) return null;
      
      const { data, error } = await supabase
        .from('image_reverse_search_results')
        .select('*')
        .eq('verification_id', verificationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!verificationId,
  });
};
