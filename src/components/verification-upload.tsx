import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link2, FileText, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TrustScoreExplanation } from "./trust-score-explanation";
import { validateAndSanitize, verificationRateLimiter } from '@/lib/validation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { parseDocument, isDocumentFile } from '@/lib/document-parser';

interface TemplateConfig {
  id: string;
  name: string;
  industry: 'bank' | 'ngo';
  icon: React.ReactNode;
  description: string;
  verificationFocus: string[];
  suggestedContent: string;
}

interface VerificationUploadProps {
  onVerificationStart?: (data: VerificationData) => void;
  isLoading?: boolean;
  selectedTemplate?: TemplateConfig;
}

interface VerificationData {
  type?: "text" | "url" | "file" | "document";
  contentType?: "text" | "url" | "file" | "image" | "document";
  content: string;
  fileName?: string;
  fileSize?: number;
  metadata?: any;
}

export const VerificationUpload = ({ onVerificationStart, isLoading = false, selectedTemplate }: VerificationUploadProps) => {
  const { user } = useAuth();
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("text");
  const { toast } = useToast();

  // Auto-switch tab and load example content when template is selected
  const loadTemplateExample = (template: TemplateConfig) => {
    const examples: Record<string, { tab: string; content: string }> = {
      'bank-kyc': {
        tab: 'file',
        content: 'Upload ID cards, passports, utility bills, or bank statements for KYC verification'
      },
      'bank-transaction': {
        tab: 'text',
        content: 'Customer claims: "I made a wire transfer of $50,000 to account ending in 4521 on December 15th, but the recipient says they never received it. My account shows the transaction was completed successfully. This is urgent as I need to send money to my elderly mother for her medical expenses."'
      },
      'bank-compliance': {
        tab: 'file',
        content: 'Upload compliance reports, regulatory filings, or policy documents'
      },
      'ngo-grant': {
        tab: 'text',
        content: 'Grant Proposal Excerpt: "Our organization has successfully reduced malaria cases by 87% in rural communities over the past 3 years. We served 15,000 beneficiaries across 50 villages. Independent studies from WHO confirm our intervention reduced transmission rates by half. We request $500,000 to expand to 100 more villages, projecting to save 2,000 lives annually based on our proven track record."'
      },
      'ngo-program': {
        tab: 'text',
        content: 'Program Report: "In Q4 2024, we distributed 10,000 mosquito nets to 5,000 households. Post-distribution surveys show 95% household coverage and 80% consistent usage rates. Our field monitors visited 500 randomly selected homes to verify net usage. Hospital records indicate a 60% reduction in malaria-related admissions in program areas compared to control regions."'
      },
      'ngo-media': {
        tab: 'text',
        content: 'Social Media Post to Verify: "Breaking: New study reveals that drinking lemon water every morning cures cancer in 90% of patients. Pharmaceutical companies don\'t want you to know this simple trick! Share this to save lives. #NaturalHealing #CancerCure"'
      }
    };

    const example = examples[template.id];
    if (example) {
      setActiveTab(example.tab);
      if (example.tab === 'text') {
        setTextContent(example.content);
      }
    }
  };

  // Auto-load example when template changes
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateExample(selectedTemplate);
    }
  }, [selectedTemplate]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "image/webp"
    ];

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please select a PDF, text file, or image. Word documents coming soon!",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleVerifyText = () => {
    setValidationErrors([]);
    
    // Rate limiting check
    const userId = user?.id || 'anonymous';
    if (!verificationRateLimiter.isAllowed(userId)) {
      const resetTime = verificationRateLimiter.getResetTime(userId);
      const resetDate = resetTime ? new Date(resetTime) : null;
      
      toast({
        title: "Rate Limit Exceeded",
        description: `Too many verification attempts. Try again ${resetDate ? resetDate.toLocaleTimeString() : 'later'}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const validatedData = validateAndSanitize({
        content: textContent,
        contentType: 'text'
      });

      onVerificationStart?.({
        ...validatedData,
        type: validatedData.contentType
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Validation failed';
      setValidationErrors([errorMessage]);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleVerifyUrl = async () => {
    setValidationErrors([]);
    
    // Rate limiting check
    const userId = user?.id || 'anonymous';
    if (!verificationRateLimiter.isAllowed(userId)) {
      const resetTime = verificationRateLimiter.getResetTime(userId);
      const resetDate = resetTime ? new Date(resetTime) : null;
      
      toast({
        title: "Rate Limit Exceeded",
        description: `Too many verification attempts. Try again ${resetDate ? resetDate.toLocaleTimeString() : 'later'}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate URL format first
      const validatedData = validateAndSanitize({
        content: urlContent,
        contentType: 'url'
      });

      // Show fetching toast
      toast({
        title: "Fetching content from URL...",
        description: "Please wait while we retrieve the page content",
      });

      // Fetch URL content using edge function
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('fetch-url-content', {
        body: { url: urlContent }
      });

      if (error || !data?.success) {
        const errorMessage = data?.error || error?.message || 'Failed to fetch URL content';
        toast({
          title: "Unable to fetch URL",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Pass the fetched text content to verification with original URL in metadata
      onVerificationStart?.({
        content: data.text,
        contentType: 'text',
        type: 'text',
        metadata: {
          originalUrl: urlContent,
          contentLength: data.length,
          fetchedFromUrl: true
        }
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Validation failed';
      setValidationErrors([errorMessage]);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleVerifyFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to verify.",
        variant: "destructive"
      });
      return;
    }

    // Check if it's an image file
    const isImage = selectedFile.type.startsWith('image/');
    
    if (isImage) {
      // Handle image verification with Google Vision API
      try {
        const base64 = await fileToBase64(selectedFile);
        onVerificationStart?.({
          type: "file",
          contentType: "image",
          content: base64,
          fileName: selectedFile.name,
          fileSize: selectedFile.size
        });
      } catch (error) {
        toast({
          title: "Error processing image",
          description: "Failed to process the image file.",
          variant: "destructive"
        });
      }
    } else if (isDocumentFile(selectedFile)) {
      // Handle document verification (PDF, Word, Text)
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

        onVerificationStart?.({
          type: "file",
          contentType: "document",
          content: parsed.text,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          metadata: parsed.metadata,
        });
      } catch (error: any) {
        const errorMsg = error.message || "Could not read the document.";
        let description = errorMsg;
        
        // Provide specific guidance for common errors
        if (errorMsg.includes('worker') || errorMsg.includes('module')) {
          description = "PDF processing error. For images, try uploading the original JPG/PNG instead of a PDF.";
        } else if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
          description = "This document is password-protected. Please unlock it first.";
        } else if (errorMsg.includes('HEIC')) {
          description = "HEIC format not supported. Please convert to JPG or PNG first.";
        }
        
        toast({
          title: "Document Parsing Failed",
          description,
          variant: "destructive",
        });
      }
    } else {
      // Unsupported file type
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, text file, or image.",
        variant: "destructive",
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-2xl mx-auto bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-foreground">
            Verify Content Authenticity
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Upload text, URLs, or files to get an AI-powered trust score
          </p>
          <div className="flex justify-center mt-3">
            <TrustScoreExplanation type="dialog" />
          </div>
        </CardHeader>
      <CardContent>
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Template Context Display */}
        {selectedTemplate && (
          <Card className="border-primary/50 bg-primary/5 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{selectedTemplate.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{selectedTemplate.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{selectedTemplate.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.verificationFocus.map((focus, idx) => (
                      <span key={idx} className="text-xs bg-background px-2 py-0.5 rounded">
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            {selectedTemplate && (
              <div className="bg-muted/50 p-3 rounded-md mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  💡 <strong>Template Guidance:</strong> {selectedTemplate.suggestedContent}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadTemplateExample(selectedTemplate)}
                  className="text-xs"
                >
                  Load Example Content
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                placeholder={selectedTemplate ? selectedTemplate.suggestedContent : "Paste the text content you want to verify..."}
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  setValidationErrors([]);
                }}
                className={`min-h-[200px] resize-y ${validationErrors.length > 0 ? 'border-destructive' : ''}`}
                maxLength={50000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min 10 characters required</span>
                <span>{textContent.length}/50,000</span>
              </div>
            </div>
            <Button 
              onClick={handleVerifyText} 
              disabled={isLoading || !textContent.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Text"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-content">Website URL</Label>
              <Input
                id="url-content"
                type="url"
                placeholder="https://example.com/article"
                value={urlContent}
                onChange={(e) => {
                  setUrlContent(e.target.value);
                  setValidationErrors([]);
                }}
                className={validationErrors.length > 0 ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Only HTTP and HTTPS URLs are supported
              </p>
            </div>
            <Button 
              onClick={handleVerifyUrl} 
              disabled={isLoading || !urlContent.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify URL"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            {selectedTemplate && (
              <div className="bg-muted/50 p-3 rounded-md mb-4">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Template Guidance:</strong> {selectedTemplate.suggestedContent}
                </p>
              </div>
            )}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".txt,.pdf,.jpg,.jpeg,.png,.gif,.webp"
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {selectedFile ? selectedFile.name : "Drop your file here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedFile ? (
                  `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                ) : (
                  "or click to browse • PDF, Text, Images up to 10MB"
                )}
              </p>
              {selectedFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove File
                </Button>
              )}
            </div>
            <Button 
              onClick={handleVerifyFile} 
              disabled={isLoading || !selectedFile}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify File"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </motion.div>
  );
};