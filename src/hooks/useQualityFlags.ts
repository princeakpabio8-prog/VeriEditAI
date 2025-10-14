import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QualityFlag {
  id: string;
  flag_type: string;
  severity: string;
  details: any;
  auto_flagged: boolean;
  reviewed: boolean;
  created_at: string;
}

interface QualityStatus {
  has_flags: boolean;
  flag_count: number;
  critical_count: number;
  high_count: number;
  flags: Array<{
    type: string;
    severity: string;
    details: any;
    reviewed: boolean;
  }>;
}

export const useQualityFlags = (verificationId: string | null) => {
  const [qualityStatus, setQualityStatus] = useState<QualityStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!verificationId) return;

    const fetchQualityStatus = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_verification_quality_status', {
          verification_uuid: verificationId
        });

        if (error) throw error;
        if (data) {
          setQualityStatus(data as unknown as QualityStatus);
        }
      } catch (error) {
        console.error('Error fetching quality status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityStatus();
  }, [verificationId]);

  return { qualityStatus, loading };
};
