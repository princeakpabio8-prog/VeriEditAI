import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notifyRoomMembersNewThread, notifyThreadVerified } from '@/lib/notification-helpers';
import { useActivityLogger } from './useActivityLogger';

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
  const { logActivity } = useActivityLogger();

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch threads without embed
      const { data: threadsData, error: threadsError } = await supabase
        .from('room_threads')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Fetch author profiles separately
      const authorIds = Array.from(new Set((threadsData || []).map((t: any) => t.author_id)));
      let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', authorIds);
        
        profilesMap = new Map((profilesData || []).map((p: any) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]));
      }

      // Merge author names and avatars into threads
      const formattedThreads = (threadsData || []).map((thread: any) => ({
        ...thread,
        author_name: profilesMap.get(thread.author_id)?.full_name ?? null,
        author_avatar: profilesMap.get(thread.author_id)?.avatar_url ?? null
      }));

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

      // Notify room members about new thread
      if (thread) {
        await notifyRoomMembersNewThread(roomId, thread.id, title, user.id);
        
        // Log activity to live stream
        await logActivity({
          activityType: 'thread_created',
          entityId: thread.id,
          metadata: { title },
        });
      }

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

            // Notify author about verification
            if (verificationData.trust_score) {
              await notifyThreadVerified(
                thread.id,
                roomId,
                user.id,
                verificationData.trust_score,
                verificationData.trust_score >= 80 // Featured if trust score >= 80
              );
            }
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

  const deleteThread = async (threadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('room_threads')
        .delete()
        .eq('id', threadId)
        .eq('author_id', user.id);

      if (error) throw error;
      
      // Also try deleting as room owner
      if (error) {
        const { error: ownerError } = await supabase
          .from('room_threads')
          .delete()
          .eq('id', threadId);
        if (ownerError) throw ownerError;
      }

      await fetchThreads();
    } catch (err) {
      console.error('Error deleting thread:', err);
      throw err;
    }
  };

  return { threads, loading, error, refetch: fetchThreads, createThread, deleteThread };
}
