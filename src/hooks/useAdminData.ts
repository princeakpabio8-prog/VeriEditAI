import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminData = () => {
  const { user } = useAuth();

  // Check if user is admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch subscribers (only if admin)
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  return {
    subscribers,
    isLoading,
    isAdmin,
  };
};
