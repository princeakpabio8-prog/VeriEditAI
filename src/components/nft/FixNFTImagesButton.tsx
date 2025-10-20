import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const FixNFTImagesButton = () => {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const handleFixImages = async () => {
    setIsFixing(true);
    
    try {
      toast({
        title: "Regenerating Badge Images",
        description: "This may take a few minutes. We'll notify you when complete.",
      });

      const { data, error } = await supabase.functions.invoke('fix-nft-badge-images');

      if (error) throw error;

      toast({
        title: "✅ Images Fixed!",
        description: `Fixed ${data?.fixed || 0} badges, ${data?.skipped || 0} skipped, ${data?.failed || 0} failed`,
      });

      // Reload the page to show new images
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error fixing NFT images:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix badge images",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Image Generator</CardTitle>
        <CardDescription className="text-xs">
          Regenerate AI images for badges with missing or broken images using OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleFixImages} 
          disabled={isFixing}
          className="w-full"
          variant="default"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating Images...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Fix Badge Images
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
