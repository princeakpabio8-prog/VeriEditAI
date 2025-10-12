import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploaderProps {
  maxImages?: number;
  maxSizeMB?: number;
  onUploadComplete: (urls: string[], metadata: any[]) => void;
  uploadPath: string;
}

export const ImageUploader = ({
  maxImages = 5,
  maxSizeMB = 5,
  onUploadComplete,
  uploadPath,
}: ImageUploaderProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, WEBP, and GIF images are allowed",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles = Array.from(selectedFiles);
      const totalFiles = files.length + newFiles.length;

      if (totalFiles > maxImages) {
        toast({
          title: "Too many images",
          description: `Maximum ${maxImages} images allowed`,
          variant: "destructive",
        });
        return;
      }

      const validFiles = newFiles.filter(validateFile);
      if (validFiles.length === 0) return;

      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
      setFiles([...files, ...validFiles]);
    },
    [files, previews, maxImages]
  );

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (files.length === 0) {
      onUploadComplete([], []);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    const uploadedMetadata: any[] = [];

    try {
      for (const file of files) {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${timestamp}_${sanitizedName}`;
        const filePath = `${uploadPath}/${fileName}`;

        const { data, error } = await supabase.storage
          .from("thread-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("thread-images").getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
        uploadedMetadata.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
        });
      }

      onUploadComplete(uploadedUrls, uploadedMetadata);
      setPreviews([]);
      setFiles([]);
      toast({
        title: "Success",
        description: `${files.length} image(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => document.getElementById("image-upload")?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("border-primary");
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-primary");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-primary");
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop images or click to select
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxImages} images, {maxSizeMB}MB each (JPG, PNG, WEBP, GIF)
        </p>
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && !uploading && (
        <Button type="button" onClick={uploadImages} className="w-full">
          Upload {files.length} Image{files.length > 1 ? "s" : ""}
        </Button>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading images...
        </div>
      )}
    </div>
  );
};
