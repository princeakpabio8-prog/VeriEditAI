import { useState, useCallback } from "react";
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

interface VerificationUploadProps {
  onVerificationStart?: (data: VerificationData) => void;
  isLoading?: boolean;
}

interface VerificationData {
  type?: "text" | "url" | "file";
  contentType?: "text" | "url" | "file";
  content: string;
  fileName?: string;
  fileSize?: number;
}

export const VerificationUpload = ({ onVerificationStart, isLoading = false }: VerificationUploadProps) => {
  const { user } = useAuth();
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

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
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/json"
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
        description: "Please select a text, PDF, Word, CSV, or JSON file.",
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

  const handleVerifyUrl = () => {
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
        content: urlContent,
        contentType: 'url'
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

  const handleVerifyFile = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to verify.",
        variant: "destructive"
      });
      return;
    }

    onVerificationStart?.({
      type: "file",
      content: selectedFile.name,
      fileName: selectedFile.name,
      fileSize: selectedFile.size
    });
  };

  return (
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
        
        <Tabs defaultValue="text" className="w-full">
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
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                placeholder="Paste the text content you want to verify..."
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
                accept=".txt,.pdf,.doc,.docx,.csv,.json"
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {selectedFile ? selectedFile.name : "Drop your file here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedFile ? (
                  `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                ) : (
                  "or click to browse • PDF, Word, Text, CSV, JSON up to 10MB"
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
  );
};