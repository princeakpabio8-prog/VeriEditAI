import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔄 Starting trust analytics backfill...');

    // Step 1: Delete old analytics records
    const { error: deleteError } = await supabaseClient
      .from('trust_analytics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      throw deleteError;
    }

    console.log('✅ Cleared old analytics records');

    // Step 2: Trigger fresh aggregation by calling aggregate-trust-data
    const aggregateUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/aggregate-trust-data`;
    const aggregateResponse = await fetch(aggregateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!aggregateResponse.ok) {
      throw new Error(`Aggregation failed: ${await aggregateResponse.text()}`);
    }

    const aggregateResult = await aggregateResponse.json();
    console.log('✅ Fresh aggregation completed:', aggregateResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trust analytics backfilled successfully',
        aggregation_result: aggregateResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Backfill error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
