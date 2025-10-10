import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    roomType: 'public',
  });

  const handleCreate = async () => {
    if (!user) return;
    
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a room name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lighthouse_rooms')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category as any,
          room_type: formData.roomType as any,
          creator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // CRITICAL: Add creator as owner member
      const { error: memberError } = await supabase
        .from('room_memberships')
        .insert({
          room_id: data.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Failed to add creator as member:', memberError);
        // Don't throw - room was created successfully
      }

      toast({
        title: 'Room created',
        description: 'Your Lighthouse Room is ready',
      });

      onOpenChange(false);
      navigate(`/lighthouse/${data.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--lighthouse-ocean))] border-[hsl(var(--lighthouse-beam))]/30">
        <DialogHeader>
          <DialogTitle>Create Lighthouse Room</DialogTitle>
          <DialogDescription>
            Start a new collaborative verification space
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Climate Data Verification"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will this room focus on?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="politics">Politics</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="climate">Climate</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="media">Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="roomType">Visibility</Label>
            <Select value={formData.roomType} onValueChange={(value) => setFormData({ ...formData, roomType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can join</SelectItem>
                <SelectItem value="workspace">Workspace - Verified members only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={loading}
            className="bg-[hsl(var(--lighthouse-beam))] hover:bg-[hsl(var(--lighthouse-signal))]"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
