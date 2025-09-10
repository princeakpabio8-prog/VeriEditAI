import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  FileText,
  Link2,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateAndSanitize, verificationRateLimiter } from '@/lib/validation';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/contexts/LicenseContext';

interface BulkItem {
  id: string;
  content: string;
  type: 'text' | 'url' | 'file';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  trustScore?: number;
  error?: string;
  fileName?: string;
}

interface BulkVerificationProps {
  onBulkStart?: (items: any[]) => void;
}

export const BulkVerification: React.FC<BulkVerificationProps> = ({ onBulkStart }) => {
  const { user } = useAuth();
  const { incrementUsage, checkFeatureAccess } = useLicense();
  const { toast } = useToast();
  
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bulkText, setBulkText] = useState('');
  const [urlList, setUrlList] = useState('');

  // Check if user has access to bulk verification
  const hasBulkAccess = checkFeatureAccess('bulk_verification');

  const addTextItems = () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
    const newItems: BulkItem[] = lines.map(line => ({
      id: crypto.randomUUID(),
      content: line.trim(),
      type: 'text',
      status: 'pending'
    }));
    
    setItems(prev => [...prev, ...newItems]);
    setBulkText('');
    
    toast({
      title: "Items Added",
      description: `Added ${newItems.length} text items to queue`,
    });
  };

  const addUrlItems = () => {
    if (!urlList.trim()) return;
    
    const urls = urlList.split('\n').filter(line => {
      const trimmed = line.trim();
      try {
        new URL(trimmed);
        return true;
      } catch {
        return false;
      }
    });
    
    const newItems: BulkItem[] = urls.map(url => ({
      id: crypto.randomUUID(),
      content: url.trim(),
      type: 'url',
      status: 'pending'
    }));
    
    setItems(prev => [...prev, ...newItems]);
    setUrlList('');
    
    toast({
      title: "URLs Added",
      description: `Added ${newItems.length} URLs to queue`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newItems: BulkItem[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      content: file.name,
      type: 'file',
      status: 'pending',
      fileName: file.name
    }));

    setItems(prev => [...prev, ...newItems]);
    
    toast({
      title: "Files Added",
      description: `Added ${newItems.length} files to queue`,
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCompleted = () => {
    setItems(prev => prev.filter(item => item.status !== 'completed'));
  };

  const resetAll = () => {
    setItems(prev => prev.map(item => ({ 
      ...item, 
      status: 'pending' as const,
      trustScore: undefined,
      error: undefined
    })));
    setCurrentIndex(0);
    setIsProcessing(false);
    setIsPaused(false);
  };

  const startBulkVerification = async () => {
    if (!hasBulkAccess) {
      toast({
        title: "Feature Locked",
        description: "Bulk verification requires a Basic license or higher.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    const usageResult = await incrementUsage(items.length);
    if (!usageResult.success) {
      toast({
        title: "Usage Limit Exceeded",
        description: usageResult.error || "Not enough verification credits available.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    processBulkItems();
  };

  const processBulkItems = async () => {
    const pendingItems = items.filter(item => item.status === 'pending');
    
    for (let i = 0; i < pendingItems.length; i++) {
      if (isPaused) break;
      
      const item = pendingItems[i];
      setCurrentIndex(i);
      
      // Update item status to processing
      setItems(prev => prev.map(prevItem => 
        prevItem.id === item.id 
          ? { ...prevItem, status: 'processing' }
          : prevItem
      ));

      try {
        // Rate limiting check
        const userId = user?.id || 'anonymous';
        if (!verificationRateLimiter.isAllowed(userId)) {
          throw new Error('Rate limit exceeded');
        }

        // Validate and sanitize
        const validatedData = validateAndSanitize({
          content: item.content,
          contentType: item.type
        });

        // Call verification API
        const { data: result, error } = await supabase.functions.invoke('verify', {
          body: validatedData,
        });

        if (error) throw error;

        // Update item with results
        setItems(prev => prev.map(prevItem => 
          prevItem.id === item.id 
            ? { 
                ...prevItem, 
                status: 'completed',
                trustScore: result.trust_score
              }
            : prevItem
        ));

      } catch (error: any) {
        console.error('Verification error:', error);
        
        // Update item with error
        setItems(prev => prev.map(prevItem => 
          prevItem.id === item.id 
            ? { 
                ...prevItem, 
                status: 'failed',
                error: error.message || 'Verification failed'
              }
            : prevItem
        ));
      }

      // Small delay between verifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsProcessing(false);
    toast({
      title: "Bulk Verification Complete",
      description: "All items have been processed",
    });
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getStatusIcon = (status: BulkItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RotateCcw className="h-4 w-4 text-blue-500" />
        </motion.div>;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: BulkItem['type']) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <Link2 className="h-4 w-4" />;
      case 'file':
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const completedCount = items.filter(item => item.status === 'completed').length;
  const failedCount = items.filter(item => item.status === 'failed').length;
  const progress = items.length > 0 ? ((completedCount + failedCount) / items.length) * 100 : 0;

  if (!hasBulkAccess) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Verification
          </CardTitle>
          <CardDescription>
            Process multiple items simultaneously (Basic license required)
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Unlock bulk verification to process multiple URLs, texts, or files at once.
          </p>
          <Button onClick={() => window.location.href = '/billing'}>
            Upgrade License
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Verification Setup
          </CardTitle>
          <CardDescription>
            Add multiple items to verify simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">Text Content</TabsTrigger>
              <TabsTrigger value="urls">URLs</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-text">Text Content (one per line)</Label>
                <Textarea
                  id="bulk-text"
                  placeholder="Enter multiple text statements, one per line..."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={addTextItems} disabled={!bulkText.trim()}>
                Add Text Items
              </Button>
            </TabsContent>
            
            <TabsContent value="urls" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-list">URLs (one per line)</Label>
                <Textarea
                  id="url-list"
                  placeholder="https://example.com/article1&#10;https://example.com/article2..."
                  value={urlList}
                  onChange={(e) => setUrlList(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={addUrlItems} disabled={!urlList.trim()}>
                Add URLs
              </Button>
            </TabsContent>
            
            <TabsContent value="files" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.csv,.json"
                  onChange={handleFileUpload}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Queue Management */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Verification Queue ({items.length} items)</CardTitle>
                <CardDescription>
                  {completedCount} completed • {failedCount} failed • {items.length - completedCount - failedCount} pending
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={completedCount === 0}
                >
                  Clear Completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAll}
                >
                  Reset All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isProcessing ? (
                <Button
                  onClick={startBulkVerification}
                  disabled={items.length === 0}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Verification
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={togglePause}
                  className="gap-2"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
            </div>

            <Separator />

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      index === currentIndex && isProcessing
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                        : 'bg-muted/30 border-border/50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                  >
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      {getStatusIcon(item.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.fileName || item.content}
                      </p>
                      {item.error && (
                        <p className="text-xs text-red-500 mt-1">{item.error}</p>
                      )}
                    </div>
                    
                    {item.trustScore !== undefined && (
                      <Badge variant="outline">
                        {item.trustScore}% trust
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={isProcessing && item.status === 'processing'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};