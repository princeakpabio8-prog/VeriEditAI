import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DynamicMeta } from '@/components/DynamicMeta';

export default function ApiOpenApiDocs() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenApiSpec();
  }, []);

  const fetchOpenApiSpec = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-spec');
      if (error) throw error;
      setSpec(data);
    } catch (error) {
      console.error('Error fetching OpenAPI spec:', error);
      toast.error('Failed to load API specification');
    } finally {
      setLoading(false);
    }
  };

  const downloadSpec = (format: 'json' | 'yaml') => {
    if (!spec) return;

    const content = format === 'json' 
      ? JSON.stringify(spec, null, 2)
      : convertToYaml(spec);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veriedit-api-spec.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded OpenAPI spec as ${format.toUpperCase()}`);
  };

  const copyEndpoint = (path: string) => {
    const fullUrl = `${spec.servers[0].url}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
    toast.success('Endpoint URL copied');
  };

  const convertToYaml = (obj: any): string => {
    // Simple YAML converter for demonstration
    return JSON.stringify(obj, null, 2)
      .replace(/"/g, '')
      .replace(/,/g, '')
      .replace(/\{/g, '')
      .replace(/\}/g, '');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load API specification</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <DynamicMeta
        title="VeriEdit AI Trust Oracle API | Polygon-based Verification"
        description="Public API for AI verification, trust scoring, and on-chain proof validation. Free tier available with OpenAPI 3.0 specification."
      />

      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{spec.info.title}</h1>
            <p className="text-muted-foreground text-lg">{spec.info.description}</p>
            <p className="text-sm text-muted-foreground mt-2">Version: {spec.info.version}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => downloadSpec('json')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button onClick={() => downloadSpec('yaml')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              YAML
            </Button>
          </div>
        </div>

        {/* Server Info */}
        <Card>
          <CardHeader>
            <CardTitle>Base URL</CardTitle>
            <CardDescription>All endpoints are relative to this base URL</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block bg-muted p-4 rounded-lg text-sm">
              {spec.servers[0].url}
            </code>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">API Endpoints</h2>
          
          {Object.entries(spec.paths).map(([path, methods]: [string, any]) => {
            const method = Object.keys(methods)[0];
            const endpoint = methods[method];
            
            return (
              <Card key={path}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded">
                          {method.toUpperCase()}
                        </span>
                        <code className="text-sm font-mono">{path}</code>
                      </div>
                      <CardTitle>{endpoint.summary}</CardTitle>
                      <CardDescription className="mt-2">{endpoint.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyEndpoint(path)}
                    >
                      {copiedPath === path ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  {endpoint.tags && (
                    <div className="flex gap-2">
                      {endpoint.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Parameters</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param: any, idx: number) => (
                          <div key={idx} className="border-l-2 border-primary/20 pl-4">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono">{param.name}</code>
                              <span className="text-xs text-muted-foreground">
                                ({param.schema.type})
                              </span>
                              {param.required && (
                                <span className="text-xs text-destructive">required</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                            {param.example && (
                              <code className="text-xs text-muted-foreground mt-1 block">
                                Example: {param.example}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(
                        endpoint.responses['200']?.content?.['application/json']?.schema,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Support & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>Website:</strong>{' '}
              <a href={spec.info.contact.url} className="text-primary hover:underline">
                {spec.info.contact.url}
              </a>
            </p>
            <p className="text-sm">
              <strong>Email:</strong>{' '}
              <a href={`mailto:${spec.info.contact.email}`} className="text-primary hover:underline">
                {spec.info.contact.email}
              </a>
            </p>
            <p className="text-sm">
              <strong>Documentation:</strong>{' '}
              <a href="/api" className="text-primary hover:underline">
                API Hub
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
