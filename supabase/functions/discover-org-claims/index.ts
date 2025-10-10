import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting organization claim discovery...');

    // Fetch recent news articles
    const { data: newsArticles, error: newsError } = await supabase
      .from('news_feed')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    if (newsError) throw newsError;

    console.log(`📰 Found ${newsArticles?.length || 0} recent articles`);

    const discoveredClaims = [];
    const organizationMap = new Map();

    for (const article of newsArticles || []) {
      // Extract domain from source URL
      let domain = null;
      try {
        const url = new URL(article.source_url);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        console.log(`⚠️ Could not parse URL: ${article.source_url}`);
        continue;
      }

      // Check for organizational patterns in title and summary
      const orgPatterns = [
        /announced/i,
        /declared/i,
        /stated/i,
        /confirmed/i,
        /reported/i,
        /(company|corporation|inc\.|ltd\.|llc)/i,
        /(government|ministry|department|agency)/i,
      ];

      const hasOrgPattern = orgPatterns.some(pattern => 
        pattern.test(article.title) || pattern.test(article.summary || '')
      );

      if (!hasOrgPattern) continue;

      // Get or create organization
      let organization = organizationMap.get(domain);
      
      if (!organization) {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('domain', domain)
          .single();

        if (existingOrg) {
          organization = existingOrg;
        } else {
          // Classify industry from article category or source
          const industry = classifyIndustry(article);
          
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: extractOrgName(article.source),
              domain: domain,
              industry: industry,
              website: article.source_url,
              description: article.summary?.substring(0, 200),
            })
            .select()
            .single();

          if (orgError) {
            console.error(`❌ Error creating org for ${domain}:`, orgError);
            continue;
          }

          organization = newOrg;
          console.log(`✅ Created new organization: ${organization.name}`);
        }

        organizationMap.set(domain, organization);
      }

      // Create claim text from article
      const claimText = `${article.title}. ${article.summary?.substring(0, 200) || ''}`;

      // Determine source type
      const sourceType = article.link.includes('/press-release') ? 'press_release' : 'news_article';

      discoveredClaims.push({
        organization_id: organization.id,
        claim_text: claimText,
        source_url: article.link,
        source_type: sourceType,
        published_at: article.published_at,
        metadata: {
          article_id: article.id,
          category: article.category,
        },
      });
    }

    console.log(`📊 Discovered ${discoveredClaims.length} organizational claims`);

    // Insert claims and trigger verification
    for (const claim of discoveredClaims) {
      // Check if claim already exists
      const { data: existing } = await supabase
        .from('organization_claims')
        .select('id')
        .eq('source_url', claim.source_url)
        .single();

      if (existing) {
        console.log(`⏭️ Claim already exists: ${claim.source_url}`);
        continue;
      }

      // Insert the claim
      const { data: newClaim, error: claimError } = await supabase
        .from('organization_claims')
        .insert(claim)
        .select()
        .single();

      if (claimError) {
        console.error(`❌ Error creating claim:`, claimError);
        continue;
      }

      // Trigger verification
      try {
        const { data: verifyResult } = await supabase.functions.invoke('verify-org-claim', {
          body: { claim_id: newClaim.id },
        });
        console.log(`✅ Triggered verification for claim: ${newClaim.id}`);
      } catch (verifyError) {
        console.error(`⚠️ Could not trigger verification:`, verifyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        discovered_claims: discoveredClaims.length,
        organizations_found: organizationMap.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Discovery error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function classifyIndustry(article: any): string {
  const category = article.category?.toLowerCase() || '';
  const content = `${article.title} ${article.summary}`.toLowerCase();

  if (category.includes('business') || content.includes('financial') || content.includes('economic')) {
    return 'Finance';
  } else if (category.includes('politics') || content.includes('government') || content.includes('parliament')) {
    return 'Governance';
  } else if (category.includes('tech') || content.includes('technology') || content.includes('software')) {
    return 'Technology';
  } else if (category.includes('health') || content.includes('medical') || content.includes('hospital')) {
    return 'Health';
  } else if (category.includes('media') || content.includes('journalism') || content.includes('news')) {
    return 'Media';
  } else {
    return 'General';
  }
}

function extractOrgName(source: string): string {
  // Clean up common patterns
  return source
    .replace(/\s*\|\s*/g, ' - ')
    .replace(/\s*-\s*.*$/, '')
    .trim();
}
