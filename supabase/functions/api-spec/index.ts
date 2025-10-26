import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
};

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'VeriEdit Trust Oracle (Polygon-based)',
    version: '1.0.0',
    description: 'A verification oracle that provides trust scores, provenance data, and proof-on-chain status for claims, documents, and media. Built on Polygon network.',
    contact: {
      name: 'VeriEdit AI',
      url: 'https://trust-lighthouse.lovable.app',
      email: 'api@verifiedit.ai',
    },
    license: {
      name: 'API Terms of Service',
      url: 'https://trust-lighthouse.lovable.app/terms',
    },
  },
  servers: [
    {
      url: 'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1',
      description: 'Production API Server',
    },
  ],
  tags: [
    {
      name: 'Verification',
      description: 'Claim verification and trust scoring endpoints',
    },
    {
      name: 'Oracle',
      description: 'Trust oracle status and metrics',
    },
    {
      name: 'Ledger',
      description: 'On-chain verification history',
    },
  ],
  paths: {
    '/verify': {
      get: {
        tags: ['Verification'],
        summary: 'Verify a claim',
        description: 'Returns verification score, source breakdown, and proof hash for a given claim.',
        parameters: [
          {
            name: 'claim',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'The claim text to verify',
            example: 'Climate change is real',
          },
        ],
        responses: {
          200: {
            description: 'Verification completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    trust_score: { type: 'number', example: 85 },
                    confidence_level: { type: 'string', example: 'high' },
                    sources: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          domain: { type: 'string' },
                          reliability_score: { type: 'number' },
                          url: { type: 'string' },
                        },
                      },
                    },
                    proof_hash: { type: 'string', nullable: true },
                    verification_id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid claim parameter' },
          500: { description: 'Internal server error' },
        },
      },
    },
    '/get-trust-level': {
      get: {
        tags: ['Verification'],
        summary: 'Get trust level report',
        description: 'Returns full trust report for a verified claim with NFT badge information.',
        parameters: [
          {
            name: 'claim_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
            description: 'Verification ID',
          },
          {
            name: 'claim_text',
            in: 'query',
            schema: { type: 'string' },
            description: 'Claim text to search',
          },
          {
            name: 'url',
            in: 'query',
            schema: { type: 'string' },
            description: 'Source URL',
          },
        ],
        responses: {
          200: {
            description: 'Trust level report retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    verification_id: { type: 'string', format: 'uuid' },
                    trust_score: { type: 'number' },
                    confidence_level: { type: 'string' },
                    verification_status: { type: 'string' },
                    on_chain_proof: { type: 'string', nullable: true },
                    nft_badge: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        token_id: { type: 'string' },
                        transaction_hash: { type: 'string' },
                        rarity: { type: 'string' },
                      },
                    },
                    source_metadata: { type: 'object' },
                  },
                },
              },
            },
          },
          404: { description: 'Verification not found' },
        },
      },
    },
    '/public-stats': {
      get: {
        tags: ['Oracle'],
        summary: 'Oracle status',
        description: 'Returns current oracle uptime, version, and data quality metrics.',
        responses: {
          200: {
            description: 'Oracle status retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalVerifications: { type: 'number' },
                    averageTrustScore: { type: 'number' },
                    activeUsers: { type: 'number' },
                    countriesServed: { type: 'number' },
                    version: { type: 'string', example: '1.0.0' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/get-verified-feed': {
      get: {
        tags: ['Ledger'],
        summary: 'Verified feed / Ledger history',
        description: 'Returns verified claims and minted NFT badges. Filter by wallet address to get user-specific minting history.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 20 },
            description: 'Number of results to return',
          },
          {
            name: 'min_trust_score',
            in: 'query',
            schema: { type: 'number', default: 60 },
            description: 'Minimum trust score filter',
          },
          {
            name: 'wallet',
            in: 'query',
            schema: { type: 'string' },
            description: 'Wallet address to filter NFT minting history',
          },
        ],
        responses: {
          200: {
            description: 'Verified feed retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    feed: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          verification_id: { type: 'string' },
                          claim: { type: 'string' },
                          trust_score: { type: 'number' },
                          nft_badge: { type: 'object', nullable: true },
                          verified_at: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    total: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/get-global-trust-index': {
      get: {
        tags: ['Oracle'],
        summary: 'Global trust metrics',
        description: 'Returns aggregated system trust statistics including average trust score, total verifications, and trends.',
        responses: {
          200: {
            description: 'Global trust index retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    global_trust_index: { type: 'number' },
                    total_verifications: { type: 'number' },
                    avg_trust_score: { type: 'number' },
                    high_quality_percentage: { type: 'number' },
                    trend_30d: { type: 'number', nullable: true },
                    last_updated: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reference-oracle': {
      get: {
        tags: ['Verification'],
        summary: 'Get verification citation',
        description: 'Returns formatted citation data for academic and AI reference use.',
        parameters: [
          {
            name: 'verification_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
            description: 'Verification ID',
          },
          {
            name: 'claim_text',
            in: 'query',
            schema: { type: 'string' },
            description: 'Claim text to search',
          },
        ],
        responses: {
          200: {
            description: 'Citation data retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    markdown: { type: 'string' },
                    bibtex: { type: 'string' },
                    structured: { type: 'object' },
                  },
                },
              },
            },
          },
          404: { description: 'Verification not found' },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Serving OpenAPI spec');

    return new Response(JSON.stringify(openApiSpec, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Error serving OpenAPI spec:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
