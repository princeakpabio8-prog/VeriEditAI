import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useWorkspace() {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspaceId(null);
      setLoading(false);
      return;
    }

    ensureWorkspace();
  }, [user]);

  const ensureWorkspace = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Call the database function to ensure workspace exists
      const { data, error } = await supabase
        .rpc('ensure_user_workspace');

      if (error) {
        console.error('Error ensuring workspace:', error);
        return;
      }

      setWorkspaceId(data);
    } catch (error) {
      console.error('Error in ensureWorkspace:', error);
    } finally {
      setLoading(false);
    }
  };

  return { workspaceId, loading, refetch: ensureWorkspace };
}
