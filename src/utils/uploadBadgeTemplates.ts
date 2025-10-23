import { supabase } from '@/integrations/supabase/client';

export async function uploadBadgeTemplates() {
  const badges = [
    { rarity: 'legendary', path: '/badges/legendary-badge.jpg' },
    { rarity: 'epic', path: '/badges/epic-badge.jpg' },
    { rarity: 'rare', path: '/badges/rare-badge.jpg' },
    { rarity: 'uncommon', path: '/badges/uncommon-badge.jpg' },
    { rarity: 'common', path: '/badges/common-badge.jpg' }
  ];

  const results = [];

  for (const badge of badges) {
    try {
      console.log(`🔄 Uploading ${badge.rarity} badge...`);
      
      // Fetch the badge image from public folder
      const response = await fetch(badge.path);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${badge.rarity}: ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = `${badge.rarity}-truth-badge.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('nft-badge-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '31536000' // Cache for 1 year (immutable template)
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('nft-badge-images')
        .getPublicUrl(fileName);

      // Verify upload by checking if image is accessible
      const verifyResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!verifyResponse.ok) {
        throw new Error(`Upload verification failed - image not accessible at ${urlData.publicUrl}`);
      }

      results.push({
        rarity: badge.rarity,
        success: true,
        url: urlData.publicUrl
      });

      console.log(`✅ Uploaded ${badge.rarity} badge:`, urlData.publicUrl);
    } catch (error: any) {
      console.error(`❌ Failed to upload ${badge.rarity}:`, error);
      results.push({
        rarity: badge.rarity,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Upload Summary: ${successCount}/${badges.length} badges uploaded`);
  
  return results;
}
