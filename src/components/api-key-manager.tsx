import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string | null;
  key_preview: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export function ApiKeyManager() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  async function fetchApiKeys() {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function generateApiKey() {
    if (!user) return;
    
    setGenerating(true);
    try {
      // Generate random API key
      const key = `sk_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;

      // Hash the key
      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get last 8 characters for preview
      const keyPreview = `...${key.slice(-8)}`;

      // Store in database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_hash: keyHash,
          key_preview: keyPreview,
          name: newKeyName || null,
        });

      if (error) throw error;

      setGeneratedKey(key);
      setNewKeyName('');
      await fetchApiKeys();
      toast.success('API key generated successfully');
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setGenerating(false);
    }
  }

  async function revokeApiKey(id: string) {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchApiKeys();
      toast.success('API key revoked');
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage API keys for browser extension and integrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {generatedKey && (
          <div className="p-4 bg-accent rounded-lg space-y-2">
            <p className="text-sm font-medium">Your new API key (save it now!):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                {showKey ? generatedKey : '•'.repeat(64)}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(generatedKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This key will only be shown once. Make sure to copy it now!
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setGeneratedKey(null)}
            >
              Done
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Key name (optional)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <Button onClick={generateApiKey} disabled={generating}>
            <Plus className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>

        {apiKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No API keys yet. Generate one to use the browser extension.
          </p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{key.key_preview}</code>
                    {key.name && (
                      <span className="text-sm text-muted-foreground">
                        ({key.name})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Created {format(new Date(key.created_at), 'MMM d, yyyy')}</span>
                    {key.last_used_at && (
                      <span>Last used {format(new Date(key.last_used_at), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => revokeApiKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
