import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Send, MessageSquare, ThumbsUp, ThumbsDown, Lightbulb, Bug, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackData {
  type: 'rating' | 'feature' | 'bug' | 'general';
  rating?: number;
  message: string;
  category?: string;
}

export function UserFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('rating');
  const [rating, setRating] = useState([5]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { value: 'rating', label: 'Rate Experience', icon: Star, description: 'Share your overall experience' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest new features' },
    { value: 'bug', label: 'Report Bug', icon: Bug, description: 'Report issues or problems' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts' }
  ];

  const categories = {
    feature: ['Verification Engine', 'User Interface', 'Mobile App', 'Analytics', 'Export Features', 'Other'],
    bug: ['Verification Failed', 'UI/UX Issue', 'Performance', 'Mobile Issue', 'Export Problem', 'Other'],
    general: ['User Experience', 'Documentation', 'Support', 'Pricing', 'Other']
  };

  const submitFeedback = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit feedback",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide your feedback message",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Since we don't have a feedback table, we'll use console logging for now
      // In production, you'd want to create a feedback table or use external service
      const feedbackData = {
        userId: user.id,
        userEmail: user.email,
        type: feedbackType,
        rating: feedbackType === 'rating' ? rating[0] : undefined,
        message: message.trim(),
        category: category || undefined,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Feedback submitted:', feedbackData);
      
      // Store in localStorage as backup
      const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('userFeedback', JSON.stringify(existingFeedback));

      toast({
        title: "Feedback Sent! 🙏",
        description: "Thank you for helping us improve. We'll review your feedback soon.",
        duration: 5000,
      });

      // Reset form
      setMessage('');
      setCategory('');
      setRating([5]);
      setFeedbackType('rating');
      setOpen(false);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingEmoji = (value: number) => {
    if (value <= 2) return '😞';
    if (value <= 3) return '😐';
    if (value <= 4) return '🙂';
    return '😍';
  };

  const getRatingText = (value: number) => {
    if (value <= 2) return 'Poor';
    if (value <= 3) return 'Fair';
    if (value <= 4) return 'Good';
    return 'Excellent';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Heart className="h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts and suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">What would you like to share?</Label>
            <RadioGroup value={feedbackType} onValueChange={(value: any) => setFeedbackType(value)}>
              <div className="grid grid-cols-2 gap-2">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Label
                      key={type.value}
                      htmlFor={type.value}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        feedbackType === type.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium text-center">{type.label}</span>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Rating Slider for Rating Type */}
          {feedbackType === 'rating' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <Label className="text-sm font-medium">Rate your experience</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl">{getRatingEmoji(rating[0])}</span>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{rating[0]}/5</div>
                    <div className="text-sm text-muted-foreground">{getRatingText(rating[0])}</div>
                  </div>
                </div>
                <Slider
                  value={rating}
                  onValueChange={setRating}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Selection */}
          {(feedbackType === 'feature' || feedbackType === 'bug' || feedbackType === 'general') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Label className="text-sm font-medium mb-2 block">Category (optional)</Label>
              <RadioGroup value={category} onValueChange={setCategory}>
                <div className="space-y-2">
                  {categories[feedbackType as keyof typeof categories]?.map((cat) => (
                    <div key={cat} className="flex items-center space-x-2">
                      <RadioGroupItem value={cat} id={cat} />
                      <Label htmlFor={cat} className="text-sm cursor-pointer">{cat}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </motion.div>
          )}

          {/* Message */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {feedbackType === 'rating' ? 'Tell us more (optional)' : 'Your message'}
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                feedbackType === 'rating' 
                  ? "What did you like or dislike about your experience?"
                  : feedbackType === 'feature'
                  ? "Describe the feature you'd like to see..."
                  : feedbackType === 'bug'
                  ? "Describe the issue you encountered..."
                  : "Share your thoughts with us..."
              }
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitFeedback}
              disabled={submitting}
              className="flex-1 gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}