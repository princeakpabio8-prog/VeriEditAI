import React from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredLicense?: 'basic' | 'professional' | 'enterprise';
  showUpgrade?: boolean;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  requiredLicense,
  showUpgrade = true
}) => {
  const { license, checkFeatureAccess } = useLicense();
  const hasAccess = checkFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getRequiredLicenseInfo = () => {
    switch (requiredLicense) {
      case 'basic':
        return { name: 'Basic', icon: <Lock className="h-5 w-5" /> };
      case 'professional':
        return { name: 'Professional', icon: <Crown className="h-5 w-5" /> };
      case 'enterprise':
        return { name: 'Enterprise', icon: <Zap className="h-5 w-5" /> };
      default:
        return { name: 'Upgraded', icon: <Lock className="h-5 w-5" /> };
    }
  };

  const licenseInfo = getRequiredLicenseInfo();

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {licenseInfo.icon}
        </div>
        <CardTitle className="text-lg">
          {licenseInfo.name} Feature
        </CardTitle>
        <CardDescription>
          This feature requires a {licenseInfo.name.toLowerCase()} license or higher
        </CardDescription>
      </CardHeader>
      {showUpgrade && (
        <CardContent className="text-center">
          <Button 
            onClick={() => window.location.href = '/billing'}
            className="gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade License
          </Button>
        </CardContent>
      )}
    </Card>
  );
};