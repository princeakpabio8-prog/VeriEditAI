import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThreadAuthor {
  full_name: string | null;
}

interface LighthouseThread {
  id: string;
  room_id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string | null;
  status: string;
  trust_score: number | null;
  verification_id: string | null;
  is_auto_verified: boolean | null;
  view_count: number;
  comment_count: number;
  upvote_count: number;
  created_at: string;
  updated_at: string;
}

export function useLighthouseThreads(roomId: string) {
  const [threads, setThreads] = useState<LighthouseThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: threadsData, error: threadsError } = await supabase
        .from('room_threads')
        .select(`
          *,
          profiles!room_threads_author_id_fkey(full_name)
        `)
        .eq('room_id', roomId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (threadsError) throw threadsError;

      const formattedThreads = threadsData?.map((thread: any) => ({
        ...thread,
        author_name: thread.profiles?.full_name
      })) || [];

      setThreads(formattedThreads);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch threads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    
    fetchThreads();

    // Real-time subscription
    const channel = supabase
      .channel(`room-threads-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_threads',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const createThread = async (title: string, content: string, autoVerify: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: thread, error: threadError } = await supabase
        .from('room_threads')
        .insert({
          room_id: roomId,
          author_id: user.id,
          title,
          content,
          status: 'active'
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Auto-verification if requested
      if (autoVerify && thread) {
        try {
          const { data: verificationData } = await supabase.functions.invoke('verify', {
            body: {
              content,
              content_type: 'text'
            }
          });

          if (verificationData?.id) {
            await supabase
              .from('room_threads')
              .update({
                verification_id: verificationData.id,
                is_auto_verified: true,
                trust_score: verificationData.trust_score
              })
              .eq('id', thread.id);
          }
        } catch (verifyErr) {
          console.error('Auto-verification failed:', verifyErr);
        }
      }

      return thread;
    } catch (err) {
      console.error('Error creating thread:', err);
      throw err;
    }
  };

  return { threads, loading, error, refetch: fetchThreads, createThread };
}
