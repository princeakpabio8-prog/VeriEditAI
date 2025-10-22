import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface LogActivityParams {
  activityType: 'verification_complete' | 'thread_created' | 'room_created' | 'room_joined' | 'comment_posted' | 'high_trust_score' | 'user_follow' | 'nft_mint' | 'wallet_connect' | 'badge_preview';
  entityId?: string;
  metadata?: {
    username?: string;
    full_name?: string;
    title?: string;
    room_name?: string;
    trust_score?: number;
    device_type?: 'mobile' | 'tablet' | 'desktop';
    wallet_address?: string;
    [key: string]: any;
  };
}

export function useActivityLogger() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username, full_name')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [user]);

  const logActivity = async ({ activityType, entityId, metadata = {} }: LogActivityParams) => {
    if (!user) return;

    try {
      // Add user info to metadata
      const enrichedMetadata = {
        ...metadata,
        username: userProfile?.username || metadata.username,
        full_name: userProfile?.full_name || metadata.full_name,
      };

      await supabase
        .from('activity_stream')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          entity_id: entityId,
          metadata: enrichedMetadata,
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
}
