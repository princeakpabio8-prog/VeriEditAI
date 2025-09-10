import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link2, FileText, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationUploadProps {
  onVerificationStart?: (data: VerificationData) => void;
  isLoading?: boolean;
}

interface VerificationData {
  type: "text" | "url" | "file";
  content: string;
  fileName?: string;
  fileSize?: number;
}

export const VerificationUpload = ({ onVerificationStart, isLoading = false }: VerificationUploadProps) => {
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
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
    if (!textContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text to verify.",
        variant: "destructive"
      });
      return;
    }

    onVerificationStart?.({
      type: "text",
      content: textContent.trim()
    });
  };

  const handleVerifyUrl = () => {
    if (!urlContent.trim()) {
      toast({
        title: "No URL",
        description: "Please enter a URL to verify.",
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlContent);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL.",
        variant: "destructive"
      });
      return;
    }

    onVerificationStart?.({
      type: "url",
      content: urlContent.trim()
    });
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
      </CardHeader>
      <CardContent>
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
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[200px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {textContent.length} characters
              </p>
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
                onChange={(e) => setUrlContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                We'll extract and verify the main content from this page
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