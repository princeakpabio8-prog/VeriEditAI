import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLogger } from './useActivityLogger';
import { useAuth } from '@/contexts/AuthContext';

interface LighthouseRoom {
  id: string;
  name: string;
  description: string | null;
  room_type: string;
  category: string;
  member_count: number;
  thread_count: number;
  trust_rating: number;
  created_at: string;
}

export function useLighthouseRooms(category?: string, roomType: 'public' | 'workspace' | 'all' = 'all') {
  const [rooms, setRooms] = useState<LighthouseRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, [category, roomType]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('lighthouse_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category as any);
      }

      if (roomType !== 'all') {
        query = query.eq('room_type', roomType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  return { rooms, loading, refetch: fetchRooms };
}
