import { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Button } from '@/components/ui/button';

// Extend window interface for Flutterwave
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}
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
}

const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    currency: 'USD',
    description: 'Perfect for professionals and small teams',
    icon: Zap,
    popular: true,
    features: [
      'Unlimited verifications',
      'PDF export functionality',
      'Advanced analytics',
      'Bulk operations',
      'Email support',
      'Priority processing'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'USD',
    description: 'Advanced features for organizations',
    icon: Crown,
    features: [
      'Everything in Pro',
      'API access',
      'Priority support',
      'Custom integrations',
      'Advanced reporting',
      'Dedicated account manager',
      'SLA guarantee'
    ]
  }
];

interface FlutterwaveCheckoutProps {
  onSuccess?: () => void;
}

export const FlutterwaveCheckout = ({ onSuccess }: FlutterwaveCheckoutProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const generateTxRef = () => `veri_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createPaymentRecord = async (plan: Plan, txRef: string) => {
    const { error } = await supabase
      .from('payments')
      .insert({
        user_id: user!.id,
        tx_ref: txRef,
        plan_type: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending'
      });

    if (error) {
      console.error('Payment record creation error:', error);
      throw new Error('Failed to create payment record');
    }
  };

  const verifyPayment = async (txRef: string, flwRef: string) => {
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

  const useFlutterwaveConfig = (plan: Plan) => {
    const txRef = generateTxRef();
    
    return useFlutterwave({
      public_key: "FLWPUBK_TEST-SANDBOXDEMOKEY-X", // This will be replaced with actual key
      tx_ref: txRef,
      amount: plan.price,
      currency: plan.currency,
      payment_options: "card,banktransfer,ussd,qr,crypto",
      customer: {
        email: user?.email || '',
        phone_number: '',
        name: user?.email || ''
      },
      customizations: {
        title: `VeriEdit AI - ${plan.name} Plan`,
        description: `Upgrade to ${plan.name} plan`,
        logo: "https://assets.flutterwave.com/flutterwave-circle-blue.png"
      },
      meta: {
        plan_id: plan.id,
        user_id: user?.id
      },
    });
  };

  const handleFlutterPayment = (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your plan",
        variant: "destructive"
      });
      return;
    }

    setLoading(plan.id);
    const txRef = generateTxRef();

    const config = {
      public_key: "FLWPUBK_TEST-SANDBOXDEMOKEY-X", // This will be replaced with actual key
      tx_ref: txRef,
      amount: plan.price,
      currency: plan.currency,
      payment_options: "card,banktransfer,ussd,qr,crypto",
      customer: {
        email: user.email || '',
        phone_number: '',
        name: user.email || ''
      },
      customizations: {
        title: `VeriEdit AI - ${plan.name} Plan`,
        description: `Upgrade to ${plan.name} plan`,
        logo: "https://assets.flutterwave.com/flutterwave-circle-blue.png"
      },
      meta: {
        plan_id: plan.id,
        user_id: user.id
      },
      callback: async (response: any) => {
        console.log('Payment response:', response);
        closePaymentModal();
        
        if (response.status === "successful") {
          try {
            // Create payment record first
            await createPaymentRecord(plan, txRef);
            
            // Verify payment
            const verificationResult = await verifyPayment(txRef, response.flw_ref);
            
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
      onClose: () => {
        console.log('Payment modal closed');
        setLoading(null);
      }
    };

    // Create payment record before opening modal
    createPaymentRecord(plan, txRef)
      .then(() => {
        // Use direct FlutterwaveButton integration instead
        if (window.FlutterwaveCheckout) {
          window.FlutterwaveCheckout(config);
        } else {
          // Fallback to script loading
          const script = document.createElement('script');
          script.src = 'https://checkout.flutterwave.com/v3.js';
          script.onload = () => {
            if (window.FlutterwaveCheckout) {
              window.FlutterwaveCheckout(config);
            }
          };
          document.head.appendChild(script);
        }
      })
      .catch((error) => {
        console.error('Failed to create payment record:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
        setLoading(null);
      });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleFlutterPayment(plan)}
                disabled={loading === plan.id}
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Processing...
                  </>
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};