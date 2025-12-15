"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useMultiImageEditor } from "@/hooks/use-multi-image-editor";
import { useUserRole } from "@/hooks/use-user-role";
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
import { MultiImageGrid } from "@/components/image-tools/multi-image-grid";
import { SavedImagesGallery } from "@/components/image-tools/saved-images-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  Plus,
  ArrowLeft,
  Loader2
} from "lucide-react";

export default function ImageToolsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const editor = useMultiImageEditor();
  const { role } = useUserRole();
  const pathname = usePathname();
  const t = useTranslations("imageTools");
  const tc = useTranslations("common");
  const isAdmin = role === "admin";
  
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewRotation, setPreviewRotation] = useState(0);
  
  // Batch operation progress
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0, active: false });
  
  // New folder creation
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Extract logo options
  const [extractLogoRemoveBg, setExtractLogoRemoveBg] = useState(true);
  
  // Add More Dialog
  const [addMoreDialogOpen, setAddMoreDialogOpen] = useState(false);
  const [addMoreTab, setAddMoreTab] = useState<"upload" | "gallery">("upload");

  // Get derived state
  const selectedImages = editor.getSelectedImages();
  const activeImage = editor.getActiveImage();
  const hasImages = editor.state.images.length > 0;
  const hasSelectedImages = selectedImages.length > 0;
  const isInCropMode = activeImage !== null;

  // Close dialogs when route changes
  useEffect(() => {
    setSaveDialogOpen(false);
    setShowNewFolderInput(false);
    setAddMoreDialogOpen(false);
  }, [pathname]);

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
        title: tc("success"),
        description: `"${folder.name}" has been created.`,
      });
    } else {
      toast({
        title: tc("error"),
        description: "Failed to create folder.",
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  };

  // Handle multi-file upload
  const handleFilesSelect = useCallback((files: File[]) => {
    editor.addImages(files);
  }, [editor]);
  
  // Handle multi-file upload from Add More dialog
  const handleAddMoreFilesSelect = useCallback((files: File[]) => {
    editor.addImages(files);
    setAddMoreDialogOpen(false);
  }, [editor]);

  // Handle gallery select (adds single image)
  const handleGallerySelect = useCallback((imageUrl: string, imageName: string) => {
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], imageName, { type: blob.type || "image/png" });
        editor.addImages([file]);
        setActiveTab("upload");
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load image from gallery",
          variant: "destructive",
        });
      });
  }, [editor, toast]);
  
  // Handle gallery select from Add More dialog
  const handleAddMoreGallerySelect = useCallback((imageUrl: string, imageName: string) => {
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], imageName, { type: blob.type || "image/png" });
        editor.addImages([file]);
        setAddMoreDialogOpen(false);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load image from gallery",
          variant: "destructive",
        });
      });
  }, [editor, toast]);

  // Save selected images
  const handleSaveSelected = async () => {
    if (!user || selectedImages.length === 0) return;

    setIsSaving(true);
    let savedCount = 0;

    try {
      for (const img of selectedImages) {
        const response = await fetch(img.currentImage);
        const blob = await response.blob();
        
        const extension = img.mimeType.split("/")[1] || "png";
        const finalFileName = `${img.fileName || "image"}.${extension}`;
        const file = new File([blob], finalFileName, { type: img.mimeType });

        const dimensions = await getImageDimensions(file);
        const result = await saveFile(user.id, file, selectedFolderId, finalFileName, dimensions);

        if (result) {
          savedCount++;
        }
      }

      if (savedCount > 0) {
        const folderName = selectedFolderId 
          ? folders.find(f => f.id === selectedFolderId)?.name || "folder"
          : "root";
        toast({
          title: t("multiImage.saveSuccess"),
          description: t("multiImage.savedCount", { count: savedCount, folder: folderName }),
        });
        setSaveDialogOpen(false);
        setSelectedFolderId(null);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: tc("error"),
        description: "Failed to save images.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download selected images
  const handleDownloadSelected = () => {
    editor.downloadSelectedImages();
    toast({
      title: tc("download"),
      description: t("multiImage.downloadStarted", { count: selectedImages.length }),
    });
  };

  // Batch operation handlers with progress
  const handleBatchRotate = async (degrees: number) => {
    await editor.batchRotate(degrees);
    setPreviewRotation(0);
  };

  const handleBatchResize = async (width: number, height: number) => {
    await editor.batchResize(width, height);
  };

  const handleBatchCompress = async (targetSizeKB: number) => {
    const result = await editor.batchCompress(targetSizeKB);
    return result;
  };

  const handleBatchRemoveBackground = async (modelId?: string) => {
    setBatchProgress({ completed: 0, total: selectedImages.length, active: true });
    await editor.batchRemoveBackground(modelId, (completed, total) => {
      setBatchProgress({ completed, total, active: true });
    });
    setBatchProgress({ completed: 0, total: 0, active: false });
  };

  const handleBatchExtractLogo = async (modelId?: string, removeBackground?: boolean) => {
    setBatchProgress({ completed: 0, total: selectedImages.length, active: true });
    await editor.batchExtractLogo(modelId, removeBackground ?? extractLogoRemoveBg, (completed, total) => {
      setBatchProgress({ completed, total, active: true });
    });
    setBatchProgress({ completed: 0, total: 0, active: false });
  };

  const handleBatchRemoveLogo = async (modelId?: string) => {
    setBatchProgress({ completed: 0, total: selectedImages.length, active: true });
    await editor.batchRemoveLogo(modelId, (completed, total) => {
      setBatchProgress({ completed, total, active: true });
    });
    setBatchProgress({ completed: 0, total: 0, active: false });
  };

  // Exit crop mode
  const handleExitCropMode = () => {
    editor.setActiveImage(null);
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
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        {hasImages && (
          <div className="flex items-center gap-2">
            {hasSelectedImages && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelected}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {tc("download")} ({selectedImages.length})
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setSaveDialogOpen(true)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t("saveToGallery")} ({selectedImages.length})
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.clearAllImages()}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("multiImage.clearAll")}
            </Button>
          </div>
        )}
      </div>

      {/* Batch Progress Indicator */}
      {batchProgress.active && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span className="text-sm text-violet-300">
                {t("multiImage.processing")}
              </span>
            </div>
            <span className="text-sm text-violet-400">
              {batchProgress.completed} / {batchProgress.total}
            </span>
          </div>
          <Progress 
            value={(batchProgress.completed / batchProgress.total) * 100} 
            className="h-2"
          />
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Image Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!hasImages ? (
              // Upload Section
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
                      {t("uploadNew")}
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {t("fromGallery")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="m-0">
                    <ImageUploader 
                      onFilesSelect={handleFilesSelect}
                      multiple={true}
                    />
                  </TabsContent>

                  <TabsContent value="gallery" className="m-0">
                    <SavedImagesGallery
                      userId={user?.id || ""}
                      onSelect={handleGallerySelect}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : isInCropMode && activeImage ? (
              // Crop Mode - Single Image View
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key="crop-section"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExitCropMode}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {tc("back")}
                    </Button>
                    <h2 className="text-lg font-semibold text-white">
                      {t("multiImage.cropMode")}
                    </h2>
                    <Badge variant="outline">{activeImage.fileName}</Badge>
                  </div>
                </div>
                <ImagePreview
                  imageUrl={activeImage.currentImage}
                  isProcessing={activeImage.isProcessing}
                  onCrop={(x, y, width, height) => {
                    editor.cropActiveImage(x, y, width, height);
                  }}
                  previewRotation={previewRotation}
                />
              </motion.div>
            ) : (
              // Multi-Image Grid View
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key="grid-section"
                className="space-y-4"
              >
                {/* Add More Images Button */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{t("preview")}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMoreDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("multiImage.addMore")}
                  </Button>
                </div>

                <MultiImageGrid
                  images={editor.state.images}
                  activeImageId={editor.state.activeImageId}
                  onToggleSelection={editor.toggleImageSelection}
                  onSelectAll={editor.selectAllImages}
                  onDeselectAll={editor.deselectAllImages}
                  onSetActiveImage={editor.setActiveImage}
                  onUndoImage={editor.undoImageOperation}
                  onResetImage={editor.resetImage}
                  onRemoveImage={editor.removeImage}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Tool Panel */}
        <div className="space-y-6">
          {/* Info about selection */}
          {hasImages && !isInCropMode && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground">
                {hasSelectedImages 
                  ? t("multiImage.operateOnSelected", { count: selectedImages.length })
                  : t("multiImage.selectToOperate")}
              </p>
            </div>
          )}

          <ToolPanel
            hasImage={hasSelectedImages || isInCropMode}
            isProcessing={editor.state.globalProcessing}
            isAdmin={isAdmin}
            onRotate={handleBatchRotate}
            onResize={handleBatchResize}
            onCompress={handleBatchCompress}
            onExtractLogo={handleBatchExtractLogo}
            onRemoveBackground={handleBatchRemoveBackground}
            onRemoveLogo={handleBatchRemoveLogo}
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
              {t("multiImage.saveImages", { count: selectedImages.length })}
            </DialogTitle>
            <DialogDescription>
              {t("multiImage.saveDescription", { count: selectedImages.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                {t("saveToFolder")}
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
                          <span>{t("rootFolder")}</span>
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
                    {t("createNewFolder")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder={t("folderName")}
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
                      {isCreatingFolder ? "..." : tc("create")}
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
                    {tc("cancel")}
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
              {tc("cancel")}
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveSelected}
              disabled={isSaving || selectedImages.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("multiImage.saveCount", { count: selectedImages.length })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add More Dialog */}
      <Dialog open={addMoreDialogOpen} onOpenChange={setAddMoreDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-400" />
              {t("multiImage.addMoreTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("multiImage.addMoreDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs 
            value={addMoreTab} 
            onValueChange={(v) => setAddMoreTab(v as "upload" | "gallery")}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t("uploadNew")}
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {t("fromGallery")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="m-0 mt-4 flex-1">
              <ImageUploader 
                onFilesSelect={handleAddMoreFilesSelect}
                multiple={true}
              />
            </TabsContent>

            <TabsContent value="gallery" className="m-0 mt-4 flex-1 overflow-auto">
              <SavedImagesGallery
                userId={user?.id || ""}
                onSelect={handleAddMoreGallerySelect}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
