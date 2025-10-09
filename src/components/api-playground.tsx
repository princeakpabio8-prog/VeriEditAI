import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateCodeExamples, type Language } from "@/lib/code-generator";

const API_ENDPOINTS = [
  {
    value: 'get-global-trust-index',
    label: 'Get Global Trust Index',
    description: 'Get the current global trust score',
    requiresAuth: false,
    params: []
  },
  {
    value: 'get-source-reputation',
    label: 'Get Source Reputation',
    description: 'Check reputation of a news source',
    requiresAuth: true,
    params: [{ name: 'domain', placeholder: 'reuters.com', required: true }]
  },
  {
    value: 'get-trust-analytics',
    label: 'Get Trust Analytics',
    description: 'Get trust analytics for a topic',
    requiresAuth: true,
    params: [
      { name: 'topic', placeholder: 'climate-change', required: true },
      { name: 'region', placeholder: 'global', required: false }
    ]
  }
];

export function ApiPlayground() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0].value);
  const [params, setParams] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const endpoint = API_ENDPOINTS.find(e => e.value === selectedEndpoint);
  const requiresAuth = endpoint?.requiresAuth ?? false;

  const buildUrl = () => {
    const baseUrl = `https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/${selectedEndpoint}`;
    const queryParams = new URLSearchParams();
    
    endpoint?.params.forEach(param => {
      if (params[param.name]) {
        queryParams.append(param.name, params[param.name]);
      }
    });

    const query = queryParams.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

  const testEndpoint = async () => {
    if (requiresAuth && !apiKey) {
      toast({
        title: "API Key Required",
        description: "This endpoint requires authentication. Please enter your API key.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (requiresAuth && apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const res = await fetch(buildUrl(), { headers });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Request failed');
      } else {
        setResponse(data);
        toast({
          title: "Success!",
          description: "API request completed successfully"
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to make request');
      toast({
        title: "Error",
        description: err.message || 'Failed to make request',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const codeExamples = generateCodeExamples(
    selectedEndpoint + (endpoint?.params.length ? `?${endpoint.params.map(p => `${p.name}=${params[p.name] || p.placeholder}`).join('&')}` : ''),
    apiKey || 'YOUR_API_KEY_HERE'
  );

  const copyCode = () => {
    const code = codeExamples.find(e => e.language === selectedLanguage)?.code || '';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast({
      title: "Copied!",
      description: "Code example copied to clipboard"
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Playground</CardTitle>
          <CardDescription>
            Test API endpoints directly in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Endpoint Selector */}
          <div className="space-y-2">
            <Label>Select Endpoint</Label>
            <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {API_ENDPOINTS.map(ep => (
                  <SelectItem key={ep.value} value={ep.value}>
                    <div className="flex items-center gap-2">
                      {ep.label}
                      {ep.requiresAuth && (
                        <Badge variant="secondary" className="text-xs">Auth Required</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {endpoint && (
              <p className="text-sm text-muted-foreground">{endpoint.description}</p>
            )}
          </div>

          {/* API Key Input (if required) */}
          {requiresAuth && (
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          {/* Parameters */}
          {endpoint?.params.map(param => (
            <div key={param.name} className="space-y-2">
              <Label>
                {param.name}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                placeholder={param.placeholder}
                value={params[param.name] || ''}
                onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
              />
            </div>
          ))}

          {/* Test Button */}
          <Button onClick={testEndpoint} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Endpoint
              </>
            )}
          </Button>

          {/* Response */}
          {(response || error) && (
            <div className="space-y-2">
              <Label>Response</Label>
              <div className={`bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto ${error ? 'border-destructive border' : ''}`}>
                <pre>{JSON.stringify(response || { error }, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            Copy and use in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
            <TabsList className="grid grid-cols-5 w-full">
              {codeExamples.map(example => (
                <TabsTrigger key={example.language} value={example.language}>
                  {example.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {codeExamples.map(example => (
              <TabsContent key={example.language} value={example.language}>
                <div className="relative">
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{example.code}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyCode}
                  >
                    {copiedCode ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
