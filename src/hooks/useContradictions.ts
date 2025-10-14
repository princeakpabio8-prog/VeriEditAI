import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Contradiction {
  id: string;
  claim_a: string;
  claim_b: string;
  relationship_type: 'supports' | 'contradicts' | 'related';
  confidence: number;
  reasoning: string;
  detected_at: string;
}

export const useContradictions = (verificationId: string | null) => {
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!verificationId) return;

    const fetchContradictions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('claim_relationships')
          .select('*')
          .or(`claim_a.eq.${verificationId},claim_b.eq.${verificationId}`)
          .eq('relationship_type', 'contradicts')
          .order('confidence', { ascending: false });

        if (error) throw error;
        setContradictions((data || []) as Contradiction[]);
      } catch (error) {
        console.error('Error fetching contradictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContradictions();
  }, [verificationId]);

  return { contradictions, loading };
};
