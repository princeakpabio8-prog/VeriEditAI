import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import DOMPurify from 'dompurify';
import { LoadingSkeleton } from "./loading-skeleton";
import { TrustScoreFeedback } from "./trust-score-feedback";
import { validateAndSanitize } from "@/lib/validation";
import { useAuth } from "@/contexts/AuthContext";
import { lower } from "@/lib/string";
import { parseDocument, isDocumentFile } from "@/lib/document-parser";
import { 
  CheckCircle, 
  AlertTriangle,
  Info,
  Clock,
  Share, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Upload,
  Camera,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileVerificationUIProps {
  onVerify: (data: any) => void;
  loading: boolean;
  result: any;
  error: string | null;
}

export function MobileVerificationUI({ 
  onVerify, 
  loading, 
  result, 
  error 
}: MobileVerificationUIProps) {
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result]);

  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB - aligned with backend
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Unsupported file type. Please use PDF, text, or image files.";
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        toast({
          title: "Invalid File",
          description: error,
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setValidationError("");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleTextVerify = () => {
    if (!textContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to verify",
        variant: "destructive",
      });
      return;
    }

    try {
      const validation = validateAndSanitize({
        content: textContent,
        contentType: 'text' as const
      });

      console.log('Starting text verification:', textContent.slice(0, 50) + '...');
      onVerify({
        type: 'text',
        content: validation.content,
      });
    } catch (error: any) {
      setValidationError(error.message || 'Invalid content');
      toast({
        title: "Validation Error",
        description: error.message || 'Invalid content',
        variant: "destructive",
      });
    }
  };

  const handleUrlVerify = () => {
    if (!urlContent.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to verify",
        variant: "destructive",
      });
      return;
    }

    try {
      const validation = validateAndSanitize({
        content: urlContent,
        contentType: 'url' as const
      });

      console.log('Starting URL verification:', urlContent);
      onVerify({
        type: 'url',
        content: validation.content,
      });
    } catch (error: any) {
      setValidationError(error.message || 'Invalid URL format');
      toast({
        title: "Validation Error",
        description: error.message || 'Invalid URL format',
        variant: "destructive",
      });
    }
  };

  const handleFileVerify = async () => {
    if (!selectedFile) {
      toast({
        title: "File Required",
        description: "Please select a file to verify",
        variant: "destructive",
      });
      return;
    }

    try {
      const isImage = (selectedFile.type || '').startsWith('image/');
      console.log('Starting file verification:', selectedFile.name, 'isImage:', isImage);

      if (isImage) {
        // For images, convert to base64 and set contentType to 'image'
        const fileToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
            };
            reader.onerror = error => reject(error);
          });
        };

        const base64Content = await fileToBase64(selectedFile);
        console.log('Image converted to base64, length:', base64Content.length);
        
        onVerify({
          type: 'file',
          content: base64Content,
          contentType: 'image',
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        });
      } else {
        // For non-image files, extract text content when possible and send actual content
        console.log('Processing non-image file:', selectedFile.name, selectedFile.type);

        if (selectedFile.type === 'text/plain') {
          const readText = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = () => resolve((reader.result as string) || '');
              reader.onerror = (e) => reject(e);
            });
          };

          const rawText = await readText(selectedFile);
          try {
            const validation = validateAndSanitize({
              content: rawText,
              contentType: 'file' as const,
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
            });

            onVerify({
              type: 'file',
              content: validation.content,
              contentType: 'file',
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
            });
          } catch (e: any) {
            console.error('File validation failed:', e);
            toast({
              title: 'Validation Error',
              description: e.message || 'Invalid file content',
              variant: 'destructive',
            });
          }
        } else if (isDocumentFile(selectedFile)) {
          // Parse documents (PDF, Word, etc.)
          try {
            toast({
              title: "Processing document...",
              description: "Extracting text from your document",
            });

            const parsed = await parseDocument(selectedFile);

            if (!parsed.metadata.extractionSuccess || !parsed.text || parsed.text.trim().length === 0) {
              toast({
                title: "Empty or Unreadable Document",
                description: parsed.metadata.errorMessage || "Could not extract text from the document",
                variant: "destructive",
              });
              return;
            }

            onVerify({
              type: 'file',
              content: parsed.text,
              contentType: 'document',
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
              metadata: parsed.metadata,
            });
          } catch (error: any) {
            toast({
              title: 'Document Parsing Failed',
              description: error.message || 'Could not read the document',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Unsupported File Type',
            description: 'Please upload an image, PDF, or text file.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('File verification error:', error);
      toast({
        title: "File Error",
        description: "Failed to process the selected file",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | undefined) => {
    // Enhanced null-safety using lower helper
    const safeStatus = lower(status);
    if (!safeStatus) return 'bg-gray-500/10 text-gray-700 border-gray-200';
    
    switch (safeStatus) {
      case 'completed': 
      case 'verified': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'flagged': 
      case 'disputed': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'inconclusive': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    // Enhanced null-safety using lower helper
    const safeStatus = lower(status);
    if (!safeStatus) return <Info className="h-4 w-4" />;
    
    switch (safeStatus) {
      case 'completed': 
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'flagged': 
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      case 'inconclusive': return <Clock className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const handleOpenSource = (url: string) => {
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Unable to open source",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
      console.error('Failed to open source:', error);
    }
  };

  const toggleSourceExpansion = (index: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Verification Result',
        text: `Verification Result: ${result?.confidence}% confidence`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(
        `Verification Result: ${result?.confidence}% confidence - ${window.location.href}`
      );
      toast({
        title: "Link Copied",
        description: "Verification result link copied to clipboard",
      });
    }
  };

  if (!isMobile) {
    return null; // Only render on mobile
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            AI Fact Checker
          </h1>
          <p className="text-muted-foreground text-sm">
            Verify text, URLs, or files with AI-powered analysis
          </p>
        </motion.div>

        {/* Input Card with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="text" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="file" className="text-xs">
                    <Upload className="h-3 w-3 mr-1" />
                    File
                  </TabsTrigger>
                </TabsList>

                {/* Text Input */}
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Content to Verify
                    </label>
                    <Textarea
                      placeholder="Enter text or claim to fact-check..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-[100px] resize-none text-base"
                      disabled={loading}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {textContent.length}/5000
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleTextVerify}
                    disabled={loading || !textContent.trim()}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "Verify Text"
                    )}
                  </Button>
                </TabsContent>

                {/* URL Input */}
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      URL to Verify
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/article"
                      value={urlContent}
                      onChange={(e) => setUrlContent(e.target.value)}
                      className="text-base h-12"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a web link to verify its content
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleUrlVerify}
                    disabled={loading || !urlContent.trim()}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "Verify URL"
                    )}
                  </Button>
                </TabsContent>

                {/* File Input */}
                <TabsContent value="file" className="space-y-4">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground">
                      File to Verify
                    </label>
                    
                    {!selectedFile ? (
                      <div className="space-y-3">
                        {/* File Upload Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-12 flex flex-col items-center justify-center gap-1"
                            disabled={loading}
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-xs">Choose File</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => cameraInputRef.current?.click()}
                            className="h-12 flex flex-col items-center justify-center gap-1"
                            disabled={loading}
                          >
                            <Camera className="h-4 w-4" />
                            <span className="text-xs">Camera</span>
                          </Button>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".pdf,.txt,.jpg,.jpeg,.png,.webp"
                        />
                        
                        <input
                          ref={cameraInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                        />

                        <p className="text-xs text-muted-foreground text-center">
                          Supports PDF, Word docs, images (max 10MB)
                        </p>
                      </div>
                    ) : (
                      /* Selected File Display */
                      <div className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleFileVerify}
                    disabled={loading || !selectedFile}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "Verify File"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Validation Error */}
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700"
                >
                  {validationError}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <LoadingSkeleton variant="analysis" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-sm">{error}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-semibold text-base">
                        Verification Result
                      </span>
                    </div>
                    <Badge 
                      className={cn("text-xs font-medium", getStatusColor(result.status))}
                    >
                      {result.confidence}% Confidence
                    </Badge>
                  </div>

                  {/* Summary Preview */}
                  <div className="text-sm text-muted-foreground">
                    {result.summary}
                  </div>

                  {/* Analysis Points */}
                  {isExpanded && result.analysis_points && result.analysis_points.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 border-t border-border/30"
                    >
                      <h4 className="text-xs font-semibold text-foreground">Key Findings:</h4>
                      <ul className="space-y-2">
                        {result.analysis_points.map((point: string, idx: number) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex gap-2 items-start text-xs"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span 
                              className="text-muted-foreground flex-1"
                              dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(
                                  point.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                                  { ALLOWED_TAGS: ['strong'], ALLOWED_ATTR: ['class'] }
                                )
                              }}
                            />
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Expand/Collapse */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full h-8 text-xs font-medium text-muted-foreground"
                  >
                    {isExpanded ? (
                      <>
                        Show Less <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Show Details <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareResult}
                      className="h-9 text-xs font-medium"
                    >
                      <Share className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs font-medium"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>

                  {/* Sources */}
                  {result.sources?.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        Sources ({result.sources.length})
                      </h4>
                      <div className="space-y-3">
                        {result.sources.slice(0, 3).map((source: any, idx: number) => {
                          const isExpanded = expandedSources.has(idx);
                          const hasFullContent = source.full_content && source.full_content.length > (source.content_snippet?.length || 0);
                          
                          return (
                            <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2 border border-border/30">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium line-clamp-2 flex-1">
                                  {source.title}
                                </span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {source.reliability_score}%
                                </Badge>
                              </div>
                              
                              {source.content_snippet && (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    {isExpanded && hasFullContent 
                                      ? source.full_content 
                                      : source.content_snippet}
                                  </p>
                                  
                                  {hasFullContent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleSourceExpansion(idx)}
                                      className="h-6 text-xs px-2"
                                    >
                                      {isExpanded ? 'Show Less' : 'Show More'}
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenSource(source.url)}
                                className="w-full h-8 text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Read Full Article
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* User Feedback */}
                  <div className="pt-2 border-t border-border/50">
                    <TrustScoreFeedback
                      verificationId={result.id}
                      userId={useAuth().user?.id}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-muted-foreground">
            Powered by AI • Secure • Fast
          </p>
        </motion.div>
      </div>
    </div>
  );
}