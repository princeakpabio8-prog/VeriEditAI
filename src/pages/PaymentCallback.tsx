import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const flwRef = searchParams.get('flw_ref');
      const statusParam = searchParams.get('status');

      if (!txRef || !user) {
        setStatus('error');
        setMessage('Missing payment information or user not authenticated');
        return;
      }

      try {
        if (statusParam === 'successful') {
          // Call our verification function (accept both transaction_id and flw_ref param names)
          const { data, error } = await supabase.functions.invoke('flutterwave-verify', {
            body: { 
              tx_ref: txRef, 
              flw_ref: flwRef || transactionId 
            }
          });

          if (error) throw error;

          if (data.success) {
            setStatus('success');
            setMessage(`Payment successful! Your ${data.plan} subscription is now active.`);
            
            toast({
              title: "Payment Successful!",
              description: `Welcome to VeriEdit AI ${data.plan}! Your subscription is now active.`,
            });
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          } else {
            throw new Error(data.error || 'Payment verification failed');
          }
        } else {
          setStatus('error');
          setMessage('Payment was not completed successfully');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred while verifying your payment');
        
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if your payment was successful.",
          variant: "destructive"
        });
      }
    };

    verifyPayment();
  }, [searchParams, user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  } as const;

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0
    }
  } as const;

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'error':
        return 'Payment Failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className={`${getStatusColor()} border-2 backdrop-blur-sm`}>
          <CardHeader className="text-center pb-4">
            <motion.div
              className="flex justify-center mb-4"
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              {getStatusIcon()}
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              {getStatusTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              {message || 'Please wait while we verify your payment...'}
            </p>

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    🎉 You now have access to all premium features!
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Redirecting to dashboard in 3 seconds...
                </p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Don't worry - if you were charged, we'll help you resolve this.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/billing')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Billing
              </Button>
              
              {status !== 'loading' && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}