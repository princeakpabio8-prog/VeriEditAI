import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { uploadBadgeTemplates } from '@/utils/uploadBadgeTemplates';
import { useToast } from '@/hooks/use-toast';

export function UploadBadgeTemplates() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleUpload = async () => {
    setUploading(true);
    setResults([]);

    try {
      const uploadResults = await uploadBadgeTemplates();
      setResults(uploadResults);

      const successCount = uploadResults.filter(r => r.success).length;
      
      if (successCount === uploadResults.length) {
        toast({
          title: "All badges uploaded!",
          description: `Successfully uploaded all ${successCount} badge templates.`,
        });
      } else {
        toast({
          title: "Partial upload",
          description: `Uploaded ${successCount}/${uploadResults.length} badges. Check console for errors.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload NFT Badge Templates
        </CardTitle>
        <CardDescription>
          Upload the 5 custom Canva badge templates to Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleUpload} 
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Badge Templates
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Upload Results:</p>
            {results.map((result) => (
              <div 
                key={result.rarity}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted"
              >
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="capitalize font-medium">{result.rarity}</span>
                {result.success ? (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Uploaded
                  </span>
                ) : (
                  <span className="text-xs text-red-500 ml-auto">
                    {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
