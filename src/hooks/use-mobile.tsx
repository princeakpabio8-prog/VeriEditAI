import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Detect if device has touch capability
const hasTouchCapability = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Detect mobile device more reliably
const detectMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = (navigator?.userAgent ?? '').toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
  const hasTouch = hasTouchCapability();
  
  // Consider it mobile if: small screen OR (has touch AND mobile user agent)
  return isSmallScreen || (hasTouch && isMobileUA);
};

export function useIsMobile() {
  // Initialize with a safe default to prevent hydration mismatches
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return detectMobileDevice();
  });

  React.useEffect(() => {
    // Initial detection
    const updateMobileStatus = () => {
      setIsMobile(detectMobileDevice());
    };
    
    updateMobileStatus();

    // Listen for resize events with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateMobileStatus, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', updateMobileStatus);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateMobileStatus);
    };
  }, []);

  return isMobile;
}
