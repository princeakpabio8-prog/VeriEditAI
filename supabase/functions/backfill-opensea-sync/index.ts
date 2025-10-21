import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('🔄 Starting OpenSea backfill sync for user:', user.id)

    // Get all badges that haven't been refreshed or have failed refreshes
    const { data: badges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('id, token_id, opensea_refresh_count, opensea_last_refresh')
      .eq('user_id', user.id)
      .order('token_id', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch badges: ${fetchError.message}`)
    }

    if (!badges || badges.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No badges found to sync',
          synced: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📦 Found ${badges.length} badges to potentially sync`)

    const results = {
      total: badges.length,
      synced: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    // Process each badge with delay to avoid rate limiting
    for (const badge of badges) {
      try {
        // Skip if recently refreshed (within last hour)
        if (badge.opensea_last_refresh) {
          const lastRefresh = new Date(badge.opensea_last_refresh)
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
          if (lastRefresh > hourAgo) {
            console.log(`⏭️ Skipping token ${badge.token_id} - refreshed recently`)
            results.skipped++
            continue
          }
        }

        console.log(`🔄 Refreshing token ${badge.token_id}...`)

        const { data, error } = await supabase.functions.invoke('refresh-opensea-metadata', {
          body: { token_id: badge.token_id }
        })

        if (error) {
          console.error(`❌ Failed to refresh token ${badge.token_id}:`, error)
          results.failed++
          results.details.push({
            token_id: badge.token_id,
            status: 'failed',
            error: error.message
          })
        } else {
          console.log(`✅ Successfully refreshed token ${badge.token_id}`)
          results.synced++
          results.details.push({
            token_id: badge.token_id,
            status: 'success'
          })
        }

        // Add 2-second delay between requests to avoid rate limiting
        if (badges.indexOf(badge) < badges.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (err: any) {
        console.error(`❌ Error processing token ${badge.token_id}:`, err)
        results.failed++
        results.details.push({
          token_id: badge.token_id,
          status: 'error',
          error: err.message
        })
      }
    }

    console.log('🎉 Backfill complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${results.synced}/${results.total} badges`,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Backfill error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
