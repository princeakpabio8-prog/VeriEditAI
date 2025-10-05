import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface TrustScoreFeedbackProps {
  verificationId?: string;
  userId?: string;
  onFeedbackSubmitted?: () => void;
}

export function TrustScoreFeedback({ verificationId, userId, onFeedbackSubmitted }: TrustScoreFeedbackProps) {
  const [feedbackType, setFeedbackType] = useState<'helpful' | 'not_helpful' | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
    if (!userId || !verificationId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to provide feedback.',
        variant: 'destructive',
      });
      return;
    }

    setFeedbackType(type);
    setShowComment(true);
  };

  const submitFeedback = async () => {
    if (!feedbackType || !userId || !verificationId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('verification_feedback')
        .insert({
          verification_id: verificationId,
          user_id: userId,
          feedback_type: feedbackType,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for helping us improve our trust scoring!',
      });

      setFeedbackType(null);
      setComment('');
      setShowComment(false);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: 'Unable to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showComment && feedbackType) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          <span>Additional Comments (Optional)</span>
        </div>
        <Textarea
          placeholder="What could we improve about this verification?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex gap-2">
          <Button onClick={submitFeedback} disabled={isSubmitting} size="sm">
            Submit Feedback
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowComment(false);
              setFeedbackType(null);
            }}
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Was this verification accurate?</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleFeedback('helpful')}
        className="gap-2"
      >
        <ThumbsUp className="h-4 w-4" />
        Accurate
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleFeedback('not_helpful')}
        className="gap-2"
      >
        <ThumbsDown className="h-4 w-4" />
        Inaccurate
      </Button>
    </div>
  );
}
