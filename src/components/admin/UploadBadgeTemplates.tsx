import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, Loader2, Eye, RefreshCw, Wrench } from 'lucide-react';
import { uploadBadgeTemplates } from '@/utils/uploadBadgeTemplates';
import { verifyBadgeTemplates } from '@/utils/verifyBadgeTemplates';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function UploadBadgeTemplates() {
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [repairResults, setRepairResults] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    handleVerify();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const status = await verifyBadgeTemplates();
      setVerificationStatus(status);
      
      if (status.allReady) {
        toast({
          title: "All templates ready!",
          description: `All ${status.readyCount} badge templates are uploaded and accessible.`,
        });
      } else {
        toast({
          title: "Templates need upload",
          description: `${status.readyCount}/${status.totalCount} templates ready. Click Upload to add missing badges.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

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
        // Re-verify after upload
        setTimeout(handleVerify, 1000);
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

  const handleRepairAllBadges = async () => {
    setRepairing(true);
    setRepairResults(null);
    
    try {
      toast({
        title: "Repair started",
        description: "Repairing all NFT badge metadata... This may take a few minutes.",
      });

      const { data, error } = await supabase.functions.invoke('repair-all-nft-badges');
      
      if (error) throw error;
      
      setRepairResults(data);
      
      toast({
        title: "Repair complete!",
        description: data.message || `Fixed ${data.results?.metadataFixed || 0} badges`,
      });
    } catch (error: any) {
      console.error('Repair failed:', error);
      toast({
        title: "Repair failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          NFT Badge Template Manager
        </CardTitle>
        <CardDescription>
          Upload and verify the 5 custom Canva badge templates for NFT minting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStatus && (
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Template Status</p>
              <span className={`text-sm ${verificationStatus.allReady ? 'text-green-600' : 'text-yellow-600'}`}>
                {verificationStatus.readyCount}/{verificationStatus.totalCount} Ready
              </span>
            </div>
            {verificationStatus.results.map((result: any) => (
              <div 
                key={result.rarity}
                className="flex items-center gap-2 text-sm py-1"
              >
                {result.accessible ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="capitalize">{result.rarity}</span>
                {result.accessible && (
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={uploading || verifying || repairing}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Templates
              </>
            )}
          </Button>

          <Button 
            onClick={handleVerify} 
            disabled={verifying || uploading || repairing}
            variant="outline"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Repair All Badges Section */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Repair Existing NFT Badges</p>
          <p className="text-xs text-muted-foreground mb-3">
            Update all existing badge metadata with correct image URLs and refresh OpenSea
          </p>
          <Button 
            onClick={handleRepairAllBadges} 
            disabled={repairing || uploading || verifying}
            variant="secondary"
            className="w-full"
          >
            {repairing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Repairing All Badges...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                Repair All NFT Badge Metadata
              </>
            )}
          </Button>
        </div>

        {repairResults && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Repair Results</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700 dark:text-green-300">
              <div>Total Badges: {repairResults.results?.total || 0}</div>
              <div>Metadata Fixed: {repairResults.results?.metadataFixed || 0}</div>
              <div>OpenSea Refreshed: {repairResults.results?.openSeaRefreshed || 0}</div>
              <div>Skipped: {repairResults.results?.skipped || 0}</div>
            </div>
            {repairResults.results?.errors?.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                Errors: {repairResults.results.errors.length}
              </div>
            )}
          </div>
        )}

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
