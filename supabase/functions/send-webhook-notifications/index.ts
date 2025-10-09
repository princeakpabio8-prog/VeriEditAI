import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event_type: 'misinformation_spike' | 'trust_score_drop' | 'weekly_brief_ready';
  data: any;
  triggered_at: string;
}

async function sendWebhook(url: string, payload: WebhookPayload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrustIntelligence-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: response.ok,
      status: response.status,
      url
    };
  } catch (error) {
    console.error(`Webhook delivery failed to ${url}:`, error);
    return {
      success: false,
      error: error.message,
      url
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type, threshold_config, data } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get enterprise customers with webhooks enabled
    const { data: webhookSubscribers, error: subError } = await supabase
      .from('api_keys')
      .select('user_id, metadata')
      .eq('is_active', true);

    if (subError) throw subError;

    const enterpriseWebhooks = webhookSubscribers
      ?.filter(sub => sub.metadata?.webhook_url && sub.metadata?.enterprise === true)
      .map(sub => ({
        userId: sub.user_id,
        webhookUrl: sub.metadata.webhook_url,
        alertThresholds: sub.metadata.alert_thresholds || {}
      })) || [];

    if (enterpriseWebhooks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active webhook subscribers', delivered: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build webhook payload
    const payload: WebhookPayload = {
      event_type,
      data,
      triggered_at: new Date().toISOString()
    };

    // Send webhooks in parallel
    const deliveryResults = await Promise.all(
      enterpriseWebhooks.map(webhook => sendWebhook(webhook.webhookUrl, payload))
    );

    const successCount = deliveryResults.filter(r => r.success).length;
    const failCount = deliveryResults.filter(r => !r.success).length;

    // Log webhook deliveries
    await supabase.from('aggregation_logs').insert({
      execution_status: failCount > 0 ? 'partial' : 'success',
      records_processed: successCount,
      metadata: {
        event_type,
        total_webhooks: enterpriseWebhooks.length,
        delivered: successCount,
        failed: failCount,
        results: deliveryResults
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        delivered: successCount,
        failed: failCount,
        total: enterpriseWebhooks.length,
        event_type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});