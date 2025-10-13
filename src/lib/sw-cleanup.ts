/**
 * Service Worker Cleanup Utility
 * Unregisters all service workers and clears all caches
 * to prevent stale bundle issues on mobile
 */

export const runSwCleanup = async (): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log(`🧹 Cleaning up ${registrations.length} service worker(s)...`);
        
        await Promise.all(
          registrations.map(reg => reg.unregister())
        );
        
        console.log('✅ All service workers unregistered');
      }
    }
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      if (cacheNames.length > 0) {
        console.log(`🗑️ Deleting ${cacheNames.length} cache(s)...`);
        
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
        
        console.log('✅ All caches cleared');
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✨ SW cleanup complete in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ SW cleanup failed:', error);
  }
};
