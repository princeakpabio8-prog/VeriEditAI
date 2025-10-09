import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Key, Zap, Shield, TrendingUp } from "lucide-react";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Trust Intelligence API</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access commercial-grade trust analytics, source reputation data, and real-time verification intelligence through our REST API.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
            <TabsTrigger value="batch">Batch</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Authentication
                </CardTitle>
                <CardDescription>All API requests require authentication via API key</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">Include your API key in the request header:</p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  X-API-Key: your_api_key_here
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the Dashboard → Settings → API Keys
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Free Tier:</span>
                    <Badge variant="outline">100 requests/day</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Pro Tier:</span>
                    <Badge variant="outline">10,000 requests/day</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Enterprise:</span>
                    <Badge>Unlimited</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Base URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  https://sqtkkzdswxazyikcheds.supabase.co/functions/v1
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GET /get-trust-analytics</CardTitle>
                <CardDescription>Retrieve aggregated trust intelligence data by region, topic, or domain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Query Parameters</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">region</code>
                      <span className="text-muted-foreground col-span-2">Filter by geographic region</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">topic</code>
                      <span className="text-muted-foreground col-span-2">Filter by content topic</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">domain</code>
                      <span className="text-muted-foreground col-span-2">Filter by source domain</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">start_date</code>
                      <span className="text-muted-foreground col-span-2">YYYY-MM-DD format</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">end_date</code>
                      <span className="text-muted-foreground col-span-2">YYYY-MM-DD format</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">limit</code>
                      <span className="text-muted-foreground col-span-2">Max 1000 (default: 100)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-trust-analytics?region=North%20America&topic=Politics&limit=50' \\
  -H 'X-API-Key: your_api_key_here'`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Response</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`{
  "data": [
    {
      "region": "North America",
      "topic": "Politics",
      "domain": "nytimes.com",
      "average_trust_score": 82,
      "verification_count": 1247,
      "trending_direction": "up",
      "week_over_week_change": 3.2,
      "credibility_tier": "high"
    }
  ],
  "metadata": {
    "total_records": 1,
    "period": "all time",
    "api_version": "v1",
    "tier": "pro"
  }
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reputation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GET /get-source-reputation</CardTitle>
                <CardDescription>Get trust scores and reputation data for news sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Query Parameters</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">domain</code>
                      <span className="text-muted-foreground col-span-2">Single domain (e.g., nytimes.com)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">domains</code>
                      <span className="text-muted-foreground col-span-2">Comma-separated (max 50)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-source-reputation?domain=reuters.com' \\
  -H 'X-API-Key: your_api_key_here'`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Response</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`{
  "domain": "reuters.com",
  "trust_score": 88,
  "verification_count": 5432,
  "accuracy_rate": 91.3,
  "political_bias": -5,
  "factual_reporting": 93,
  "editorial_quality": 89,
  "transparency_rating": "A",
  "owner_entity": "Thomson Reuters",
  "funding_sources": ["Subscriptions", "Licensing"],
  "last_updated": "2025-10-09T14:32:00Z"
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GET /get-global-trust-index</CardTitle>
                <CardDescription>Public endpoint - Get overall trust metrics (no API key required)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-global-trust-index'`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Response</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`{
  "global_index": 72.4,
  "high_credibility_pct": 64.2,
  "total_verifications": 12847,
  "last_updated": "2025-10-09",
  "api_version": "v1"
}`}</pre>
                  </div>
                </div>

                <Badge variant="outline" className="mt-2">Premium features require API key</Badge>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>POST /batch-verify-and-track</CardTitle>
                <CardDescription>
                  <Badge>Pro+ Only</Badge> Bulk verification with sentiment and entity tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`{
  "urls": ["https://example.com/article1", "https://example.com/article2"],
  "track_sentiment": true,
  "track_entities": true
}`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`curl -X POST \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/batch-verify-and-track' \\
  -H 'X-API-Key: your_api_key_here' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "urls": ["https://example.com/article"],
    "track_sentiment": true,
    "track_entities": true
  }'`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Batch Limits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pro Tier:</span>
                      <Badge variant="outline">50 URLs/batch</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Enterprise:</span>
                      <Badge variant="outline">100 URLs/batch</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <div className="text-3xl font-bold">$0</div>
                  <CardDescription>For testing and development</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="text-sm">100 requests/day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">30 days historical data</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">Basic analytics</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <Badge className="w-fit mb-2">Popular</Badge>
                  <CardTitle>Pro</CardTitle>
                  <div className="text-3xl font-bold">$299<span className="text-lg font-normal">/mo</span></div>
                  <CardDescription>For production applications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="text-sm">10,000 requests/day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">365 days historical data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Sentiment analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Entity extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Batch operations</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <div className="text-3xl font-bold">Custom</div>
                  <CardDescription>For high-volume usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="text-sm">Unlimited requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">7 years historical data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">White-label options</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Custom models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Dedicated support</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}