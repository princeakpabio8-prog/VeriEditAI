import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Hook to handle post-verification success feedback and navigation
 */
export function useVerificationSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user just completed a verification
    const verificationSuccess = sessionStorage.getItem('verification_completed');
    const viralClaimId = sessionStorage.getItem('verifying_claim_id');
    const source = sessionStorage.getItem('verification_source');

    if (verificationSuccess === 'true' && source === 'hot_claims') {
      // Clear the flags
      sessionStorage.removeItem('verification_completed');
      sessionStorage.removeItem('verifying_claim_id');
      sessionStorage.removeItem('verification_source');

      // Show celebration toast
      toast.success('🎉 Claim Verified Successfully!', {
        description: 'Your verification is now live. Check if you earned an NFT badge!',
        duration: 5000,
      });

      // Mark claim as verified by user
      if (viralClaimId) {
        const storedVerifications = localStorage.getItem('user_verified_claims');
        const verifiedClaims = storedVerifications ? JSON.parse(storedVerifications) : [];
        if (!verifiedClaims.includes(viralClaimId)) {
          verifiedClaims.push(viralClaimId);
          localStorage.setItem('user_verified_claims', JSON.stringify(verifiedClaims));
        }
      }

      // Navigate back to hot claims with success state
      setTimeout(() => {
        navigate('/viral-claims', { state: { scrollToVerified: viralClaimId } });
      }, 1500);
    }
  }, [navigate]);
}
