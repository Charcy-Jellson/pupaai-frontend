"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useImageEditor } from "@/hooks/use-image-editor";
import { useToast } from "@/hooks/use-toast";
import { supabase, saveImage } from "@/lib/supabase";
import { ImageUploader } from "@/components/image-tools/image-uploader";
import { ImagePreview } from "@/components/image-tools/image-preview";
import { ToolPanel } from "@/components/image-tools/tool-panel";
import { OperationHistory } from "@/components/image-tools/operation-history";
import { SavedImagesGallery } from "@/components/image-tools/saved-images-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FolderOpen, 
  Save, 
  Download, 
  RotateCcw, 
  Trash2,
  ImageIcon,
  Sparkles
} from "lucide-react";

export default function ImageToolsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const editor = useImageEditor();
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      editor.setImage(result, file.type);
      setFileName(file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const handleGallerySelect = useCallback((imageUrl: string, imageName: string) => {
    // Fetch image and convert to data URL
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          editor.setImage(result, blob.type || "image/png");
          setFileName(imageName.replace(/\.[^/.]+$/, ""));
          setActiveTab("upload");
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Failed to load image from gallery",
          variant: "destructive",
        });
      });
  }, [editor, toast]);

  const handleSave = async () => {
    if (!user || !editor.state.currentImage) return;

    setIsSaving(true);
    try {
      // Convert data URL to blob
      const response = await fetch(editor.state.currentImage);
      const blob = await response.blob();
      
      // Create file from blob
      const extension = editor.state.mimeType.split("/")[1] || "png";
      const file = new File([blob], `${fileName || "image"}.${extension}`, {
        type: editor.state.mimeType,
      });

      // Generate unique storage path
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;

      // Save to Supabase
      const result = await saveImage(user.id, file, storagePath);

      if (result) {
        toast({
          title: "Image Saved",
          description: "Your image has been saved to your gallery.",
        });
        setSaveDialogOpen(false);
      } else {
        throw new Error("Failed to save image");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    editor.downloadImage(fileName || "edited-image");
    toast({
      title: "Download Started",
      description: "Your image is being downloaded.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            Image Tools
          </h1>
          <p className="text-muted-foreground mt-1">
            Edit, enhance, and transform your images with AI-powered tools
          </p>
        </div>

        {editor.state.currentImage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.resetToOriginal()}
              disabled={editor.state.operations.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save to Gallery
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Image Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!editor.state.currentImage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key="upload-section"
              >
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "gallery")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload New
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      From Gallery
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="m-0">
                    <ImageUploader onFileSelect={handleFileSelect} />
                  </TabsContent>

                  <TabsContent value="gallery" className="m-0">
                    <SavedImagesGallery
                      userId={user?.id || ""}
                      onSelect={handleGallerySelect}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key="preview-section"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Preview</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.clearImage()}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Image
                  </Button>
                </div>
                <ImagePreview
                  imageUrl={editor.state.currentImage}
                  isProcessing={editor.state.isProcessing}
                  onCrop={editor.cropImage}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Operation History */}
          {editor.state.operations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <OperationHistory
                operations={editor.state.operations}
                onUndo={editor.undoLastOperation}
              />
            </motion.div>
          )}
        </div>

        {/* Right: Tool Panel */}
        <div className="space-y-6">
          <ToolPanel
            hasImage={!!editor.state.currentImage}
            isProcessing={editor.state.isProcessing}
            onRotate={editor.rotateImage}
            onResize={editor.resizeImage}
            onExtractLogo={editor.extractLogo}
            onRemoveBackground={editor.removeBackground}
            onRemoveLogo={editor.removeLogo}
          />

          {/* Quick Actions */}
          {editor.state.currentImage && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  AI Actions
                </CardTitle>
                <CardDescription>
                  Powered by Google Gemini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={editor.removeBackground}
                  disabled={editor.state.isProcessing}
                >
                  Remove Background
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={editor.extractLogo}
                  disabled={editor.state.isProcessing}
                >
                  Extract Logo
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={editor.removeLogo}
                  disabled={editor.state.isProcessing}
                >
                  Remove Logo/Watermark
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Image</DialogTitle>
            <DialogDescription>
              Save your edited image to your gallery for later access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSave}
              disabled={isSaving || !fileName.trim()}
            >
              {isSaving ? "Saving..." : "Save Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


