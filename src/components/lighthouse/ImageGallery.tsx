import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  altPrefix?: string;
}

export const ImageGallery = ({ images, altPrefix = "Image" }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className={`grid gap-2 ${
        images.length === 1 ? "grid-cols-1" :
        images.length === 2 ? "grid-cols-2" :
        "grid-cols-2 sm:grid-cols-3"
      }`}>
        {images.map((url, index) => (
          <div
            key={index}
            className="relative group cursor-pointer overflow-hidden rounded-lg bg-muted aspect-square"
            onClick={() => setSelectedImage(url)}
          >
            <img
              src={url}
              alt={`${altPrefix} ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
