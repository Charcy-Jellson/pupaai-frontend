"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getUserImages, getImageUrl, deleteImage, type ImageRecord } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";
import { ImageIcon, Trash2, FolderOpen, Calendar } from "lucide-react";

interface SavedImagesGalleryProps {
  userId: string;
  onSelect: (imageUrl: string, imageName: string) => void;
}

export function SavedImagesGallery({ userId, onSelect }: SavedImagesGalleryProps) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadImages();
    }
  }, [userId]);

  const loadImages = async () => {
    setLoading(true);
    const userImages = await getUserImages(userId);
    setImages(userImages);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    const success = await deleteImage(imageToDelete.id, imageToDelete.storage_path);
    
    if (success) {
      setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
      toast({
        title: "Image Deleted",
        description: "The image has been removed from your gallery.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setImageToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No saved images</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload and save images to access them from your gallery.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => {
                const imageUrl = getImageUrl(image.storage_path);
                
                return (
                  <div
                    key={image.id}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border/50 hover:border-violet-500/50 transition-all cursor-pointer"
                    onClick={() => onSelect(imageUrl, image.file_name)}
                  >
                    {/* Image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={image.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-medium text-white truncate">
                          {image.file_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                          <span>{formatBytes(image.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(image.created_at)}</span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageToDelete(image);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{imageToDelete?.file_name}&quot;? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


