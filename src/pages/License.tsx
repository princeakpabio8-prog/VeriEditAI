import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/ui/navigation';
import { LicenseManager } from '@/components/license-manager';
import { LicenseStatus } from '@/components/license-status';
import { FeatureGuard } from '@/components/feature-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Zap, Check, X } from 'lucide-react';

const License = () => {
  const { user } = useAuth();

  const licenseFeatures = {
    trial: {
      name: 'Trial',
      icon: <Shield className="h-5 w-5" />,
      price: 'Free',
      duration: '30 days',
      features: {
        'Verification': true,
        'Bulk Verification': false,
        'API Access': false,
        'Premium Analysis': false,
        'Export Reports': false,
        'Priority Support': false,
      },
      usage: '20 verifications'
    },
    basic: {
      name: 'Basic',
      icon: <Shield className="h-5 w-5" />,
      price: '$9.99/month',
      duration: 'Monthly',
      features: {
        'Verification': true,
        'Bulk Verification': true,
        'API Access': false,
        'Premium Analysis': false,
        'Export Reports': true,
        'Priority Support': false,
      },
      usage: '500 verifications'
    },
    professional: {
      name: 'Professional',
      icon: <Crown className="h-5 w-5" />,
      price: '$29.99/month',
      duration: 'Monthly',
      features: {
        'Verification': true,
        'Bulk Verification': true,
        'API Access': true,
        'Premium Analysis': true,
        'Export Reports': true,
        'Priority Support': true,
      },
      usage: '2000 verifications'
    },
    enterprise: {
      name: 'Enterprise',
      icon: <Zap className="h-5 w-5" />,
      price: 'Custom',
      duration: 'Contact us',
      features: {
        'Verification': true,
        'Bulk Verification': true,
        'API Access': true,
        'Premium Analysis': true,
        'Export Reports': true,
        'Priority Support': true,
        'Custom Integration': true,
        'Dedicated Support': true,
      },
      usage: 'Unlimited'
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            License Management
          </h1>
          <p className="text-muted-foreground">
            Manage your license and view available features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current License Status */}
          <div className="lg:col-span-1">
            <LicenseStatus variant="card" />
          </div>

          {/* License Manager */}
          <div className="lg:col-span-2">
            <LicenseManager />
          </div>
        </div>

        {/* License Plans Comparison */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Available License Plans</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(licenseFeatures).map(([key, plan]) => (
              <Card key={key} className={`relative ${key === 'professional' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                {key === 'professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold text-primary">{plan.price}</div>
                  <CardDescription>{plan.duration}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">Usage Limit</div>
                    <div className="text-lg font-semibold">{plan.usage}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Features:</div>
                    {Object.entries(plan.features).map(([feature, included]) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        {included ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={included ? 'text-foreground' : 'text-muted-foreground'}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Protected Features Demo */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Feature Access Control</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureGuard 
              feature="bulk_verification" 
              requiredLicense="basic"
              fallback={
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Bulk Verification
                    </CardTitle>
                    <CardDescription>
                      Process multiple files at once (Basic license required)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This feature is locked. Upgrade to Basic or higher to access bulk verification.
                    </p>
                  </CardContent>
                </Card>
              }
            >
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Bulk Verification
                  </CardTitle>
                  <CardDescription>
                    Process multiple files at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You have access to bulk verification features.
                  </p>
                </CardContent>
              </Card>
            </FeatureGuard>

            <FeatureGuard 
              feature="api_access" 
              requiredLicense="professional"
              fallback={
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      API Access
                    </CardTitle>
                    <CardDescription>
                      Integrate with your applications (Professional license required)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This feature is locked. Upgrade to Professional or higher to access API features.
                    </p>
                  </CardContent>
                </Card>
              }
            >
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    API Access
                  </CardTitle>
                  <CardDescription>
                    Integrate with your applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You have access to our API for custom integrations.
                  </p>
                </CardContent>
              </Card>
            </FeatureGuard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default License;