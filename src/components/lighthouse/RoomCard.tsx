import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, TrendingUp } from 'lucide-react';

interface RoomCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  threadCount: number;
  trustRating: number;
}

export function RoomCard({
  id,
  name,
  description,
  category,
  memberCount,
  threadCount,
  trustRating,
}: RoomCardProps) {
  const navigate = useNavigate();

  const getTrustColor = (rating: number) => {
    if (rating >= 0.9) return 'text-green-400';
    if (rating >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <Card 
      className="group cursor-pointer bg-[hsl(var(--lighthouse-ocean))]/30 border-[hsl(var(--lighthouse-beam))]/20 hover:border-[hsl(var(--lighthouse-beam))]/50 transition-all hover:scale-105"
      onClick={() => navigate(`/lighthouse/${id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-[hsl(var(--lighthouse-beam))] transition-colors">
            {name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{memberCount}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>{threadCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-4 h-4 ${getTrustColor(trustRating)}`} />
            <span className={`font-semibold ${getTrustColor(trustRating)}`}>
              {(trustRating * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
