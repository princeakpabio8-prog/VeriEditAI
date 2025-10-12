import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  fullName?: string | null;
  onUploadComplete?: (url: string) => void;
  onDelete?: () => void;
}

export function AvatarUploader({
  userId,
  currentAvatarUrl,
  fullName,
  onUploadComplete,
  onDelete,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WEBP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });

      onUploadComplete?.(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    try {
      setDeleting(true);

      // Delete from storage
      const oldPath = currentAvatarUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Avatar removed",
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        avatarUrl={currentAvatarUrl}
        fullName={fullName}
        size="xl"
      />
      
      <div className="flex flex-col gap-2">
        <label htmlFor="avatar-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || deleting}
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                {currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
              </>
            )}
          </Button>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </>
            )}
          </Button>
        )}
        
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WEBP. Max 2MB.
        </p>
      </div>
    </div>
  );
}
