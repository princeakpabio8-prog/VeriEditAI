import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyManager } from "@/components/api-key-manager";
import { ApiUsageDashboard } from "@/components/api-usage-dashboard";
import { ApiQuickStart } from "@/components/api-quick-start";
import { Code, BookOpen, Zap, ExternalLink, Terminal, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ApiHub() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Code className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">API Hub</h1>
              <p className="text-muted-foreground">Integrate Trust Intelligence into your applications</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="quickstart" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="space-y-6">
            <ApiQuickStart />

            {/* Integration Examples */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    REST API
                  </CardTitle>
                  <CardDescription>
                    Direct HTTP requests to our endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="text-xs">{`curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-source-reputation?domain=reuters.com' \\
  -H 'X-API-Key: your_api_key_here'`}</pre>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/api-docs">
                      View Full Documentation
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Browser Extension
                  </CardTitle>
                  <CardDescription>
                    Real-time verification in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">1</div>
                      <div>
                        <p className="font-medium">Install Extension</p>
                        <p className="text-muted-foreground text-xs">Available for Chrome & Firefox</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">2</div>
                      <div>
                        <p className="font-medium">Configure API Key</p>
                        <p className="text-muted-foreground text-xs">Paste your key in extension settings</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">3</div>
                      <div>
                        <p className="font-medium">Start Verifying</p>
                        <p className="text-muted-foreground text-xs">Instant trust scores on any page</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/extensions">
                      Get Extension
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Base URL Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                  <code>https://sqtkkzdswxazyikcheds.supabase.co/functions/v1</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('https://sqtkkzdswxazyikcheds.supabase.co/functions/v1');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <ApiKeyManager />
          </TabsContent>

          {/* Usage & Analytics Tab */}
          <TabsContent value="usage" className="space-y-6">
            <ApiUsageDashboard />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-hover-lift">
                <CardHeader>
                  <BookOpen className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Full Documentation</CardTitle>
                  <CardDescription>
                    Complete API reference with examples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/api-docs">
                      View Docs
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-hover-lift">
                <CardHeader>
                  <Zap className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Rate Limits</CardTitle>
                  <CardDescription>
                    Understand your API quotas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Free:</span>
                    <Badge variant="outline">100/day</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro:</span>
                    <Badge variant="outline">10,000/day</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise:</span>
                    <Badge>Unlimited</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover-lift">
                <CardHeader>
                  <Package className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Browser Extension</CardTitle>
                  <CardDescription>
                    Install our verification tool
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/extensions">
                      Get Extension
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Available Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Available Endpoints</CardTitle>
                <CardDescription>All endpoints support JSON responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <code className="text-sm font-mono">GET /get-trust-analytics</code>
                      <p className="text-xs text-muted-foreground mt-1">Aggregated trust data by region/topic</p>
                    </div>
                    <Badge variant="outline">Analytics</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <code className="text-sm font-mono">GET /get-source-reputation</code>
                      <p className="text-xs text-muted-foreground mt-1">Source credibility scores</p>
                    </div>
                    <Badge variant="outline">Reputation</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <code className="text-sm font-mono">POST /batch-verify-and-track</code>
                      <p className="text-xs text-muted-foreground mt-1">Bulk verification with tracking</p>
                    </div>
                    <Badge>Pro+</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <code className="text-sm font-mono">GET /get-global-trust-index</code>
                      <p className="text-xs text-muted-foreground mt-1">Public trust index (no auth)</p>
                    </div>
                    <Badge variant="outline">Public</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
