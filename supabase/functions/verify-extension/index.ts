import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optional: Check for API key to associate with user account
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 10) {
      const apiKey = authHeader.replace('Bearer ', '');
      
      // Hash the API key for lookup
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: apiKeyRecord } = await supabase
        .from('api_keys')
        .select('id, user_id, is_active')
        .eq('key_hash', keyHash)
        .single();

      if (apiKeyRecord?.is_active) {
        userId = apiKeyRecord.user_id;
        await supabase
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', apiKeyRecord.id);
      }
    }

    // Call main verify function
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const verifyResponse = await fetch(
        `${supabaseUrl}/functions/v1/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            content,
            userId: userId || 'anonymous-extension',
            contentType: 'text',
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text();
        console.error('Verify function error:', error);
        return new Response(JSON.stringify({ error: 'Verification failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await verifyResponse.json();

      return new Response(JSON.stringify({
        trustScore: result.trustScore || result.trust_score || 50,
        summary: result.summary || result.result_summary || 'Verification complete',
        status: result.status || 'completed',
        verificationId: result.verificationId || result.id,
        sources: (result.sources || []).slice(0, 3),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return new Response(JSON.stringify({ error: 'Verification timeout' }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Extension verify error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
