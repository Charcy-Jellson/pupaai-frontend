"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  getUserFiles,
  getAllUserFolders,
  getFileUrl,
  createFolder,
  saveFileFromDataUrl,
  type FileRecord,
  type FolderRecord,
} from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  ImageIcon,
  FolderOpen,
  Folder,
  ChevronRight,
  Home,
  ArrowLeft,
  X,
  Check,
  Plus,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImagePickerProps {
  title: string;
  icon?: React.ReactNode;
  selectedImage: string | null;
  selectedMimeType?: string;
  onImageSelect: (dataUrl: string, mimeType: string) => void;
  onClear: () => void;
  disabled?: boolean;
  /** Allow saving the selected image to Gallery */
  allowSaveToGallery?: boolean;
  /** Enable multi-select mode */
  multiSelect?: boolean;
  /** Callback for multi-select mode */
  onMultiImageSelect?: (images: { dataUrl: string; mimeType: string }[]) => void;
  /** Number of already selected items (for multi-select mode display) */
  selectedCount?: number;
}

export function ImagePicker({
  title,
  icon,
  selectedImage,
  selectedMimeType = "image/png",
  onImageSelect,
  onClear,
  disabled = false,
  allowSaveToGallery = false,
  multiSelect = false,
  onMultiImageSelect,
  selectedCount = 0,
}: ImagePickerProps) {
  const t = useTranslations("productMockup.imagePicker");
  const tc = useTranslations("common");
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Multi-select state for gallery
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileData, setSelectedFileData] = useState<Map<string, { url: string; mimeType: string }>>(new Map());

  // Gallery state
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");

  // New folder state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Save to Gallery dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveFolderId, setSaveFolderId] = useState<string | null>(null);
  const [saveFolderPath, setSaveFolderPath] = useState<FolderRecord[]>([]);
  const [saveFolders, setSaveFolders] = useState<FolderRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveNewFolder, setShowSaveNewFolder] = useState(false);
  const [saveNewFolderName, setSaveNewFolderName] = useState("");

  // Load gallery content
  useEffect(() => {
    if (user?.id && activeTab === "gallery") {
      loadGalleryContent();
    }
  }, [user?.id, currentFolderId, activeTab]);

  const loadGalleryContent = async () => {
    if (!user?.id) return;

    setLoading(true);
    const [userFolders, userFiles] = await Promise.all([
      getAllUserFolders(user.id),
      getUserFiles(user.id, currentFolderId),
    ]);

    const currentFolders = userFolders.filter((f) => f.parent_id === currentFolderId);
    setFolders(currentFolders);
    setFiles(userFiles);
    setLoading(false);
  };

  // File upload handler (supports multi-select)
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) return;

      if (multiSelect && onMultiImageSelect) {
        // Multi-select mode: process all files
        const results: { dataUrl: string; mimeType: string }[] = [];
        
        for (const file of imageFiles) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsDataURL(file);
          });
          results.push({ dataUrl, mimeType: file.type });
        }
        
        onMultiImageSelect(results);
      } else {
        // Single select mode: use first file
        const file = imageFiles[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          onImageSelect(result, file.type);
        };
        reader.readAsDataURL(file);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onImageSelect, onMultiImageSelect, multiSelect]
  );

  // Toggle file selection in gallery (multi-select mode)
  const toggleFileSelection = useCallback((fileId: string, fileUrl: string, mimeType: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
        setSelectedFileData((prevData) => {
          const newData = new Map(prevData);
          newData.delete(fileId);
          return newData;
        });
      } else {
        newSet.add(fileId);
        setSelectedFileData((prevData) => {
          const newData = new Map(prevData);
          newData.set(fileId, { url: fileUrl, mimeType });
          return newData;
        });
      }
      return newSet;
    });
  }, []);

  // Confirm multi-selection from gallery
  const confirmMultiSelection = useCallback(async () => {
    if (!onMultiImageSelect || selectedFiles.size === 0) return;

    setLoading(true);
    const results: { dataUrl: string; mimeType: string }[] = [];

    for (const [, { url, mimeType }] of selectedFileData) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        results.push({ dataUrl, mimeType: mimeType || blob.type });
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    }

    onMultiImageSelect(results);
    setSelectedFiles(new Set());
    setSelectedFileData(new Map());
    setLoading(false);
  }, [onMultiImageSelect, selectedFiles, selectedFileData]);

  // Gallery navigation
  const navigateToFolder = (folder: FolderRecord) => {
    setFolderPath((prev) => [...prev, folder]);
    setCurrentFolderId(folder.id);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!user?.id || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    const folder = await createFolder(user.id, newFolderName.trim(), currentFolderId);

    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast({
        title: t("folderCreated"),
        description: t("folderCreatedDesc", { name: folder.name }),
      });
    } else {
      toast({
        title: tc("error"),
        description: t("failedToCreateFolder"),
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  };

  // Load folders for save dialog
  const loadSaveFolders = async () => {
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter((f) => f.parent_id === saveFolderId);
    setSaveFolders(currentFolders);
  };

  // Open save dialog
  const openSaveDialog = async () => {
    setSaveDialogOpen(true);
    setSaveFolderId(null);
    setSaveFolderPath([]);
    await loadSaveFolders();
  };

  // Navigate in save dialog
  const navigateToSaveFolder = async (folder: FolderRecord) => {
    setSaveFolderPath((prev) => [...prev, folder]);
    setSaveFolderId(folder.id);
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter((f) => f.parent_id === folder.id);
    setSaveFolders(currentFolders);
  };

  const navigateSaveBack = async () => {
    const newPath = [...saveFolderPath];
    newPath.pop();
    setSaveFolderPath(newPath);
    const newFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setSaveFolderId(newFolderId);
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter((f) => f.parent_id === newFolderId);
    setSaveFolders(currentFolders);
  };

  const navigateSaveToRoot = async () => {
    setSaveFolderPath([]);
    setSaveFolderId(null);
    await loadSaveFolders();
  };

  // Create folder in save dialog
  const handleCreateSaveFolder = async () => {
    if (!user?.id || !saveNewFolderName.trim()) return;

    setIsCreatingFolder(true);
    const folder = await createFolder(user.id, saveNewFolderName.trim(), saveFolderId);

    if (folder) {
      setSaveFolders((prev) => [...prev, folder]);
      setSaveNewFolderName("");
      setShowSaveNewFolder(false);
      toast({
        title: t("folderCreated"),
        description: t("folderCreatedDesc", { name: folder.name }),
      });
    } else {
      toast({
        title: tc("error"),
        description: t("failedToCreateFolder"),
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  };

  // Save image to Gallery
  const handleSaveToGallery = async () => {
    if (!user?.id || !selectedImage) return;

    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const ext = selectedMimeType.includes("png") ? "png" : "jpg";
      const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${timestamp}.${ext}`;

      const saved = await saveFileFromDataUrl(
        user.id,
        selectedImage,
        filename,
        saveFolderId
      );

      if (saved) {
        toast({
          title: t("savedToGallery"),
          description: t("savedToGalleryDesc", { name: filename }),
        });
        setSaveDialogOpen(false);
      } else {
        toast({
          title: tc("error"),
          description: t("failedToSave"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving image:", error);
      toast({
        title: tc("error"),
        description: t("failedToSave"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle gallery image selection - convert URL to data URL
  const handleGallerySelect = async (fileUrl: string, mimeType: string) => {
    try {
      setLoading(true);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      onImageSelect(dataUrl, mimeType || blob.type);
    } catch (error) {
      console.error("Failed to load image from gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon || <ImageIcon className="w-4 h-4 text-violet-400" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Selected image preview */}
        {selectedImage && (
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted/30 border border-border/50">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-full object-contain"
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7"
              onClick={onClear}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-green-500/90 text-white text-xs flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t("selected")}
            </div>
          </div>
        )}

        {/* Tab selection */}
        {!selectedImage && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {t("upload")}
              </TabsTrigger>
              <TabsTrigger value="gallery" className="text-xs">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                {t("gallery")}
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={multiSelect}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 hover:border-violet-500/50 hover:bg-violet-500/5"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {multiSelect ? t("clickToUploadMultiple") : t("clickToUpload")}
                  </span>
                  {multiSelect && selectedCount > 0 && (
                    <span className="text-xs text-violet-400">
                      {t("itemsSelected", { count: selectedCount })}
                    </span>
                  )}
                </div>
              </Button>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="mt-0">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1 mb-2 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateToRoot}
                  className="h-6 px-1.5"
                  disabled={disabled}
                >
                  <Home className="w-3 h-3" />
                </Button>

                {folderPath.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-0.5">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newPath = folderPath.slice(0, index + 1);
                        setFolderPath(newPath);
                        setCurrentFolderId(folder.id);
                      }}
                      className="h-6 px-1.5 text-xs"
                      disabled={disabled}
                    >
                      {folder.name}
                    </Button>
                  </div>
                ))}

                <div className="flex-1" />

                {currentFolderId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateBack}
                    className="h-6 px-1.5"
                    disabled={disabled}
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    {tc("back")}
                  </Button>
                )}

                {/* New folder button */}
                {!showNewFolder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewFolder(true)}
                    className="h-6 px-1.5"
                    disabled={disabled}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t("new")}
                  </Button>
                )}
              </div>

              {/* New folder input */}
              {showNewFolder && (
                <div className="flex gap-1 mb-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder={t("folderName")}
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") {
                        setShowNewFolder(false);
                        setNewFolderName("");
                      }
                    }}
                    autoFocus
                    disabled={disabled || isCreatingFolder}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || isCreatingFolder || disabled}
                    className="h-7 text-xs px-2"
                  >
                    {isCreatingFolder ? "..." : "OK"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName("");
                    }}
                    className="h-7 text-xs px-2"
                    disabled={isCreatingFolder}
                  >
                    ✕
                  </Button>
                </div>
              )}

              {/* Gallery Content */}
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <LoadingSpinner size="md" />
                </div>
              ) : folders.length === 0 && files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {currentFolderId ? t("emptyFolder") : t("noSavedImages")}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <div className="grid grid-cols-3 gap-2 pr-3">
                    {/* Folders */}
                    {folders.map((folder) => (
                      <motion.div
                        key={folder.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !disabled && navigateToFolder(folder)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border border-border/50",
                          "bg-muted/30 hover:bg-muted/50 hover:border-violet-500/50",
                          "transition-all cursor-pointer",
                          disabled && "opacity-50 pointer-events-none"
                        )}
                      >
                        <Folder className="w-6 h-6 text-violet-400" />
                        <span className="text-[10px] text-center truncate w-full">
                          {folder.name}
                        </span>
                      </motion.div>
                    ))}

                    {/* Files */}
                    {files.map((file) => {
                      const fileUrl = getFileUrl(file.storage_path);
                      const isSelected = selectedFiles.has(file.id);

                      return (
                        <motion.div
                          key={file.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (disabled) return;
                            if (multiSelect) {
                              toggleFileSelection(file.id, fileUrl, file.mime_type);
                            } else {
                              handleGallerySelect(fileUrl, file.mime_type);
                            }
                          }}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden",
                            "border-2 transition-all cursor-pointer",
                            isSelected 
                              ? "border-violet-500 ring-2 ring-violet-500/30" 
                              : "border-border/50 hover:border-violet-500/50",
                            "bg-muted/30",
                            disabled && "opacity-50 pointer-events-none"
                          )}
                        >
                          <img
                            src={fileUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors" />
                          {multiSelect && (
                            <div className={cn(
                              "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center",
                              isSelected ? "bg-violet-500" : "bg-black/50 border border-white/30"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Confirm multi-selection button */}
              {multiSelect && selectedFiles.size > 0 && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={confirmMultiSelection}
                    disabled={disabled || loading}
                    className="flex-1 bg-violet-500 hover:bg-violet-600"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {t("addSelected", { count: selectedFiles.size })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles(new Set());
                      setSelectedFileData(new Map());
                    }}
                    disabled={disabled}
                  >
                    {tc("clear")}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Action buttons when image is selected */}
        {selectedImage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onClear();
                setActiveTab("upload");
              }}
              disabled={disabled}
            >
              {t("changeImage")}
            </Button>
            {allowSaveToGallery && (
              <Button
                variant="outline"
                size="sm"
                onClick={openSaveDialog}
                disabled={disabled}
                className="gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {tc("save")}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Save to Gallery Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-violet-400" />
              {t("saveToGalleryTitle")}
            </DialogTitle>
          </DialogHeader>

          {/* Folder Navigation */}
          <div className="space-y-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateSaveToRoot}
                className="h-7 px-2"
              >
                <Home className="w-3.5 h-3.5" />
              </Button>

              {saveFolderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPath = saveFolderPath.slice(0, index + 1);
                      setSaveFolderPath(newPath);
                      setSaveFolderId(folder.id);
                      if (user?.id) {
                        getAllUserFolders(user.id).then((userFolders) => {
                          const currentFolders = userFolders.filter((f) => f.parent_id === folder.id);
                          setSaveFolders(currentFolders);
                        });
                      }
                    }}
                    className="h-7 px-2 text-sm"
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}

              <div className="flex-1" />

              {saveFolderId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateSaveBack}
                  className="h-7 px-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  {tc("back")}
                </Button>
              )}
            </div>

            {/* New folder button */}
            {!showSaveNewFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveNewFolder(true)}
                className="gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("newFolder")}
              </Button>
            )}

            {/* New folder input */}
            {showSaveNewFolder && (
              <div className="flex gap-2">
                <Input
                  value={saveNewFolderName}
                  onChange={(e) => setSaveNewFolderName(e.target.value)}
                  placeholder={t("folderName")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSaveFolder();
                    if (e.key === "Escape") {
                      setShowSaveNewFolder(false);
                      setSaveNewFolderName("");
                    }
                  }}
                  autoFocus
                  disabled={isCreatingFolder}
                />
                <Button
                  size="sm"
                  onClick={handleCreateSaveFolder}
                  disabled={!saveNewFolderName.trim() || isCreatingFolder}
                >
                  {isCreatingFolder ? "..." : tc("create")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSaveNewFolder(false);
                    setSaveNewFolderName("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Folders list */}
            <ScrollArea className="h-48 border rounded-lg p-2">
              <div className="space-y-1">
                {saveFolders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <FolderOpen className="w-8 h-8 mb-2" />
                    <p className="text-sm">
                      {saveFolderId ? t("emptyFolder") : t("noFolders")}
                    </p>
                    <p className="text-xs mt-1">
                      {t("saveToLocation", { location: saveFolderPath.length > 0 ? saveFolderPath[saveFolderPath.length - 1].name : t("root") })}
                    </p>
                  </div>
                ) : (
                  saveFolders.map((folder) => (
                    <motion.div
                      key={folder.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => navigateToSaveFolder(folder)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        "border border-border/50 hover:border-violet-500/50",
                        "bg-muted/30 hover:bg-muted/50",
                        "transition-all cursor-pointer"
                      )}
                    >
                      <Folder className="w-5 h-5 text-violet-400" />
                      <span className="text-sm">{folder.name}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Current save location */}
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              <span className="font-medium">{t("saveTo")}: </span>
              {saveFolderPath.length > 0
                ? saveFolderPath.map((f) => f.name).join(" / ")
                : t("rootFolder")}
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
            <Button onClick={handleSaveToGallery} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t("saveHere")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
