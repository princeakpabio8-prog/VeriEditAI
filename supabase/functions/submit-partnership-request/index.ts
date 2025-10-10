import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend for email notifications
const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

// Input validation schema
const partnershipSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  contact_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').trim(),
  contact_email: z.string().email('Invalid email address').max(255, 'Email too long').trim().toLowerCase(),
  contact_website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  message: z.string().max(2000, 'Message too long').trim().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate and sanitize input
    const rawData = await req.json();
    const validatedData = partnershipSchema.parse(rawData);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📧 Processing partnership request for org: ${validatedData.organization_id}`);

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', validatedData.organization_id)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    // Create partnership request with validated data
    const { data: request, error: requestError } = await supabase
      .from('partnership_requests')
      .insert({
        organization_id: validatedData.organization_id,
        contact_name: validatedData.contact_name,
        contact_email: validatedData.contact_email,
        contact_website: validatedData.contact_website,
        message: validatedData.message,
      })
      .select()
      .single();

    if (requestError) {
      console.error('❌ Failed to create request:', requestError);
      throw requestError;
    }

    // Send email notification (using Resend or similar)
    // For now, we'll log it - you can integrate Resend later
    const emailContent = `
New Partnership Request from ${org.name}

Organization: ${org.name}
Domain: ${org.domain}
Industry: ${org.industry}

Contact Information:
Name: ${validatedData.contact_name}
Email: ${validatedData.contact_email}
Website: ${validatedData.contact_website || 'Not provided'}

Message:
${validatedData.message || 'No message provided'}

Current Stats:
Trust Score: ${org.avg_trust_score}/100
Total Verifications: ${org.total_verifications}

View Profile: ${supabaseUrl}/lighthouse/organizations/${org.id}

---
Sent from VeriEdit Verification Partnership System
    `;

    console.log('📬 Sending email to hello@verieditai.com...');

    // Send email notification via Resend
    try {
      const { error: emailError } = await resend.emails.send({
        from: 'VeriEdit Partnerships <onboarding@resend.dev>',
        to: ['hello@verieditai.com'],
        subject: `New Partnership Request from ${org.name}`,
        text: emailContent,
      });

      if (emailError) {
        console.error('⚠️ Email failed to send:', emailError);
        // Don't throw - partnership request is saved, email is secondary
      } else {
        console.log('✅ Email sent successfully to hello@verieditai.com');
      }
    } catch (emailErr) {
      console.error('⚠️ Email sending exception:', emailErr);
      // Continue - the partnership request is already saved
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Partnership request submitted successfully',
        request_id: request.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Partnership request error:', error);
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
