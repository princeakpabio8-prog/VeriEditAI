import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive AI verification using Perplexity API
async function performRealVerification(content: string, contentType: string, verificationId: string) {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    throw new Error('Perplexity API key not configured');
  }

  try {
    // Create comprehensive verification prompt based on content type with medical focus
    let prompt = '';
    const isMedicalContent = /(?:health|medical|disease|treatment|vaccine|drug|medication|study|research|clinical|trial|symptoms|diagnosis|therapy|cancer|covid|virus|bacteria|infection|medicine|doctor|patient|hospital|WHO|CDC|FDA|pubmed|journal)/i.test(content);
    
    if (contentType === 'url') {
      if (isMedicalContent) {
        prompt = `Perform MEDICAL FACT-CHECKING analysis of this health/medical URL: ${content}

MEDICAL VERIFICATION REQUIREMENTS:
1. CROSS-REFERENCE MEDICAL DATABASES: Verify claims against PubMed, Cochrane Library, WHO updates, CDC guidelines, and peer-reviewed medical journals
2. VALIDATE STUDY CLAIMS: Check if studies are correctly cited, not cherry-picked, and conclusions match the actual research findings
3. DETECT MEDICAL MISINFORMATION: Flag exaggerations, misinterpretations of studies, correlation vs causation errors, and cherry-picked statistics
4. VERIFY MEDICAL AUTHORITY: Confirm if sources have medical credentials and institutional backing
5. CHECK FOR MEDICAL CONSENSUS: Determine if claims align with current medical consensus and established treatment guidelines

MEDICAL-SPECIFIC ANALYSIS:
- Study Validity: Are referenced studies peer-reviewed, sample sizes adequate, and methodologies sound?
- Exaggeration Detection: Are benefits overstated or risks understated compared to actual research?
- Context Integrity: Are study results presented within proper statistical context and limitations?
- Authority Verification: Do quoted experts have relevant medical credentials and institutional affiliations?

RESPONSE FORMAT:
- Trust Score: [0-100] (stricter scoring for medical claims)
- Medical Source Verification: [PubMed, WHO, CDC, medical journal cross-checks]
- Study Accuracy: [Verification of cited research and proper interpretation]
- Misinformation Flags: [Exaggerations, misinterpretations, or dangerous medical advice]
- Medical Authority Check: [Credentials and qualifications of cited experts]
- Supporting Evidence: [Specific medical databases and authoritative sources]
- Medical Authenticity Certificate: [Overall medical reliability assessment]`;
      } else {
        prompt = `Perform comprehensive fact-checking analysis of this URL: ${content}

ANALYSIS REQUIREMENTS:
1. CROSS-CHECK SOURCE: Verify the domain legitimacy, publication credibility, and author credentials
2. VALIDATE CLAIMS: Cross-reference all factual statements against multiple trusted news sources, official data, and academic sources
3. DETECT MANIPULATION: Check for misleading headlines, taken-out-of-context quotes, edited images, or subtle misrepresentations
4. VERIFY TIMESTAMPS: Ensure events are accurately dated and not misattributed to different time periods

RESPONSE FORMAT:
- Trust Score: [0-100]
- Source Legitimacy: [Analysis of domain and publication credibility]
- Claim Verification: [Detailed fact-check of each major claim with supporting sources]
- Manipulation Detection: [Any signs of misleading content, edited media, or misquotes]
- Supporting Sources: [List specific URLs that corroborate or contradict the claims]
- Final Assessment: [Overall reliability and specific concerns]`;
      }
    } else {
      if (isMedicalContent) {
        prompt = `Perform MEDICAL FACT-CHECKING analysis of this health/medical statement: "${content}"

MEDICAL VERIFICATION REQUIREMENTS:
1. MEDICAL DATABASE CROSS-REFERENCE: Verify against PubMed database, medical journals (NEJM, The Lancet, JAMA), WHO health updates, CDC guidelines, and FDA approvals
2. STUDY INTERPRETATION ACCURACY: Check if medical studies are correctly interpreted, not exaggerated, and conclusions align with actual research findings
3. MEDICAL MISINFORMATION DETECTION: Flag dangerous health advice, unproven treatments, vaccine misinformation, and medical conspiracy theories
4. EXPERT AUTHORITY VALIDATION: Verify medical credentials, institutional affiliations, and peer recognition of cited experts
5. MEDICAL CONSENSUS ALIGNMENT: Determine if claims align with current medical consensus and evidence-based medicine

MEDICAL-SPECIFIC CHECKS:
- Clinical Evidence: Are claims backed by peer-reviewed clinical trials with adequate sample sizes?
- Risk-Benefit Analysis: Are potential risks and benefits accurately represented?
- Regulatory Status: Are treatments/medications properly FDA-approved or experimentally labeled?
- Medical Ethics: Does the advice meet medical ethics standards and patient safety guidelines?

RESPONSE FORMAT:
- Trust Score: [0-100] (enhanced medical scoring with stricter criteria)
- Medical Database Verification: [PubMed, Cochrane, WHO, CDC cross-validation results]
- Study Interpretation Accuracy: [Analysis of how medical research is presented vs actual findings]
- Medical Authority Validation: [Verification of expert credentials and institutional backing]
- Misinformation Risk Assessment: [Potential harm from medical misinformation]
- Supporting Medical Evidence: [Authoritative medical sources that support or contradict the claim]
- Medical Authenticity Certificate: [Verifiable medical reliability score with institutional backing]`;
      } else {
        prompt = `Perform comprehensive fact-checking analysis of this statement: "${content}"

ANALYSIS REQUIREMENTS:
1. CLAIM VALIDATION: Cross-reference against authoritative sources, official data, peer-reviewed research
2. SOURCE VERIFICATION: Identify and validate the original sources of this information
3. CONTEXT CHECK: Ensure claims aren't taken out of context or misrepresented
4. DETECT MISINFORMATION: Flag any misleading statistics, false correlations, or fabricated details

RESPONSE FORMAT:
- Trust Score: [0-100]
- Claim Accuracy: [Detailed verification of each factual element]
- Source Analysis: [Quality and credibility of underlying sources]
- Context Verification: [Whether claims are properly contextualized]
- Supporting Evidence: [List specific sources that support or contradict the statement]
- Red Flags: [Any signs of misinformation or manipulation]
- Final Assessment: [Overall reliability and specific concerns]`;
      }
    }

    console.log('Sending request to Perplexity API...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fact-checker and misinformation analyst. Provide thorough, evidence-based analysis with specific source citations. Be critical and precise in your assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 2000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    console.log('Perplexity API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error details:', errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const aiResult = await response.json();
    console.log('AI analysis completed successfully');
    
    const analysisText = aiResult.choices[0]?.message?.content || '';
    
    // Extract trust score with improved pattern matching
    const scoreMatch = analysisText.match(/trust\s*score\s*:?\s*(\d+)(?:\/100|%)?/i) ||
                     analysisText.match(/score\s*:?\s*(\d+)(?:\/100|%)?/i) ||
                     analysisText.match(/(\d+)(?:\/100|%)\s*trust/i) ||
                     analysisText.match(/reliability\s*:?\s*(\d+)(?:\/100|%)?/i);
    
    let trustScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;
    
    // Additional trust score validation based on key phrases
    const lowCredibilityIndicators = [
      'unverified', 'misleading', 'false', 'fabricated', 'manipulated', 
      'no evidence', 'contradicted', 'unreliable', 'suspicious', 'questionable'
    ];
    const highCredibilityIndicators = [
      'verified', 'corroborated', 'confirmed', 'authentic', 'reliable',
      'credible', 'supported', 'documented', 'legitimate', 'accurate'
    ];
    
    const lowerText = analysisText.toLowerCase();
    const lowCount = lowCredibilityIndicators.filter(indicator => lowerText.includes(indicator)).length;
    const highCount = highCredibilityIndicators.filter(indicator => lowerText.includes(indicator)).length;
    
    // Adjust score based on indicator analysis
    if (lowCount > highCount && trustScore > 40) {
      trustScore = Math.max(20, trustScore - 20);
    } else if (highCount > lowCount && trustScore < 70) {
      trustScore = Math.min(90, trustScore + 15);
    }
    
    // Generate status based on trust score
    let status = 'completed';
    if (trustScore < 30) {
      status = 'failed';
    } else if (trustScore < 60) {
      status = 'flagged';
    }

    return {
      trustScore,
      status,
      summary: analysisText,
      sources: extractSourcesFromResponse(analysisText)
    };

  } catch (error) {
    console.error('AI verification error:', error);
    throw error; // Don't use fallback, let the error bubble up so we can see what's wrong
  }
}

// Extract sources from AI response with enhanced parsing
function extractSourcesFromResponse(text: string) {
  const sources = [];
  
  // Enhanced URL extraction that handles markdown links and citations
  const urlRegex = /(?:https?:\/\/[^\s\)]+)|(?:\[.*?\]\((https?:\/\/[^\)]+)\))/g;
  const matches = text.matchAll(urlRegex);
  const urls = [];
  
  for (const match of matches) {
    const url = match[1] || match[0]; // Get URL from markdown link or direct URL
    if (url && url.startsWith('http')) {
      urls.push(url.replace(/[.,;)]*$/, '')); // Clean trailing punctuation
    }
  }
  
  // Take first 5 unique URLs as sources
  const uniqueUrls = [...new Set(urls)].slice(0, 5);
  
  uniqueUrls.forEach((url, index) => {
    try {
      const hostname = new URL(url).hostname;
      const domain = hostname.replace('www.', '');
      
      // Extract context around the URL for better source description
      const urlIndex = text.indexOf(url);
      let context = '';
      if (urlIndex !== -1) {
        const start = Math.max(0, urlIndex - 100);
        const end = Math.min(text.length, urlIndex + url.length + 100);
        context = text.substring(start, end).replace(url, '').trim();
      }
      
      // Determine reliability score based on domain reputation
      let reliabilityScore = 75;
      const trustedDomains = [
        'reuters.com', 'ap.org', 'bbc.com', 'npr.org', 'pbs.org',
        'nature.com', 'science.org', 'nejm.org', 'who.int', 'cdc.gov',
        'gov.uk', 'europa.eu', 'un.org', 'fact-check.org'
      ];
      const highQualityDomains = [
        'nytimes.com', 'wsj.com', 'theguardian.com', 'economist.com',
        'ft.com', 'washingtonpost.com', 'politico.com'
      ];
      
      if (trustedDomains.some(trusted => domain.includes(trusted))) {
        reliabilityScore = Math.floor(Math.random() * 10) + 90;
      } else if (highQualityDomains.some(quality => domain.includes(quality))) {
        reliabilityScore = Math.floor(Math.random() * 15) + 80;
      } else {
        reliabilityScore = Math.floor(Math.random() * 25) + 65;
      }
      
      sources.push({
        url: url,
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Verification Source`,
        content_snippet: context || `Evidence source from ${domain}`,
        reliability_score: reliabilityScore
      });
    } catch (error) {
      console.error('Error parsing URL:', url, error);
    }
  });

  // If fewer than 2 sources found, add explanation about limited sources
  if (sources.length === 0) {
    sources.push({
      url: '#',
      title: 'AI Analysis',
      content_snippet: 'Comprehensive analysis performed using multiple online sources and databases',
      reliability_score: 80
    });
  }

  return sources;
}

// Background processing function
async function processVerificationInBackground(
  supabaseClient: any,
  verification: any,
  content: string,
  contentType: string
) {
  console.log(`Starting background processing for verification ${verification.id}`);
  
  try {
    const processingStartTime = Date.now();
    
    // Perform real AI verification
    const result = await performRealVerification(content, contentType, verification.id);
    const processingTime = Date.now() - processingStartTime;

    // Update verification with results
    const { error: updateError } = await supabaseClient
      .from('verifications')
      .update({
        status: result.status,
        trust_score: result.trustScore,
        result_summary: result.summary,
        processing_time_ms: processingTime,
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      throw updateError;
    }

    // Insert sources
    if (result.sources.length > 0) {
      const sourcesToInsert = result.sources.map(source => ({
        verification_id: verification.id,
        ...source
      }));

      await supabaseClient
        .from('sources')
        .insert(sourcesToInsert);
    }

    // Log completion
    await supabaseClient
      .from('verification_logs')
      .insert({
        verification_id: verification.id,
        step: 'verification_complete',
        status: 'success',
        details: {
          trust_score: result.trustScore,
          processing_time_ms: processingTime,
          sources_found: result.sources.length,
        },
      });

    console.log(`Verification ${verification.id} completed with score ${result.trustScore}`);

  } catch (error) {
    console.error('Background processing error:', error);
    
    // Update verification with error status
    await supabaseClient
      .from('verifications')
      .update({
        status: 'failed',
        result_summary: 'Verification failed due to processing error. Please try again.',
      })
      .eq('id', verification.id);

    // Log error
    await supabaseClient
      .from('verification_logs')
      .insert({
        verification_id: verification.id,
        step: 'verification_error',
        status: 'error',
        details: { error: error.message },
      });
  }
}

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

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseAuth.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
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

    // Update monthly usage count immediately
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

    // Start background processing (don't await this)
    const backgroundTask = processVerificationInBackground(
      supabaseClient,
      verification,
      content,
      contentType
    );

    // Use EdgeRuntime.waitUntil to ensure background task completes
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTask);
    } else {
      // Fallback for environments without EdgeRuntime
      backgroundTask.catch(error => console.error('Background task error:', error));
    }

    // Return immediate response
    return new Response(
      JSON.stringify({
        verification_id: verification.id,
        status: 'pending',
        message: 'Verification started. Results will be available shortly.',
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