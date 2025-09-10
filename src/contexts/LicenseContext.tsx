import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LicenseInfo {
  valid: boolean;
  license_type?: 'trial' | 'basic' | 'professional' | 'enterprise';
  status?: 'active' | 'expired' | 'suspended' | 'revoked';
  features?: Record<string, boolean>;
  max_usage?: number;
  current_usage?: number;
  expires_at?: string;
  reason?: string;
}

interface LicenseContextType {
  license: LicenseInfo | null;
  loading: boolean;
  refreshLicense: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
  incrementUsage: (amount?: number) => Promise<{ success: boolean; error?: string; limit?: number }>;
  getLicenseKey: () => Promise<string | null>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const validateLicense = async () => {
    if (!user) {
      setLicense(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('validate_license', {
        user_uuid: user.id
      });

      if (error) {
        console.error('License validation error:', error);
        setLicense({ valid: false, reason: 'validation_error' });
      } else {
        setLicense(data as unknown as LicenseInfo);
      }
    } catch (error) {
      console.error('License validation failed:', error);
      setLicense({ valid: false, reason: 'network_error' });
    } finally {
      setLoading(false);
    }
  };

  const refreshLicense = async () => {
    setLoading(true);
    await validateLicense();
  };

  const checkFeatureAccess = (feature: string): boolean => {
    if (!license?.valid) return false;
    return license.features?.[feature] || false;
  };

  const incrementUsage = async (amount: number = 1): Promise<{ success: boolean; error?: string; limit?: number }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.rpc('increment_license_usage', {
        user_uuid: user.id,
        amount
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh license after usage increment
      await validateLicense();

      return data as { success: boolean; error?: string; limit?: number };
    } catch (error) {
      console.error('Usage increment failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const getLicenseKey = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('license_key')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching license key:', error);
        return null;
      }

      return data?.license_key || null;
    } catch (error) {
      console.error('License key fetch failed:', error);
      return null;
    }
  };

  useEffect(() => {
    validateLicense();
  }, [user]);

  const value = {
    license,
    loading,
    refreshLicense,
    checkFeatureAccess,
    incrementUsage,
    getLicenseKey,
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};