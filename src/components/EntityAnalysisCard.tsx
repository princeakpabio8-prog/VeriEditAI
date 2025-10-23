import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, MapPin, Tag } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface EntityAnalysisCardProps {
  entities: any;
}

export const EntityAnalysisCard = ({ entities }: EntityAnalysisCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!entities || typeof entities !== 'object') {
    return null;
  }

  const people = entities.people || entities.persons || [];
  const organizations = entities.organizations || entities.orgs || [];
  const locations = entities.locations || entities.places || [];
  const topics = entities.topics || entities.tags || entities.keywords || [];

  const hasEntities = people.length > 0 || organizations.length > 0 || locations.length > 0 || topics.length > 0;

  if (!hasEntities) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Entity Analysis
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {people.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">People</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map((person: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      👤 {person}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {organizations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Organizations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {organizations.map((org: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      🏢 {org}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {locations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Locations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((location: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      📍 {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {topics.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Topics</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="gap-1">
                      🏷️ {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
