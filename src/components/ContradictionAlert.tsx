import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Contradiction {
  claim_id: string;
  claim_text: string;
  confidence: number;
  reasoning: string;
  type: string;
}

interface ContradictionAlertProps {
  contradictions: Contradiction[];
}

export const ContradictionAlert: React.FC<ContradictionAlertProps> = ({ contradictions }) => {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">
              ⚠️ Contradicts {contradictions.length} Previous Claim{contradictions.length > 1 ? 's' : ''}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {contradictions.map((contradiction, idx) => (
            <div key={idx} className="p-4 bg-background rounded-lg border border-destructive/20">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="destructive" className="text-xs">
                  {contradiction.confidence}% Confidence
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {contradiction.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground italic mb-2">
                "{contradiction.claim_text}..."
              </p>
              <p className="text-sm">
                <strong>Why it contradicts:</strong> {contradiction.reasoning}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};
