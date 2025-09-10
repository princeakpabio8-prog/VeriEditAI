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

const Billing = () => {
  const { user } = useAuth();
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');

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

  const handleUpgradeSuccess = () => {
    fetchUsageStats();
    fetchSubscriptionStatus();
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        isAuthenticated={!!user} 
        user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} 
      />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              VeriEdit AI Billing & Subscriptions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your subscription, view usage, and upgrade your plan with secure Flutterwave payments
            </p>
          </div>

          {/* Current Status Overview */}
          {user && (
            <Card className="bg-gradient-card border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {getUsageDisplay()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Verifications this month
                    </p>
                  </div>
                  <div className="text-center">
                    {getStatusBadge()}
                    <p className="text-sm text-muted-foreground mt-1">
                      Current plan
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CreditCard className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Flutterwave Secure
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Payment processing
                    </p>
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
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Choose Your Plan
                </h2>
                <p className="text-muted-foreground">
                  Secure payments powered by Flutterwave - supporting cards, bank transfers, and crypto
                </p>
              </div>

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

              {/* Feature Comparison */}
              <div className="mt-12">
                <h3 className="text-xl font-bold text-center mb-6">Feature Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <CardTitle>Free</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Monthly verifications</span>
                        <span className="font-medium">5</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>PDF Export</span>
                        <span className="text-red-500">✗</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>API Access</span>
                        <span className="text-red-500">✗</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Priority Support</span>
                        <span className="text-red-500">✗</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary">
                    <CardHeader className="text-center">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <CardTitle>Pro - $10/month</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800">Most Popular</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Monthly verifications</span>
                        <span className="font-medium text-green-600">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>PDF Export</span>
                        <span className="text-green-500">✓</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>API Access</span>
                        <span className="text-red-500">✗</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Priority Support</span>
                        <span className="text-green-500">✓</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="text-center">
                      <Crown className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <CardTitle>Enterprise - $99/month</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Monthly verifications</span>
                        <span className="font-medium text-green-600">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>PDF Export</span>
                        <span className="text-green-500">✓</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>API Access</span>
                        <span className="text-green-500">✓</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Priority Support</span>
                        <span className="text-green-500">✓</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Methods Supported</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We support credit/debit cards, bank transfers, mobile money, and USDT cryptocurrency through Flutterwave's secure platform.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is my payment information secure?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes! We use Flutterwave's PCI DSS compliant platform. Your payment data is encrypted and never stored on our servers.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Absolutely! You can cancel your subscription at any time. You'll retain access until the end of your billing period.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Multi-currency support?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes, we support USD, NGN, GBP, and other major currencies through Flutterwave's global payment network.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;