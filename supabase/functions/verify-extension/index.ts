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

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Hash the API key for lookup
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify API key
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !apiKeyRecord) {
      console.error('Invalid API key:', keyError);
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiKeyRecord.is_active) {
      return new Response(JSON.stringify({ error: 'API key is inactive' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'API key has expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last_used_at timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);

    // Check license/usage limits
    const { data: licenseData } = await supabase.rpc('validate_license', {
      user_uuid: apiKeyRecord.user_id
    });

    if (!licenseData || !licenseData.valid) {
      return new Response(JSON.stringify({ 
        error: 'License limit exceeded',
        message: 'Please upgrade your plan to continue using the extension' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call main verify function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
            userId: apiKeyRecord.user_id,
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

      // Return lightweight response optimized for extension
      return new Response(JSON.stringify({
        trustScore: result.trustScore || result.trust_score || 50,
        summary: result.summary || result.result_summary || 'Verification complete',
        status: result.status || 'completed',
        verificationId: result.verificationId || result.id,
        sources: (result.sources || []).slice(0, 3), // Limit to top 3 sources
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
