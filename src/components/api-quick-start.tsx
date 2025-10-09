import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Key, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

export function ApiQuickStart() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("Quick Start Key");
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);

  const generateApiKey = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const rawKey = `vdt_${crypto.randomUUID().replace(/-/g, '')}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_hash: keyHash,
          key_preview: `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`,
          name: keyName,
          is_active: true
        });

      if (error) throw error;

      setGeneratedKey(rawKey);
      toast({
        title: "API Key Generated!",
        description: "Copy your key now - it won't be shown again",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const testApiKey = async () => {
    if (!generatedKey) return;
    
    setTesting(true);
    try {
      const response = await fetch(
        'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-global-trust-index',
        {
          headers: {
            'X-API-Key': generatedKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success! 🎉",
          description: `API is working! Global Trust Index: ${data.global_trust_index}`,
        });
      } else {
        throw new Error(data.error || 'Test failed');
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, step?: number) => {
    navigator.clipboard.writeText(text);
    if (step !== undefined) setCopiedStep(step);
    toast({
      title: "Copied to clipboard",
      description: "Code example copied successfully",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const getCodeExample = () => {
    const key = generatedKey || 'YOUR_API_KEY_HERE';
    return `curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-source-reputation?domain=reuters.com' \\
  -H 'X-API-Key: ${key}'`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Get Started in 3 Steps
        </CardTitle>
        <CardDescription>
          Start using the Trust Intelligence API in under 3 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step 1: Generate API Key */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold">Generate Your API Key</h3>
                <p className="text-sm text-muted-foreground">Create a new key to get started</p>
              </div>
              
              {!generatedKey ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (optional)"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={generateApiKey} disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Generate Key
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm pr-12">
                      {generatedKey}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Save this key securely - it won't be shown again!
                  </p>
                  <Button 
                    onClick={testApiKey} 
                    disabled={testing}
                    variant="outline"
                    size="sm"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Test This Key
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Make Request */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold">Make Your First Request</h3>
                <p className="text-sm text-muted-foreground">Use your API key in requests</p>
              </div>
              <div className="relative">
                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto pr-12">
                  <pre>{getCodeExample()}</pre>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getCodeExample())}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Integrate */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold">Integrate Into Your App</h3>
                <p className="text-sm text-muted-foreground">
                  Check the Playground tab for interactive examples in multiple languages
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
