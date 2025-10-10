import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cosine similarity function for comparing embeddings
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Calculate source diversity score
function calculateSourceDiversity(embeddings: number[][]): number {
  if (embeddings.length < 2) return 1.0;
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      totalSimilarity += cosineSimilarity(embeddings[i], embeddings[j]);
      comparisons++;
    }
  }
  
  const avgSimilarity = totalSimilarity / comparisons;
  return 1.0 - avgSimilarity; // Higher diversity = lower avg similarity
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      content, 
      embedding, 
      checkDuplicates = true, 
      checkFraud = true,
      similarityThreshold = 0.85,
      userId 
    } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let currentEmbedding = embedding;

    // Generate embedding if not provided
    if (!currentEmbedding && content) {
      console.log('🔄 Generating embedding for content...');
      const embeddingResponse = await fetch(
        `${supabaseUrl}/functions/v1/azure-generate-embedding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const embeddingData = await embeddingResponse.json();
      if (!embeddingData.success) {
        throw new Error('Failed to generate embedding');
      }
      currentEmbedding = embeddingData.embeddings[0];
    }

    if (!currentEmbedding) {
      return new Response(
        JSON.stringify({ success: false, error: 'No embedding or content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any = {
      success: true,
      embedding: currentEmbedding,
      duplicates: [],
      fraudPatterns: [],
      sourceDiversity: null,
    };

    // Check for duplicate content
    if (checkDuplicates) {
      console.log('🔍 Checking for duplicate content...');
      
      // Get recent verifications with embeddings
      const { data: verifications, error: verError } = await supabase
        .from('verifications')
        .select('id, content, trust_score, created_at, azure_embedding')
        .not('azure_embedding', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!verError && verifications) {
        const duplicates = verifications
          .map((v: any) => ({
            ...v,
            similarity: cosineSimilarity(currentEmbedding, v.azure_embedding),
          }))
          .filter((v: any) => v.similarity >= similarityThreshold)
          .sort((a: any, b: any) => b.similarity - a.similarity)
          .slice(0, 5);

        results.duplicates = duplicates.map((d: any) => ({
          verificationId: d.id,
          similarity: d.similarity,
          trustScore: d.trust_score,
          createdAt: d.created_at,
          contentPreview: d.content.substring(0, 200),
        }));

        console.log(`✅ Found ${results.duplicates.length} similar verifications`);
      }
    }

    // Check for fraud patterns
    if (checkFraud) {
      console.log('🚨 Checking for fraud patterns...');
      
      const { data: fraudPatterns, error: fraudError } = await supabase
        .from('fraud_patterns')
        .select('*');

      if (!fraudError && fraudPatterns) {
        const matches = fraudPatterns
          .map((pattern: any) => ({
            ...pattern,
            similarity: cosineSimilarity(currentEmbedding, pattern.embedding),
          }))
          .filter((p: any) => p.similarity >= 0.75)
          .sort((a: any, b: any) => b.similarity - a.similarity);

        results.fraudPatterns = matches.map((m: any) => ({
          category: m.category,
          severity: m.severity,
          similarity: m.similarity,
          description: m.metadata?.description || `Potential ${m.category} detected`,
        }));

        if (matches.length > 0) {
          results.fraudScore = Math.max(...matches.map((m: any) => m.similarity));
          console.log(`⚠️ Found ${matches.length} fraud pattern matches (max score: ${results.fraudScore})`);
        }
      }
    }

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in verify-with-azure-ai:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
