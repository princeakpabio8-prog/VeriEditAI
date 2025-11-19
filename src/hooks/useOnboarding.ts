import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedOnboarding } from '@/components/UnifiedOnboarding';

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkOnboardingStatus = async () => {
      // Check if onboarding is complete
      const onboardingComplete = localStorage.getItem(`onboarding_complete_${user.id}`);
      
      if (!onboardingComplete) {
        // Check if user has any verifications
        const { count } = await supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Show onboarding if no verifications
        if (count === 0) {
          setShowOnboarding(true);
        }
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    completeOnboarding,
  };
}
