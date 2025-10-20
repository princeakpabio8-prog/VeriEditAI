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
    
    console.log('📉 Starting price decay update for unsold listings...')
    
    // Get all active listings older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: oldListings, error: fetchError } = await supabase
      .from('nft_marketplace_listings')
      .select('id, token_id, listing_price, created_at')
      .eq('is_active', true)
      .lt('created_at', sevenDaysAgo.toISOString())
    
    if (fetchError) {
      console.error('Error fetching listings:', fetchError)
      throw fetchError
    }
    
    if (!oldListings || oldListings.length === 0) {
      console.log('✅ No listings need price updates')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: 0,
          message: 'No listings older than 7 days found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`📋 Found ${oldListings.length} listings to update`)
    
    let updated = 0
    let errors = 0
    
    // Apply 10% price decay per week
    for (const listing of oldListings) {
      const weeksOld = Math.floor(
        (Date.now() - new Date(listing.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      
      // Calculate decayed price (10% per week, minimum 50% of original)
      const decayFactor = Math.max(0.5, 1 - (weeksOld * 0.1))
      const newPrice = listing.listing_price * decayFactor
      
      // Only update if price actually changed (avoid rounding issues)
      if (Math.abs(newPrice - listing.listing_price) > 0.01) {
        const { error: updateError } = await supabase
          .from('nft_marketplace_listings')
          .update({ 
            listing_price: newPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.id)
        
        if (updateError) {
          console.error(`Error updating listing ${listing.token_id}:`, updateError)
          errors++
        } else {
          console.log(`💰 Token #${listing.token_id}: ${listing.listing_price.toFixed(2)} → ${newPrice.toFixed(2)} MATIC`)
          updated++
        }
      }
    }
    
    console.log(`✅ Price decay complete: ${updated} updated, ${errors} errors`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        updated,
        errors,
        totalProcessed: oldListings.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('Price decay error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})