import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageVerificationResult {
  ocrText?: string;
  labels: Array<{
    description: string;
    score: number;
  }>;
  safeSearch: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
  contentAnalysis: {
    hasText: boolean;
    imageQuality: string;
    manipulationRisk: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    console.log('🚀 Starting image verification...');
    const { imageBase64, verificationId, userId } = await req.json();
    
    if (!imageBase64 || !verificationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Enforce quota limits for all users
    console.log('🔒 Checking image verification usage limits...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: quotaResult, error: quotaError } = await supabase.rpc('increment_license_usage', {
      user_uuid: userId,
      amount: 1
    });

    if (quotaError || !quotaResult?.success) {
      console.log('❌ Image quota exceeded:', quotaError || quotaResult);
      return new Response(
        JSON.stringify({
          confidence: 0,
          status: 'failed',
          summary: '**🚫 IMAGE VERIFICATION LIMIT REACHED**\n\nYou have reached your monthly verification limit. Please upgrade your plan to continue verifying images.',
          analysis: 'Image verification blocked due to usage limit exceeded. Please upgrade to a paid plan for unlimited verifications.',
          sources: [],
          source_consensus: 0,
          verification_method: ['Quota Check'],
          category: 'image',
          created_at: new Date().toISOString(),
          processing_time: 0,
          metadata: { 
            quota_exceeded: true, 
            limit: quotaResult?.limit || 5,
            error_type: 'quota_limit'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    console.log('✅ Image quota check passed');

    console.log('Starting image verification for verification ID:', verificationId);

    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleVisionApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the image with Google Vision API
    const imageResult = await verifyImageWithGoogleVision(imageBase64, googleVisionApiKey);
    
    // Store the image verification results
    const { error: insertError } = await supabase
      .from('image_verifications')
      .insert({
        verification_id: verificationId,
        ocr_text: imageResult.ocrText,
        content_analysis: imageResult.contentAnalysis,
        labels: imageResult.labels,
        safe_search: imageResult.safeSearch,
      });

    if (insertError) {
      console.error('Error storing image verification:', insertError);
      throw new Error('Failed to store image verification results');
    }

    console.log('Image verification completed successfully');

    const processingTime = Date.now() - startTime;

    // Build standardized verification result
    const confidence = calculateImageConfidence(imageResult);
    const status = getStatusFromConfidence(confidence);
    const topLabels = (imageResult.labels || []).slice(0, 3).map(l => l.description).join(', ');

    const result = {
      confidence,
      status,
      summary: `Image analysis via Google Vision. Quality: ${imageResult.contentAnalysis.imageQuality}. Labels: ${topLabels || 'None'}.`,
      analysis: `OCR length: ${imageResult.ocrText?.length || 0}. Manipulation risk: ${imageResult.contentAnalysis.manipulationRisk}. SafeSearch: adult=${imageResult.safeSearch.adult}, violence=${imageResult.safeSearch.violence}, racy=${imageResult.safeSearch.racy}.`,
      sources: [],
      source_consensus: confidence,
      verification_method: ['Google Vision AI', 'Image Analysis'],
      category: 'image',
      created_at: new Date().toISOString(),
      processing_time: processingTime,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image verification:', error);
    // Always return 200 with inconclusive result for mobile compatibility
    return new Response(
      JSON.stringify({
        confidence: 15,
        status: 'inconclusive',
        summary: 'Image verification temporarily unavailable due to service issues. Please try again in a few moments.',
        analysis: 'Unable to complete image analysis due to technical difficulties. This may be due to network connectivity or external service limitations.',
        sources: [],
        source_consensus: 15,
        verification_method: ['Fallback Analysis'],
        category: 'image',
        created_at: new Date().toISOString(),
        processing_time: 0,
        metadata: { fallback_reason: 'service_error', original_error: String(error) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

async function verifyImageWithGoogleVision(
  imageBase64: string, 
  apiKey: string
): Promise<ImageVerificationResult> {
  const vision_url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  // Remove data URL prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  
  const requestBody = {
    requests: [
      {
        image: {
          content: cleanBase64,
        },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
          { type: 'IMAGE_PROPERTIES', maxResults: 1 },
        ],
      },
    ],
  };

  console.log('Calling Google Vision API...');
  
  const response = await fetch(vision_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Vision API error:', errorText);
    throw new Error(`Google Vision API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Google Vision API response received');

  if (data.responses?.[0]?.error) {
    throw new Error(`Google Vision API error: ${data.responses[0].error.message}`);
  }

  const visionResult = data.responses[0];
  
  // Extract OCR text
  const ocrText = visionResult.fullTextAnnotation?.text || '';
  
  // Extract labels
  const labels = visionResult.labelAnnotations?.map((label: any) => ({
    description: label.description,
    score: label.score,
  })) || [];
  
  // Extract safe search results
  const safeSearchAnnotation = visionResult.safeSearchAnnotation || {};
  const safeSearch = {
    adult: safeSearchAnnotation.adult || 'UNKNOWN',
    spoof: safeSearchAnnotation.spoof || 'UNKNOWN',
    medical: safeSearchAnnotation.medical || 'UNKNOWN',
    violence: safeSearchAnnotation.violence || 'UNKNOWN',
    racy: safeSearchAnnotation.racy || 'UNKNOWN',
  };

  // Analyze content quality and manipulation risk
  const contentAnalysis = analyzeImageContent(visionResult, ocrText, labels);

  return {
    ocrText,
    labels,
    safeSearch,
    contentAnalysis,
  };
}

function analyzeImageContent(
  visionResult: any, 
  ocrText: string, 
  labels: Array<{ description: string; score: number }>
): any {
  const hasText = ocrText.length > 0;
  
  // Analyze image quality based on detection confidence
  const avgLabelScore = labels.length > 0 ? 
    labels.reduce((sum, label) => sum + label.score, 0) / labels.length : 0;
  
  let imageQuality = 'unknown';
  if (avgLabelScore > 0.8) imageQuality = 'high';
  else if (avgLabelScore > 0.5) imageQuality = 'medium';
  else if (avgLabelScore > 0) imageQuality = 'low';
  
  // Basic manipulation risk assessment
  let manipulationRisk = 'low';
  
  // Check for suspicious patterns
  const suspiciousLabels = labels.filter(label => {
    const desc = String(label?.description || '').toLowerCase();
    return desc.includes('screenshot') ||
      desc.includes('computer') ||
      desc.includes('software');
  });
  
  if (suspiciousLabels.length > 0) {
    manipulationRisk = 'medium';
  }
  
  // Check for low quality which might indicate manipulation
  if (imageQuality === 'low' && hasText) {
    manipulationRisk = 'medium';
  }

  return {
    hasText,
    imageQuality,
    manipulationRisk,
    textLength: ocrText.length,
    labelCount: labels.length,
    avgConfidence: avgLabelScore,
  };
}

function getStatusFromConfidence(confidence: number): string {
  if (confidence >= 70) return 'verified';
  if (confidence >= 40) return 'inconclusive';
  return 'disputed';
}

function calculateImageConfidence(imageResult: ImageVerificationResult): number {
  let confidence = Math.round((imageResult.contentAnalysis?.hasText ? 0.6 : 0.5) * 100);

  // Adjust based on image quality
  const quality = imageResult.contentAnalysis?.imageQuality;
  if (quality === 'high') confidence += 15;
  else if (quality === 'medium') confidence += 8;
  else if (quality === 'low') confidence += 0;

  // Penalize unsafe content
  const unsafeLevels = ['LIKELY', 'VERY_LIKELY'];
  if (unsafeLevels.includes(imageResult.safeSearch.adult)) confidence -= 20;
  if (unsafeLevels.includes(imageResult.safeSearch.violence)) confidence -= 15;
  if (unsafeLevels.includes(imageResult.safeSearch.racy)) confidence -= 10;

  // OCR text presence slightly increases confidence
  if ((imageResult.ocrText || '').length > 50) confidence += 5;

  // Clamp
  confidence = Math.max(10, Math.min(confidence, 90));
  return confidence;
}