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
    const verificationId = sessionStorage.getItem('verification_id');
    const trustScore = sessionStorage.getItem('verification_trust_score');
    const source = sessionStorage.getItem('verification_source');

    if (verificationSuccess === 'true' && source === 'hot_claims' && viralClaimId) {
      // Clear the flags
      sessionStorage.removeItem('verification_completed');
      sessionStorage.removeItem('verifying_claim_id');
      sessionStorage.removeItem('verification_id');
      sessionStorage.removeItem('verification_trust_score');
      sessionStorage.removeItem('verification_source');

      // Mark claim as verified by user (store with verification details)
      const storedVerifications = localStorage.getItem('user_verified_claims');
      const verifiedClaims = storedVerifications ? JSON.parse(storedVerifications) : {};
      verifiedClaims[viralClaimId] = {
        verificationId,
        trustScore: trustScore ? parseInt(trustScore) : 0,
        timestamp: Date.now()
      };
      localStorage.setItem('user_verified_claims', JSON.stringify(verifiedClaims));

      // Show celebration toast with NFT eligibility - mobile optimized
      const score = trustScore ? parseInt(trustScore) : 0;
      if (score >= 75) {
        toast.success('🎉 Claim Verified! NFT Badge Eligible!', {
          description: '💎 Trust score qualifies for NFT minting! Redirecting to Hot Claims...',
          duration: 3000,
          action: {
            label: 'View Now',
            onClick: () => {
              navigate('/viral-claims', { 
                state: { 
                  scrollToVerified: viralClaimId,
                  justVerified: true,
                  showNFTPrompt: true
                } 
              });
            }
          }
        });
      } else {
        toast.success('✅ Claim Verified Successfully!', {
          description: `Trust score: ${score}%. Need 75%+ for NFT minting. Redirecting...`,
          duration: 3000,
        });
      }

      // Navigate back to hot claims with success state - reduced delay for mobile
      setTimeout(() => {
        navigate('/viral-claims', { 
          state: { 
            scrollToVerified: viralClaimId,
            justVerified: true,
            showNFTPrompt: score >= 75
          } 
        });
      }, 1000); // Faster redirect for mobile users
    }
  }, [navigate]);
}
