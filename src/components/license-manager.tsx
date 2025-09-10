import React, { useState } from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';

export const LicenseManager: React.FC = () => {
  const { license, loading, refreshLicense, getLicenseKey } = useLicense();
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [loadingKey, setLoadingKey] = useState(false);
  const { toast } = useToast();

  const handleGetLicenseKey = async () => {
    setLoadingKey(true);
    try {
      const key = await getLicenseKey();
      setLicenseKey(key);
      setShowKey(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retrieve license key",
        variant: "destructive",
      });
    } finally {
      setLoadingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      toast({
        title: "Copied",
        description: "License key copied to clipboard",
      });
    }
  };

  const handleRefresh = async () => {
    await refreshLicense();
    toast({
      title: "Refreshed",
      description: "License information updated",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <CardDescription>Loading license information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* License Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>License Information</CardTitle>
              <CardDescription>
                View and manage your license details
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {license?.valid ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">License Type</Label>
                  <div className="mt-1">
                    <Badge variant="default">
                      {license.license_type?.charAt(0).toUpperCase() + license.license_type?.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={license.status === 'active' ? 'default' : 'destructive'}>
                      {license.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {license.max_usage && (
                <div>
                  <Label className="text-muted-foreground">Usage</Label>
                  <p className="mt-1 text-sm">
                    {license.current_usage} / {license.max_usage} used
                  </p>
                </div>
              )}

              {license.expires_at && (
                <div>
                  <Label className="text-muted-foreground">Expires</Label>
                  <p className="mt-1 text-sm">
                    {new Date(license.expires_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {license.features && Object.keys(license.features).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Features</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(license.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No valid license found</p>
              <Button 
                className="mt-4"
                onClick={() => window.location.href = '/billing'}
              >
                Get License
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Key Management */}
      {license?.valid && (
        <Card>
          <CardHeader>
            <CardTitle>License Key</CardTitle>
            <CardDescription>
              Your unique license key for API access and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!licenseKey ? (
              <Button 
                onClick={handleGetLicenseKey}
                disabled={loadingKey}
                className="gap-2"
              >
                {loadingKey ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {loadingKey ? 'Loading...' : 'Show License Key'}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={showKey ? licenseKey : '•'.repeat(licenseKey.length)}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep your license key secure. It provides access to your account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};