import React from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Shield, Clock, AlertTriangle, Crown, Zap } from 'lucide-react';

interface LicenseStatusProps {
  variant?: 'card' | 'inline';
  showActions?: boolean;
}

export const LicenseStatus: React.FC<LicenseStatusProps> = ({ 
  variant = 'card', 
  showActions = true 
}) => {
  const { license, loading } = useLicense();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
        <div className="h-2 bg-muted rounded w-24"></div>
      </div>
    );
  }

  if (!license?.valid) {
    return variant === 'card' ? (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">License Invalid</CardTitle>
          </div>
          <CardDescription>
            {license?.reason === 'no_valid_license' ? 'No valid license found' : 'License validation failed'}
          </CardDescription>
        </CardHeader>
        {showActions && (
          <CardContent>
            <Button variant="destructive" size="sm">
              Contact Support
            </Button>
          </CardContent>
        )}
      </Card>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Invalid License
      </Badge>
    );
  }

  const getLicenseIcon = () => {
    switch (license.license_type) {
      case 'trial':
        return <Clock className="h-4 w-4" />;
      case 'basic':
        return <Shield className="h-4 w-4" />;
      case 'professional':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Zap className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getLicenseColor = () => {
    switch (license.license_type) {
      case 'trial':
        return 'secondary';
      case 'basic':
        return 'default';
      case 'professional':
        return 'default';
      case 'enterprise':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getUsagePercentage = () => {
    if (!license.max_usage) return 0;
    return Math.min((license.current_usage || 0) / license.max_usage * 100, 100);
  };

  const isNearLimit = () => {
    if (!license.max_usage) return false;
    return getUsagePercentage() > 80;
  };

  const isExpiring = () => {
    if (!license.expires_at) return false;
    const expiryDate = new Date(license.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getLicenseColor() as any} className="gap-1">
          {getLicenseIcon()}
          {license.license_type?.charAt(0).toUpperCase() + license.license_type?.slice(1)}
        </Badge>
        {license.max_usage && (
          <span className={`text-sm ${isNearLimit() ? 'text-destructive' : 'text-muted-foreground'}`}>
            {license.current_usage}/{license.max_usage}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={`${isExpiring() || isNearLimit() ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getLicenseIcon()}
            <CardTitle className="text-lg">
              {license.license_type?.charAt(0).toUpperCase() + license.license_type?.slice(1)} License
            </CardTitle>
          </div>
          <Badge variant={license.status === 'active' ? 'default' : 'destructive'}>
            {license.status}
          </Badge>
        </div>
        <CardDescription>
          Your current license and usage information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Information */}
        {license.max_usage && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Plan Usage</span>
              <span className={isNearLimit() ? 'text-destructive font-medium' : ''}>
                {license.current_usage}/{license.max_usage}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage()} 
              className={`h-2 ${isNearLimit() ? '[&>div]:bg-destructive' : ''}`}
            />
            {isNearLimit() && (
              <p className="text-xs text-destructive">
                You're approaching your usage limit
              </p>
            )}
          </div>
        )}

        {/* Bonus Verifications */}
        {license.features?.bonus_verifications !== undefined && typeof license.features.bonus_verifications === 'number' && license.features.bonus_verifications > 0 && (
          <div className="space-y-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between text-sm">
              <span className="text-primary font-medium">🎁 Bonus Verifications</span>
              <span className="text-primary font-bold">
                +{license.features.bonus_verifications}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Earned from referrals! These are used first.
            </p>
          </div>
        )}

        {/* Expiry Information */}
        {license.expires_at && (
          <div className="text-sm">
            <span className="text-muted-foreground">Expires: </span>
            <span className={isExpiring() ? 'text-amber-600 font-medium' : ''}>
              {new Date(license.expires_at).toLocaleDateString()}
            </span>
            {isExpiring() && (
              <p className="text-xs text-amber-600 mt-1">
                License expires soon
              </p>
            )}
          </div>
        )}

        {/* Features */}
        {license.features && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Features</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(license.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (isExpiring() || isNearLimit() || license.license_type === 'trial') && (
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              variant={isExpiring() || isNearLimit() ? 'default' : 'outline'}
              onClick={() => window.location.href = '/billing'}
            >
              {license.license_type === 'trial' ? 'Upgrade License' : 'Manage License'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};