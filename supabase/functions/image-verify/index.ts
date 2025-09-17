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
    const { imageBase64, verificationId, userId } = await req.json();
    
    if (!imageBase64 || !verificationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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

    return new Response(
      JSON.stringify({
        success: true,
        imageVerification: imageResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image verification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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
  const suspiciousLabels = labels.filter(label => 
    label.description.toLowerCase().includes('screenshot') ||
    label.description.toLowerCase().includes('computer') ||
    label.description.toLowerCase().includes('software')
  );
  
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