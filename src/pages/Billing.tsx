import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlutterwaveCheckout } from '@/components/flutterwave-checkout';
import { SubscriptionManager } from '@/components/subscription-manager';
import { Users, Crown, Zap, Shield, Star, CreditCard, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MobileOptimizedUI } from '@/components/mobile-optimized-ui';
import { useIsMobile } from '@/hooks/use-mobile';

const Billing = () => {
  const { user } = useAuth();
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchUsageStats();
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchUsageStats = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      setMonthlyUsage(count || 0);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('user_id', user?.id)
        .single();

      if (profile) {
        setSubscriptionStatus(profile.subscription_status || 'free');
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleUpgradeSuccess = async () => {
    // Force refresh data to reflect new subscription immediately
    await Promise.all([
      fetchUsageStats(),
      fetchSubscriptionStatus()
    ]);
    
    toast({
      title: "Upgrade Successful!",
      description: "Your subscription has been upgraded successfully. Welcome to VeriEdit AI Pro!",
    });
  };

  const getUsageLimit = () => {
    switch (subscriptionStatus) {
      case 'pro':
      case 'enterprise':
        return 'Unlimited';
      default:
        return '5';
    }
  };

  const getUsageDisplay = () => {
    const limit = getUsageLimit();
    if (limit === 'Unlimited') {
      return `${monthlyUsage} / Unlimited`;
    }
    return `${monthlyUsage} / ${limit}`;
  };

  const getStatusBadge = () => {
    const statusConfig = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-800', icon: Shield },
      pro: { label: 'Pro', color: 'bg-blue-100 text-blue-800', icon: Zap },
      enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800', icon: Crown }
    };

    const config = statusConfig[subscriptionStatus as keyof typeof statusConfig] || statusConfig.free;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const content = (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Billing & Subscriptions
            </h1>
            <p className="text-muted-foreground">
              Choose your plan and manage your subscription
            </p>
          </div>

          {/* Current Status Overview */}
          {user && (
            <Card className="bg-gradient-card border-border/50 mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                    {getStatusBadge()}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Usage This Month</p>
                    <p className="text-lg font-semibold">{getUsageDisplay()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
              <TabsTrigger value="manage">Manage Subscription</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-6">

              {user ? (
                <FlutterwaveCheckout onSuccess={handleUpgradeSuccess} />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please sign in to view and manage your subscription plans
                    </p>
                    <Button onClick={() => window.location.href = '/auth'}>
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              {user ? (
                <SubscriptionManager />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please sign in to manage your subscription
                    </p>
                    <Button onClick={() => window.location.href = '/auth'}>
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  );

  return isMobile ? (
    <MobileOptimizedUI>{content}</MobileOptimizedUI>
  ) : (
    content
  );
};

export default Billing;