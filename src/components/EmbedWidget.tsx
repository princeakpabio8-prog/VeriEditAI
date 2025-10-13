import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function EmbedWidget() {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [username, setUsername] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Fetch username from profile
      fetchUsername();
    }
  }, [user]);

  const fetchUsername = async () => {
    // This would fetch from profiles table
    setUsername('demo-user');
  };

  const getEmbedCode = () => {
    return `<script src="https://verieditai.com/embed.js" 
  data-user="${username}" 
  data-theme="${theme}">
</script>`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Code className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Embed Your Activity</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Share your verification activity on any website. Each embed helps spread truth and earns you backlinks.
      </p>

      <Tabs defaultValue="customize" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="customize" className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
            />
          </div>

          <div>
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['light', 'dark', 'auto'] as const).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Embed Code</Label>
            <div className="relative mt-2">
              <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto">
                {getEmbedCode()}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Badge variant="outline" className="border-primary/30">SEO Boost</Badge>
            <p className="text-xs text-muted-foreground">
              Each embed includes a "Powered by VeriEdit AI" backlink
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="p-6 rounded-lg border border-border bg-background min-h-[300px]">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Widget Preview
            </p>
            <div className="text-center text-muted-foreground">
              <ExternalLink className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Live preview coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
