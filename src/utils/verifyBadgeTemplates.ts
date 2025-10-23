import { supabase } from '@/integrations/supabase/client';

export async function verifyBadgeTemplates() {
  const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  const results = [];

  for (const rarity of rarities) {
    try {
      const fileName = `${rarity}-truth-badge.jpg`;
      
      // Check if file exists in storage
      const { data: files, error: listError } = await supabase.storage
        .from('nft-badge-images')
        .list('', {
          search: fileName
        });

      if (listError) throw listError;

      const fileExists = files && files.some(f => f.name === fileName);

      if (!fileExists) {
        results.push({
          rarity,
          exists: false,
          accessible: false,
          error: 'File not found in storage'
        });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('nft-badge-images')
        .getPublicUrl(fileName);

      // Verify it's accessible
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      
      results.push({
        rarity,
        exists: true,
        accessible: response.ok,
        url: urlData.publicUrl,
        status: response.status
      });

    } catch (error: any) {
      results.push({
        rarity,
        exists: false,
        accessible: false,
        error: error.message
      });
    }
  }

  const allReady = results.every(r => r.exists && r.accessible);
  const readyCount = results.filter(r => r.exists && r.accessible).length;

  return {
    allReady,
    readyCount,
    totalCount: rarities.length,
    results
  };
}
