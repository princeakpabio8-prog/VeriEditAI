import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { closePaymentModal } from 'flutterwave-react-v3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Plan {
  id: 'pro' | 'enterprise';
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
  billing?: 'monthly' | 'yearly';
}

const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    currency: 'USD',
    description: 'Perfect for professionals and small teams',
    icon: Zap,
    popular: true,
    features: [
      'Unlimited verifications',
      'PDF export functionality',
      'Advanced analytics',
      'Bulk operations',
      'Priority email support',
      'API rate limiting: 1000/day'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 200,
    currency: 'USD',
    description: 'Advanced features for organizations',
    icon: Crown,
    billing: 'yearly',
    features: [
      'Everything in Pro',
      'Unlimited API access',
      'Priority support & SLA',
      'Custom integrations',
      'Advanced reporting',
      'Dedicated account manager',
      'White-label options'
    ]
  }
];

interface FlutterwaveCheckoutProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: any) => void;
  }
}

export const FlutterwaveCheckout = ({ onSuccess }: FlutterwaveCheckoutProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [flutterwaveReady, setFlutterwaveReady] = useState(false);

  // Preload and warm up Flutterwave script to reduce perceived latency
  useEffect(() => {
    // Add preconnect hints
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://checkout.flutterwave.com';
    document.head.appendChild(preconnect);

    // Preload script
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'script';
    preload.href = 'https://checkout.flutterwave.com/v3.js';
    preload.crossOrigin = 'anonymous';
    document.head.appendChild(preload);

    // Load the script early so the modal opens instantly on click
    const scriptId = 'flutterwave-v3-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://checkout.flutterwave.com/v3.js';
      s.async = true;
      s.defer = true;
      s.onload = () => setFlutterwaveReady(true);
      s.onerror = () => setFlutterwaveReady(false);
      document.head.appendChild(s);
    } else {
      setFlutterwaveReady(true);
    }

    return () => {
      // Keep script cached; no cleanup to preserve speed between navigations
    };
  }, []);

  const createPaymentRecord = async (plan: Plan, txRef: string) => {
    const { error } = await supabase
      .from('payments')
      .insert({
        user_id: user!.id,
        tx_ref: txRef,
        plan: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending'
      });

    if (error) {
      console.error('Payment record creation error:', error);
      throw new Error('Failed to create payment record');
    }
  };

  const verifyPayment = async (txRef: string, flwRef?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('flutterwave-verify', {
        body: { tx_ref: txRef, flw_ref: flwRef }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  const handleFlutterPayment = async (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your plan",
        variant: "destructive"
      });
      return;
    }

    if (!flutterwaveReady || !window.FlutterwaveCheckout) {
      toast({
        title: "Payment System Loading",
        description: "Please wait a moment and try again",
        variant: "destructive"
      });
      return;
    }

    setLoading(plan.id);

    try {
      // Check for existing pending payments
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan', plan.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      // If there's a recent pending payment (within last 5 minutes), don't create a new one
      if (existingPayments && existingPayments.length > 0) {
        const lastPayment = existingPayments[0];
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const paymentTime = new Date(lastPayment.created_at);

        if (paymentTime > fiveMinutesAgo) {
          toast({
            title: "Payment in Progress",
            description: "You already have a pending payment. Please wait or check your payment status.",
            variant: "destructive",
          });
          setLoading(null);
          return;
        }
      }

      const txRef = `${user.id}_${Date.now()}`;

      // Create payment record first
      await createPaymentRecord(plan, txRef);

      // Build config object for FlutterwaveCheckout
      const flutterwaveConfig = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK_TEST-SANDBOXDEMOKEY-X",
        tx_ref: txRef,
        amount: plan.price,
        currency: plan.currency,
        payment_options: "card,ussd,banktransfer,crypto",
        customer: {
          email: user.email || '',
          phone_number: '',
          name: user.email?.split('@')[0] || 'VeriEdit User'
        },
        customizations: {
          title: `VeriEdit AI - ${plan.name} Plan`,
          description: `Subscribe to ${plan.name} plan - ${plan.billing === 'yearly' ? 'Annual' : 'Monthly'} billing`,
          logo: "https://verieditai.com/logo.png"
        },
        redirect_url: `${window.location.origin}/payment-callback`,
        meta: {
          plan_id: plan.id,
          user_id: user.id,
          billing_cycle: plan.billing || 'monthly'
        },
        callback: async (response: any) => {
          console.log('Payment response:', response);
          closePaymentModal();

          if (response.status === "successful") {
            try {
              const verificationResult = await verifyPayment(txRef, response.flw_ref || response.transaction_id);

              if (verificationResult.success) {
                toast({
                  title: "Payment Successful!",
                  description: `You've successfully upgraded to ${plan.name} plan`,
                });
                onSuccess?.();
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              console.error('Payment processing error:', error);
              toast({
                title: "Payment Processing Error",
                description: "There was an issue processing your payment. Please contact support.",
                variant: "destructive"
              });
            }
          } else {
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again.",
              variant: "destructive"
            });
          }
          setLoading(null);
        },
        onclose: () => {
          console.log('Payment modal closed');
          setLoading(null);
        }
      };

      // Open modal using global FlutterwaveCheckout
      window.FlutterwaveCheckout(flutterwaveConfig);

    } catch (error) {
      console.error('Failed to initialize payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: plan.id === 'pro' ? 0.1 : 0.2 }}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Card className={`relative overflow-hidden transition-all duration-300 ${
              plan.popular
                ? 'border-2 border-gradient-to-r from-blue-500 to-teal-500 shadow-xl shadow-blue-500/25'
                : 'border border-border/50 hover:border-primary/50'
            } bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm hover:shadow-lg`}>

              {plan.popular && (
                <motion.div
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Badge className="bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0 shadow-lg">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </motion.div>
              )}

              <CardHeader className="text-center pb-6">
                <motion.div
                  className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 5 }}
                >
                  <Icon className="w-8 h-8 text-primary" />
                </motion.div>

                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>

                <div className="mt-6">
                  <motion.div
                    className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    ${plan.price}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">
                    /{plan.billing || 'month'}
                  </div>
                  {plan.billing === 'yearly' && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Save 50% with annual billing
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className={`w-full relative overflow-hidden transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/80'
                    }`}
                    size="lg"
                    onClick={() => handleFlutterPayment(plan)}
                    disabled={loading === plan.id || !flutterwaveReady}
                  >
                    {loading === plan.id ? (
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Processing...
                      </motion.div>
                    ) : (
                      <>
                        {!flutterwaveReady ? (
                          <motion.div
                            className="flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            Preparing checkout...
                          </motion.div>
                        ) : (
                          <>
                            <motion.span
                              className="relative z-10"
                              whileHover={{ scale: 1.05 }}
                            >
                              Subscribe to {plan.name}
                            </motion.span>
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '100%' }}
                              transition={{ duration: 0.6 }}
                            />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
