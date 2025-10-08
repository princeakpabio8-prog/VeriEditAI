import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  article: {
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    source: { name: string };
    publishedAt: string;
  };
  onQuickVerify: () => void;
}

export const NewsCard = ({ article, onQuickVerify }: NewsCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col h-full">
        {article.urlToImage && (
          <div className="relative h-48 bg-muted overflow-hidden">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {article.source.name}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
          </div>

          <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
            {article.title}
          </h3>

          {article.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
              {article.description}
            </p>
          )}

          <div className="flex gap-2 mt-auto pt-2">
            <Button
              onClick={onQuickVerify}
              className="flex-1"
              size="sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Quick Verify
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
