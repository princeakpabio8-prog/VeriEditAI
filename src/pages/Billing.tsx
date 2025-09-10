import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/ui/navigation';
import { Check, Crown, Zap, Shield, Users, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsageStats();
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

  const handleUpgrade = async (plan: string) => {
    setLoading(true);
    
    try {
      // In a real app, this would integrate with Stripe
      toast({
        title: "Coming Soon",
        description: "Stripe integration will be available soon!",
      });
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: "Error",
        description: "Failed to process upgrade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '5 verifications per month',
        'Basic trust scoring',
        'Email support',
        'Standard response time'
      ],
      icon: Shield,
      current: true,
      buttonText: 'Current Plan',
      buttonVariant: 'outline' as const,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For professionals and small teams',
      features: [
        'Unlimited verifications',
        'Advanced AI analysis',
        'Priority support',
        'API access',
        'Custom integrations',
        'Advanced analytics'
      ],
      icon: Zap,
      popular: true,
      current: false,
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'default' as const,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Custom deployment',
        'Dedicated support',
        'SLA guarantees',
        'Custom training',
        'White-label options'
      ],
      icon: Crown,
      current: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
    },
  ];

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
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scale your content verification with plans designed for every need
            </p>
          </div>

          {/* Current Usage */}
          {user && (
            <Card className="bg-gradient-card border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Your Current Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {monthlyUsage} / 5
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Verifications this month
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((monthlyUsage / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative bg-gradient-card border-border/50 ${
                    plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                    
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.period}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-trust-high flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      variant={plan.buttonVariant}
                      className="w-full"
                      disabled={plan.current || loading}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {loading ? "Processing..." : plan.buttonText}
                    </Button>
                    
                    {plan.current && (
                      <p className="text-xs text-center text-muted-foreground">
                        Your current plan
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-gradient-card border-border/50 text-left">
                <CardHeader>
                  <CardTitle className="text-lg">
                    What happens if I exceed my limit?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Free users are limited to 5 verifications per month. Pro users have unlimited access.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border/50 text-left">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Can I cancel anytime?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border/50 text-left">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Is my data secure?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We use enterprise-grade security and never store your content permanently. All data is encrypted in transit and at rest.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border/50 text-left">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Do you offer refunds?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
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