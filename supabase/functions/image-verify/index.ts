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
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Handle missing userId/verificationId gracefully for mobile compatibility
    const isMissingFields = !userId || !verificationId;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (!isMissingFields) {
      // Only check quota and store results if we have complete data
      console.log('🔒 Checking image verification usage limits...');
      const { data, error: quotaError } = await supabase.rpc('increment_license_usage', {
        user_uuid: userId,
        amount: 1
      });

      if (quotaError || !data?.success) {
        console.log('❌ Image quota exceeded:', quotaError || data);
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
              limit: data?.limit || 5,
              error_type: 'quota_limit'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }
    console.log('✅ Image quota check passed');

    console.log('Starting image verification for verification ID:', verificationId);

    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleVisionApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    // Verify the image with Google Vision API
    const imageResult = await verifyImageWithGoogleVision(imageBase64, googleVisionApiKey);
    
    // Store the image verification results only if we have complete data
    if (!isMissingFields) {
      const { error: insertError } = await supabase
        .from('image_verifications')
        .insert({
          verification_id: verificationId,
          user_id: userId,
          image_data: imageBase64.substring(0, 1000),
          confidence: calculateImageConfidence(imageResult),
          status: getStatusFromConfidence(calculateImageConfidence(imageResult)),
          summary: `Image analysis via Google Vision. Quality: ${imageResult.contentAnalysis?.imageQuality || 'Unknown'}`,
          analysis: `OCR length: ${imageResult.ocrText?.length || 0}. Manipulation risk: ${imageResult.contentAnalysis?.manipulationRisk || 'Unknown'}`,
          sources: [],
          google_vision_result: imageResult,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error storing image verification:', insertError);
      }
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

    // Add metadata for mobile compatibility
    const finalResult = {
      ...result,
      ...(isMissingFields && { metadata: { missing_fields: true } })
    };

    return new Response(
      JSON.stringify(finalResult),
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
  if (confidence >= 80) return 'verified';
  if (confidence >= 60) return 'inconclusive';
  return 'disputed';
}

function calculateImageConfidence(imageResult: ImageVerificationResult): number {
  // Multi-factor image confidence calculation with content analysis
  
  // Base confidence (35% weight) - content analysis
  let contentScore = 50;
  if (imageResult.contentAnalysis?.hasText) {
    const textLength = (imageResult.ocrText || '').length;
    if (textLength > 100) contentScore += 20;
    else if (textLength > 50) contentScore += 12;
    else if (textLength > 10) contentScore += 8;
    
    // OCR content matching bonus
    const ocrText = (imageResult.ocrText || '').toLowerCase();
    if (ocrText.includes('official') || ocrText.includes('government') || 
        ocrText.includes('verified') || ocrText.includes('authentic')) {
      contentScore += 15; // Official document indicators
    }
  }
  
  // Image quality (35% weight) - enhanced scoring
  let qualityScore = 40;
  const quality = imageResult.contentAnalysis?.imageQuality;
  if (quality === 'high') qualityScore = 88; // Increased for high quality
  else if (quality === 'medium') qualityScore = 72;
  else if (quality === 'low') qualityScore = 45;
  
  // Professional document indicators
  if (imageResult.labels.some((label: any) => 
      ['document', 'text', 'paper', 'certificate', 'official'].includes(label.description?.toLowerCase()))) {
    qualityScore += 10; // Professional document bonus
  }
  
  // Safety and authenticity (30% weight) - enhanced
  let safetyScore = 85; // Higher baseline for authenticity
  const unsafeLevels = ['LIKELY', 'VERY_LIKELY'];
  if (unsafeLevels.includes(imageResult.safeSearch.adult)) safetyScore -= 30;
  if (unsafeLevels.includes(imageResult.safeSearch.violence)) safetyScore -= 25;
  if (unsafeLevels.includes(imageResult.safeSearch.racy)) safetyScore -= 15;
  if (unsafeLevels.includes(imageResult.safeSearch.spoof)) safetyScore -= 20;
  if (unsafeLevels.includes(imageResult.safeSearch.medical)) safetyScore -= 10;
  
  // Enhanced manipulation risk assessment
  const manipulationRisk = imageResult.contentAnalysis?.manipulationRisk;
  if (manipulationRisk === 'high') safetyScore -= 25;
  else if (manipulationRisk === 'medium') safetyScore -= 15;
  else if (manipulationRisk === 'low') safetyScore += 8; // Bonus for low manipulation risk
  
  // Label confidence from Google Vision (enhanced weight)
  const avgLabelConfidence = imageResult.labels.length > 0 
    ? imageResult.labels.reduce((sum: number, label: any) => sum + (label.score || 0), 0) / imageResult.labels.length
    : 0.5;
  const labelBonus = Math.round(avgLabelConfidence * 12); // Increased weight
  
  // Government/official content bonus
  let officialBonus = 0;
  const ocrText = (imageResult.ocrText || '').toLowerCase();
  if (ocrText.includes('.gov') || ocrText.includes('department of') || 
      ocrText.includes('united states') || ocrText.includes('official')) {
    officialBonus = 15; // Government document bonus
  }
  
  // Weighted final calculation
  const finalConfidence = Math.round(
    (contentScore * 0.35) + (qualityScore * 0.35) + (safetyScore * 0.30) + labelBonus + officialBonus
  );

  // Enhanced range for image verification (40-95%)
  return Math.max(40, Math.min(finalConfidence, 95));
}