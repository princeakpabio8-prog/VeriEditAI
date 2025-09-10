import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, Download, Star, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscription_status: string;
  subscription_expires_at: string | null;
  payment_method: string | null;
}

interface Payment {
  id: string;
  plan_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_method: string | null;
}

export const SubscriptionManager = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch subscription status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at, payment_method')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      } else {
        setSubscription(profile);
      }

      // Fetch payment history
      const { data: paymentHistory, error: paymentsError } = await supabase
        .from('payments')
        .select('id, plan_type, amount, currency, status, created_at, payment_method')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentsError) {
        console.error('Payments fetch error:', paymentsError);
      } else {
        setPayments(paymentHistory || []);
      }
    } catch (error) {
      console.error('Subscription data fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const getPlanIcon = (status: string) => {
    switch (status) {
      case 'pro': return Zap;
      case 'enterprise': return Crown;
      default: return Star;
    }
  };

  const getPlanColor = (status: string) => {
    switch (status) {
      case 'pro': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    
    return colors[status as keyof typeof colors] || colors.free;
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PlanIcon = getPlanIcon(subscription?.subscription_status || 'free');

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${getPlanColor(subscription?.subscription_status || 'free')} flex items-center justify-center`}>
              <PlanIcon className="w-4 h-4 text-white" />
            </div>
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your VeriEdit AI subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getStatusBadge(subscription?.subscription_status || 'free')}>
                  {(subscription?.subscription_status || 'free').toUpperCase()}
                </Badge>
                {isExpiringSoon(subscription?.subscription_expires_at) && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Expires Soon
                  </Badge>
                )}
                {isExpired(subscription?.subscription_expires_at) && (
                  <Badge variant="destructive">
                    Expired
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription?.subscription_status === 'free' 
                  ? 'Free plan with limited features'
                  : `${subscription?.subscription_status === 'pro' ? 'Pro' : 'Enterprise'} plan`
                }
              </p>
            </div>
          </div>

          {subscription?.subscription_expires_at && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {isExpired(subscription.subscription_expires_at) 
                  ? `Expired on ${format(new Date(subscription.subscription_expires_at), 'PPP')}`
                  : `Renews on ${format(new Date(subscription.subscription_expires_at), 'PPP')}`
                }
              </span>
            </div>
          )}

          {subscription?.payment_method && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span>Payment method: {subscription.payment_method}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Your recent payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={payment.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {payment.plan_type.toUpperCase()}
                        </Badge>
                        <Badge 
                          variant={payment.status === 'successful' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), 'PPP')}
                      </p>
                      {payment.payment_method && (
                        <p className="text-xs text-muted-foreground">
                          via {payment.payment_method}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {payment.currency} {payment.amount}
                      </p>
                    </div>
                  </div>
                  {index < payments.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={fetchSubscriptionData}>
            <Download className="w-4 h-4 mr-2" />
            Refresh Subscription Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};