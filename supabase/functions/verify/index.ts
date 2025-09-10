import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for user authentication
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Create service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user using auth client
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseAuth.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile (must exist - created by AuthContext)
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_tier, monthly_usage')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile not found for user:', user.id, profileError);
      return new Response(
        JSON.stringify({ 
          error: "User profile not found. Please refresh the page and try again.",
          profile_missing: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const subscriptionTier = profileData?.subscription_tier || 'free';
    const monthlyUsage = profileData?.monthly_usage || 0;

    // Enforce usage limits for free tier
    if (subscriptionTier === 'free' && monthlyUsage >= 5) {
      return new Response(
        JSON.stringify({ 
          error: "Monthly verification limit reached. Upgrade to Pro for unlimited verifications.",
          limit_reached: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    const { content, contentType = 'text' } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: "Content is required and must be a string",
          validation_error: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!['text', 'url'].includes(contentType)) {
      return new Response(
        JSON.stringify({ 
          error: "Content type must be 'text' or 'url'",
          validation_error: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing verification for user ${user.id}`);

    // Insert verification record
    const { data: verification, error: insertError } = await supabaseClient
      .from('verifications')
      .insert({
        user_id: user.id,
        content: content,
        content_type: contentType,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting verification:', insertError);
      throw insertError;
    }

    console.log(`Created verification ${verification.id}`);

    // Simulate AI processing (in production, this would call actual AI services)
    const processingStartTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock analysis results
    const trustScore = Math.floor(Math.random() * 100);
    const processingTime = Date.now() - processingStartTime;
    
    let status = 'completed';
    let summary = '';
    
    if (trustScore >= 80) {
      status = 'completed';
      summary = `High confidence verification complete. Content appears to be accurate based on multiple reliable sources. Trust score: ${trustScore}%.`;
    } else if (trustScore >= 50) {
      status = 'completed';
      summary = `Moderate confidence verification complete. Some claims require additional verification. Several sources found but with conflicting information. Trust score: ${trustScore}%.`;
    } else {
      status = 'failed';
      summary = `Low confidence. Content contains potentially misleading information or lacks sufficient supporting evidence. Trust score: ${trustScore}%.`;
    }

    // Update verification with results
    const { error: updateError } = await supabaseClient
      .from('verifications')
      .update({
        status: status,
        trust_score: trustScore,
        result_summary: summary,
        processing_time_ms: processingTime,
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      throw updateError;
    }

    // Insert mock sources
    const mockSources = [
      {
        verification_id: verification.id,
        url: 'https://example.com/source1',
        title: 'Primary Source Documentation',
        content_snippet: 'Supporting evidence found in official documentation...',
        reliability_score: Math.floor(Math.random() * 20) + 80,
      },
      {
        verification_id: verification.id,
        url: 'https://example.com/source2',
        title: 'Secondary Analysis',
        content_snippet: 'Cross-reference analysis confirms initial findings...',
        reliability_score: Math.floor(Math.random() * 30) + 70,
      },
    ];

    await supabaseClient
      .from('sources')
      .insert(mockSources);

    // Log the completion
    await supabaseClient
      .from('verification_logs')
      .insert({
        verification_id: verification.id,
        step: 'verification_complete',
        status: 'success',
        details: {
          trust_score: trustScore,
          processing_time_ms: processingTime,
          sources_found: mockSources.length,
        },
      });

    // Update monthly usage count
    await supabaseClient
      .from('profiles')
      .update({ 
        monthly_usage: monthlyUsage + 1 
      })
      .eq('user_id', user.id);

    // Also update subscribers table if it exists
    await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email,
        monthly_usage: monthlyUsage + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    console.log(`Verification ${verification.id} completed with score ${trustScore}`);

    return new Response(
      JSON.stringify({
        verification_id: verification.id,
        trust_score: trustScore,
        status: status,
        summary: summary,
        processing_time_ms: processingTime,
        sources: mockSources,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});