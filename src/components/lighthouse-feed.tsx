import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Radio,
  RefreshCw,
  Search,
  ExternalLink,
  Share2,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareModal } from "@/components/share-modal";
import { TrustScoreDisplay } from "@/components/trust-score-display";

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  summary: string;
  source: string;
  source_url: string;
  category: string;
  published_at: string;
  trust_score: number | null;
  verification_id: string | null;
  is_verified: boolean;
  image_url: string | null;
  metadata: any;
}

type SortOption = "latest" | "trusted" | "source";
type FilterOption = "all" | "verified" | "unverified";

const CATEGORIES = ["All", "Politics", "Technology", "Health", "Business", "Science", "Sports", "General"];

export function LighthouseFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [verifyingArticleId, setVerifyingArticleId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<{ [key: string]: number }>({});
  const [verificationSummaries, setVerificationSummaries] = useState<{ [key: string]: string }>({});
  const [showSummaryFor, setShowSummaryFor] = useState<string | null>(null);
  const [shareArticle, setShareArticle] = useState<NewsArticle | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("news_feed")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to load news articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      toast({
        title: "Fetching Latest News",
        description: "Updating feed from RSS sources...",
      });

      const { data, error } = await supabase.functions.invoke("fetch-rss-news");

      if (error) throw error;

      toast({
        title: "Feed Updated",
        description: `Added ${data.inserted} new articles`,
      });

      await fetchArticles();
    } catch (error) {
      console.error("Error refreshing feed:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not fetch latest news",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerify = async (article: NewsArticle) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to verify articles",
        variant: "destructive",
      });
      return;
    }

    setVerifyingArticleId(article.id);

    try {
      const { data, error } = await supabase.functions.invoke("verify", {
        body: { 
          content: `${article.title}\n\n${article.summary}`,
          contentType: "text",
          source_url: article.link,
          user_id: user.id
        },
      });

      if (error) throw error;

      const trustScore = data.confidence || 0;
      const verificationId = data.verificationId;
      const summary = data.summary || "Verification complete.";

      // Store the score and summary for animated display
      setVerificationResults(prev => ({ ...prev, [article.id]: trustScore }));
      setVerificationSummaries(prev => ({ ...prev, [article.id]: summary }));

      // Update news_feed with verification results
      const { error: updateError } = await supabase
        .from("news_feed")
        .update({
          trust_score: trustScore,
          verification_id: verificationId,
          is_verified: true,
        })
        .eq("id", article.id);

      if (updateError) throw updateError;

      // Keep animation visible for 2.5 seconds
      setTimeout(() => {
        setVerifyingArticleId(null);
        // Show summary popup (stays until manually closed)
        setShowSummaryFor(article.id);
      }, 2500);

      await fetchArticles();
    } catch (error) {
      console.error("Error verifying article:", error);
      toast({
        title: "Verification Failed",
        description: "Could not verify article. Please try again.",
        variant: "destructive",
      });
      setVerifyingArticleId(null);
      setVerificationResults(prev => {
        const { [article.id]: _, ...rest } = prev;
        return rest;
      });
      setVerificationSummaries(prev => {
        const { [article.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const getTrustScoreColor = (score: number | null) => {
    if (!score) return "hsl(var(--muted))";
    if (score >= 81) return "hsl(142, 76%, 36%)"; // Green
    if (score >= 61) return "hsl(48, 96%, 53%)"; // Yellow
    if (score >= 41) return "hsl(25, 95%, 53%)"; // Orange
    return "hsl(0, 84%, 60%)"; // Red
  };

  const getTrustScoreLabel = (score: number | null) => {
    if (!score) return "Not Verified";
    if (score >= 81) return "Verified";
    if (score >= 61) return "Moderate";
    if (score >= 41) return "Questionable";
    return "Unreliable";
  };

  const filteredArticles = articles
    .filter((article) => {
      // Category filter
      if (selectedCategory !== "All" && article.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !article.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Verification filter
      if (filterBy === "verified" && !article.is_verified) return false;
      if (filterBy === "unverified" && article.is_verified) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      }
      if (sortBy === "trusted") {
        return (b.trust_score || 0) - (a.trust_score || 0);
      }
      if (sortBy === "source") {
        return a.source.localeCompare(b.source);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Radio className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  The Lighthouse Feed
                </h1>
                <p className="text-sm text-muted-foreground">Verified Global Stories</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {filterBy === "all" ? "All" : filterBy === "verified" ? "Verified" : "Unverified"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterBy("all")}>All Articles</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("verified")}>Verified Only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("unverified")}>Unverified Only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Sort
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("latest")}>Latest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("trusted")}>Most Trusted</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("source")}>By Source</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Articles Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow group overflow-hidden">
                    {/* Article Image */}
                    {article.image_url && (
                      <div className="relative h-48 w-full overflow-hidden bg-muted">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {article.is_verified && article.trust_score && article.trust_score > 80 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-600/90 backdrop-blur-sm hover:bg-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          {article.source}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(article.published_at), "MMM dd, yyyy")}
                        </div>
                      </div>

                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>

                      {article.category && (
                        <Badge variant="outline" className="w-fit">
                          {article.category}
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.summary}
                      </p>

                      {/* Trust Score Meter */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Trust Score</span>
                          <div className="flex items-center gap-2">
                            {article.is_verified ? (
                              <>
                                <span className="font-semibold" style={{ color: getTrustScoreColor(article.trust_score) }}>
                                  {article.trust_score}/100
                                </span>
                                {article.trust_score && article.trust_score > 80 && !article.image_url && (
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not verified</span>
                            )}
                          </div>
                        </div>
                        <Progress
                          value={article.trust_score || 0}
                          className="h-2"
                          style={{
                            // @ts-ignore
                            "--progress-background": getTrustScoreColor(article.trust_score),
                          }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 relative">
                        {!article.is_verified && verifyingArticleId === article.id ? (
                          <div className="flex-1 flex items-center justify-center py-4">
                            <TrustScoreDisplay 
                              score={verificationResults[article.id] || 0}
                              size="sm"
                              showAnimation={true}
                              showLabel={false}
                            />
                          </div>
                        ) : !article.is_verified ? (
                          <Button
                            size="sm"
                            onClick={() => handleVerify(article)}
                            className="flex-1 gap-2"
                            disabled={verifyingArticleId !== null}
                          >
                            <Sparkles className="h-3 w-3" />
                            Verify Now
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(article.link, "_blank")}
                          className={article.is_verified ? "flex-1" : ""}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Read
                        </Button>
                        {article.is_verified && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShareArticle(article)}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        )}

                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && filteredArticles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Radio className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or refresh to load new stories
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Feed
            </Button>
          </motion.div>
        )}
      </div>

      {/* Share Modal */}
      {shareArticle && shareArticle.verification_id && (
        <ShareModal
          isOpen={!!shareArticle}
          onClose={() => setShareArticle(null)}
          verificationId={shareArticle.verification_id}
        />
      )}

      {/* Executive Summary Dialog */}
      <Dialog 
        open={showSummaryFor !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowSummaryFor(null);
            setVerificationResults({});
            setVerificationSummaries({});
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {showSummaryFor && verificationResults[showSummaryFor] !== undefined && (
                <div className="flex-shrink-0">
                  {verificationResults[showSummaryFor] >= 70 ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : verificationResults[showSummaryFor] >= 40 ? (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              )}
              <DialogTitle>Executive Summary</DialogTitle>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] md:max-h-[60vh] pr-4">
            {showSummaryFor && verificationSummaries[showSummaryFor] && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                {verificationSummaries[showSummaryFor]}
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
