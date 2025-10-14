import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useReverseImageSearch } from '@/hooks/useReverseImageSearch';

interface ReverseSearchResultsProps {
  verificationId: string;
}

export const ReverseImageSearchResults = ({ verificationId }: ReverseSearchResultsProps) => {
  const { data: reverseSearch, isLoading } = useReverseImageSearch(verificationId);

  if (isLoading) {
    return <div className="animate-pulse text-sm text-muted-foreground">Loading reverse image search...</div>;
  }

  const matchingUrls = reverseSearch?.matching_urls as any[] || [];
  const visuallySimilarUrls = reverseSearch?.visually_similar_urls as any[] || [];
  const bestGuess = reverseSearch?.best_guess_labels as any[] || [];
  const totalMatches = reverseSearch?.total_matches || 0;
  const isWidelyUsed = totalMatches > 20;

  // Show "no results" only if we have no matches AND no visually similar images
  if (!reverseSearch || (totalMatches === 0 && visuallySimilarUrls.length === 0)) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5" />
            Reverse Image Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No matching images found online. This may be an original image.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isWidelyUsed ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10" : "border-border"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between text-lg">
          <span className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Reverse Image Search
          </span>
          {isWidelyUsed && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Widely Used
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Matches: </span>
            <span className="font-semibold">{totalMatches}</span>
          </div>
          {reverseSearch.oldest_url && (
            <div>
              <span className="text-muted-foreground">First Seen: </span>
              <a 
                href={reverseSearch.oldest_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                {new URL(reverseSearch.oldest_url).hostname}
              </a>
            </div>
          )}
        </div>

        {/* Best Guess Labels */}
        {bestGuess.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Google's Best Guess:</p>
            <div className="flex flex-wrap gap-2">
              {bestGuess.map((label: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {label.label || label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warning for widely used images */}
        {isWidelyUsed && (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              ⚠️ <strong>Context Alert:</strong> This image appears on {totalMatches}+ websites. 
              It may be a stock photo, recycled content, or out-of-context usage.
            </p>
          </div>
        )}

        {/* Exact Matching Pages */}
        {matchingUrls.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">
              Exact Matches ({matchingUrls.length} pages):
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {matchingUrls.slice(0, 10).map((match: any, idx: number) => (
                <a
                  key={idx}
                  href={match.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded hover:bg-accent border border-border transition"
                >
                  <ExternalLink className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{match.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Visually Similar Images */}
        {visuallySimilarUrls.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">
              Visually Similar Images ({visuallySimilarUrls.length} found):
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {visuallySimilarUrls.slice(0, 10).map((match: any, idx: number) => (
                <a
                  key={`similar-${idx}`}
                  href={match.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded hover:bg-accent border border-border transition"
                >
                  <ExternalLink className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{match.title || 'Similar Image'}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
