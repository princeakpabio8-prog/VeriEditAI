import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Fetch the badge image from the public folder
    const imageResponse = await fetch('https://sqtkkzdswxazyikcheds.supabase.co/storage/v1/object/public/public/nft-badge-template.png')
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch badge image')
    }
    
    const imageBlob = await imageResponse.blob()
    
    // Upload to nft-badge-images bucket
    const { data, error } = await supabase.storage
      .from('nft-badge-images')
      .upload('truth-badge-template.png', imageBlob, {
        contentType: 'image/png',
        upsert: true
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('nft-badge-images')
      .getPublicUrl('truth-badge-template.png')
    
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl.publicUrl,
        message: 'Badge image uploaded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
