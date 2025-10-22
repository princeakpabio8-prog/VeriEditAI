import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to handle post-verification success feedback and navigation
 */
export function useVerificationSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user just completed a verification
    const verificationSuccess = sessionStorage.getItem('verification_completed');
    const viralClaimId = sessionStorage.getItem('verifying_claim_id');
    const verificationId = sessionStorage.getItem('verification_id');
    const trustScore = sessionStorage.getItem('verification_trust_score');
    const source = sessionStorage.getItem('verification_source');

    if (verificationSuccess === 'true' && source === 'hot_claims' && viralClaimId) {
      // Clear the flags IMMEDIATELY to prevent re-triggering
      sessionStorage.removeItem('verification_completed');
      sessionStorage.removeItem('verifying_claim_id');
      sessionStorage.removeItem('verification_id');
      sessionStorage.removeItem('verification_trust_score');
      sessionStorage.removeItem('verification_source');
      
      // Check if we've already shown the prompt for this verification
      const shownPrompts = sessionStorage.getItem('shown_nft_prompts') || '';
      if (shownPrompts.includes(viralClaimId)) {
        console.log('NFT prompt already shown for this claim, skipping');
        return;
      }
      
      // Mark this prompt as shown
      sessionStorage.setItem('shown_nft_prompts', shownPrompts + ',' + viralClaimId);

      // Mark claim as verified by user (store with verification details)
      const storedVerifications = localStorage.getItem('user_verified_claims');
      const verifiedClaims = storedVerifications ? JSON.parse(storedVerifications) : {};
      verifiedClaims[viralClaimId] = {
        verificationId,
        trustScore: trustScore ? parseInt(trustScore) : 0,
        timestamp: Date.now()
      };
      localStorage.setItem('user_verified_claims', JSON.stringify(verifiedClaims));

      // Navigate back to hot claims - NFT modal will show there
      const score = trustScore ? parseInt(trustScore) : 0;
      navigate('/viral-claims', { 
        state: { 
          scrollToVerified: viralClaimId,
          justVerified: true,
          showNFTPrompt: score >= 70
        } 
      });
    }
  }, [navigate]);
}
