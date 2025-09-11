import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSkeleton } from "./loading-skeleton";
import { CheckCircle, AlertTriangle, Share, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileVerificationUIProps {
  onVerify: (content: string) => void;
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
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to verify",
        variant: "destructive",
      });
      return;
    }
    onVerify(content);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'flagged': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
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
            Verify content with AI-powered analysis
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Content to Verify
                </label>
                <Textarea
                  placeholder="Enter text, URL, or claim to fact-check..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none text-base"
                  disabled={loading}
                />
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
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
                  "Verify Content"
                )}
              </Button>
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
                  <div className={cn(
                    "text-sm text-muted-foreground transition-all duration-300",
                    isExpanded ? "" : "line-clamp-3"
                  )}>
                    {result.summary}
                  </div>

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
                        Show Full Report <ChevronDown className="h-3 w-3 ml-1" />
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
                    <div className="pt-2 border-t border-border/50">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        Sources ({result.sources.length})
                      </h4>
                      <div className="space-y-1">
                        {result.sources.slice(0, 2).map((source: any, idx: number) => (
                          <div key={idx} className="text-xs text-blue-600 truncate">
                            • {source.title}
                          </div>
                        ))}
                        {result.sources.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{result.sources.length - 2} more sources
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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