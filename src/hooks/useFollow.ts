import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (targetUserId: string | undefined, currentUserId: string | undefined) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    const checkFollowStatus = async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      setIsFollowing(!!data);
    };

    checkFollowStatus();

    // Real-time subscription
    const channel = supabase
      .channel('follow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${currentUserId}`,
        },
        () => {
          checkFollowStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, currentUserId]);

  const toggleFollow = async () => {
    if (!targetUserId || !currentUserId) return;
    if (targetUserId === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot follow yourself",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;

        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

        if (error) throw error;

        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }

      setIsFollowing(!isFollowing);
    } catch (error: any) {
      console.error('Follow error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, loading, toggleFollow };
};
