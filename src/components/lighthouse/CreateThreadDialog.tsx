import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Flame } from 'lucide-react';
import { VerificationRitual } from './VerificationRitual';
import { ImageUploader } from './ImageUploader';
import { supabase } from '@/integrations/supabase/client';

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateThread: (title: string, content: string, autoVerify: boolean) => Promise<any>;
  onThreadCreated?: (threadId: string) => void;
}

export function CreateThreadDialog({ open, onOpenChange, onCreateThread, onThreadCreated }: CreateThreadDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [autoVerify, setAutoVerify] = useState(false);
  const [useRitual, setUseRitual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [createdThreadId, setCreatedThreadId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // If ritual mode is enabled and auto-verify is on, show ritual
    if (useRitual && autoVerify) {
      onOpenChange(false);
      setShowRitual(true);
      return;
    }

    // Standard thread creation
    try {
      setLoading(true);
      const thread = await onCreateThread(title.trim(), content.trim(), autoVerify);
      
      // Update thread with images if any were uploaded
      if (thread?.id && imageUrls.length > 0) {
        await supabase
          .from('room_threads')
          .update({
            image_urls: imageUrls,
            image_metadata: imageMetadata
          })
          .eq('id', thread.id);
      }
      
      toast.success('Thread created successfully');
      
      // Reset form
      setTitle('');
      setContent('');
      setAutoVerify(false);
      setUseRitual(true);
      setImageUrls([]);
      setImageMetadata([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  const handleRitualComplete = async (ritualData: any) => {
    try {
      const thread = await onCreateThread(
        ritualData.title,
        ritualData.content,
        ritualData.autoVerify
      );
      
      // Update thread with images if any were uploaded
      if (thread?.id && imageUrls.length > 0) {
        await supabase
          .from('room_threads')
          .update({
            image_urls: imageUrls,
            image_metadata: imageMetadata
          })
          .eq('id', thread.id);
      }
      
      // Store thread ID for navigation
      if (thread?.id) {
        setCreatedThreadId(thread.id);
      }
      
      // Reset form
      setTitle('');
      setContent('');
      setAutoVerify(false);
      setUseRitual(true);
      setImageUrls([]);
      setImageMetadata([]);
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
      throw error;
    }
  };
  
  const handleImageUpload = (urls: string[], metadata: any[]) => {
    setImageUrls(urls);
    setImageMetadata(metadata);
  };

  const handleViewThread = () => {
    if (createdThreadId && onThreadCreated) {
      onThreadCreated(createdThreadId);
      setShowRitual(false);
      setCreatedThreadId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
          <DialogDescription>
            Start a new discussion in this room
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's your thread about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, claims, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={8}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/5000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Images (Optional)</Label>
            <ImageUploader
              maxImages={5}
              maxSizeMB={5}
              onUploadComplete={handleImageUpload}
              uploadPath="threads"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-verify"
                checked={autoVerify}
                onCheckedChange={(checked) => setAutoVerify(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="auto-verify"
                className="text-sm font-normal cursor-pointer"
              >
                Auto-verify this claim with VeriEdit AI
              </Label>
            </div>

            {autoVerify && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox
                  id="use-ritual"
                  checked={useRitual}
                  onCheckedChange={(checked) => setUseRitual(checked as boolean)}
                  disabled={loading}
                />
                <Label
                  htmlFor="use-ritual"
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Flame className="h-4 w-4 text-[hsl(var(--truth-flame))]" />
                  Perform verification ritual (recommended)
                </Label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : useRitual && autoVerify ? (
                <>
                  <Flame className="mr-2 h-4 w-4" />
                  Begin Ritual
                </>
              ) : (
                'Create Thread'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      <VerificationRitual
        open={showRitual}
        onOpenChange={(open) => {
          setShowRitual(open);
          if (!open) {
            // Reset and reopen create dialog if ritual was cancelled
            onOpenChange(true);
          }
        }}
        onComplete={handleRitualComplete}
        onViewThread={createdThreadId ? handleViewThread : undefined}
      />
    </Dialog>
  );
}
