"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useImageEditor } from "@/hooks/use-image-editor";
import { useToast } from "@/hooks/use-toast";
import { 
  saveFile, 
  getAllUserFolders, 
  createFolder,
  getImageDimensions,
  type FolderRecord 
} from "@/lib/supabase";
import { ImageUploader } from "@/components/image-tools/image-uploader";
import { ImagePreview } from "@/components/image-tools/image-preview";
import { ToolPanel } from "@/components/image-tools/tool-panel";
import { OperationHistory } from "@/components/image-tools/operation-history";
import { SavedImagesGallery } from "@/components/image-tools/saved-images-gallery";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  FolderOpen, 
  Save, 
  Download, 
  RotateCcw, 
  Trash2,
  ImageIcon,
  Folder,
  Plus
} from "lucide-react";

export default function ImageToolsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const editor = useImageEditor();
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewRotation, setPreviewRotation] = useState(0);
  
  // New folder creation
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Load user folders
  useEffect(() => {
    if (user?.id) {
      loadFolders();
    }
  }, [user?.id]);

  const loadFolders = async () => {
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    setFolders(userFolders);
  };

  const handleCreateFolder = async () => {
    if (!user?.id || !newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    const folder = await createFolder(user.id, newFolderName.trim());
    
    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setSelectedFolderId(folder.id);
      setNewFolderName("");
      setShowNewFolderInput(false);
      toast({
        title: "Folder Created",
        description: `"${folder.name}" has been created.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create folder.",
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  };

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
      .catch(() => {
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
      const finalFileName = `${fileName || "image"}.${extension}`;
      const file = new File([blob], finalFileName, {
        type: editor.state.mimeType,
      });

      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Save to Supabase with folder
      const result = await saveFile(
        user.id, 
        file, 
        selectedFolderId,
        finalFileName,
        dimensions
      );

      if (result) {
        const folderName = selectedFolderId 
          ? folders.find(f => f.id === selectedFolderId)?.name || "folder"
          : "root";
        toast({
          title: "Image Saved",
          description: `Your image has been saved to "${folderName}".`,
        });
        setSaveDialogOpen(false);
        setFileName("");
        setSelectedFolderId(null);
      } else {
        throw new Error("Failed to save image");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save image. Please check your Supabase configuration.",
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
                  previewRotation={previewRotation}
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
            onRotate={(degrees) => {
              editor.rotateImage(degrees);
              setPreviewRotation(0);
            }}
            onResize={editor.resizeImage}
            onExtractLogo={editor.extractLogo}
            onRemoveBackground={editor.removeBackground}
            onRemoveLogo={editor.removeLogo}
            onPreviewRotation={setPreviewRotation}
            onCancelPreview={() => setPreviewRotation(0)}
          />
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-violet-400" />
              Save Image
            </DialogTitle>
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
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Save to Folder
              </Label>
              
              {!showNewFolderInput ? (
                <div className="space-y-2">
                  <Select 
                    value={selectedFolderId || "root"} 
                    onValueChange={(v) => setSelectedFolderId(v === "root" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          <span>Root (No folder)</span>
                        </div>
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            <span>{folder.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowNewFolderInput(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Folder
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFolder();
                        if (e.key === "Escape") {
                          setShowNewFolderInput(false);
                          setNewFolderName("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || isCreatingFolder}
                    >
                      {isCreatingFolder ? "..." : "Create"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
