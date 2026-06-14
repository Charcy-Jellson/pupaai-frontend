"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Upload,
  ImageIcon,
  FolderOpen,
  ChevronRight,
  Home,
  ArrowLeft,
  X,
  Plus,
  Gem,
} from "lucide-react";
import {
  getUserFiles,
  getAllUserFolders,
  getFileUrl,
  createFolder,
  type FileRecord,
  type FolderRecord,
} from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { NailImage } from "@/types/nail-studio";
import { cn } from "@/lib/utils";

interface NailImagePickerProps {
  nailImages: NailImage[];
  selectedNailId: string | null;
  onAddImages: (images: { dataUrl: string; mimeType: string; name: string }[]) => void;
  onRemoveImage: (imageId: string) => void;
  onSelectNail: (imageId: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export function NailImagePicker({
  nailImages,
  selectedNailId,
  onAddImages,
  onRemoveImage,
  onSelectNail,
  onClearAll,
  disabled = false,
}: NailImagePickerProps) {
  const t = useTranslations("nailStudio.nailPicker");
  const tc = useTranslations("common");
  const { user } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload");

  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const processFiles = useCallback(
    (filesList: File[]) => {
      if (filesList.length === 0) return;

      const totalFiles = filesList.length;
      const newImages: { dataUrl: string; mimeType: string; name: string }[] = [];
      let loaded = 0;

      filesList.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push({
            dataUrl: reader.result as string,
            mimeType: file.type,
            name: file.name.replace(/\.[^/.]+$/, ""),
          });
          loaded += 1;
          if (loaded === totalFiles) {
            onAddImages(newImages);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [onAddImages]
  );

  const loadGalleryData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingGallery(true);

    try {
      const [allFolders, filesData] = await Promise.all([
        getAllUserFolders(user.id),
        getUserFiles(user.id, currentFolderId),
      ]);

      const childFolders = allFolders.filter(
        (f) => f.parent_id === currentFolderId
      );
      setFolders(childFolders);
      setFiles(filesData.filter((f) => f.mime_type?.startsWith("image/")));
    } catch {
      toast({
        title: tc("error"),
        description: t("failedToLoadGallery"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingGallery(false);
    }
  }, [user?.id, currentFolderId, toast, t, tc]);

  useEffect(() => {
    if (activeTab === "gallery") {
      loadGalleryData();
    }
  }, [activeTab, loadGalleryData]);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const filesList = e.target.files;
      if (!filesList || filesList.length === 0) return;

      const filesArray = Array.from(filesList);
      e.target.value = "";
      processFiles(filesArray);
    },
    [processFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      processFiles(droppedFiles);
    },
    [disabled, processFiles]
  );

  const handleFileSelect = useCallback(
    async (file: FileRecord) => {
      if (nailImages.some((item) => item.id === file.id)) {
        toast({
          title: t("alreadySelected"),
          description: t("alreadySelectedDesc"),
        });
        return;
      }

      const url = await getFileUrl(file.storage_path);
      if (url) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            onAddImages([
              {
                dataUrl: reader.result as string,
                mimeType: file.mime_type,
                name: file.name.replace(/\.[^/.]+$/, ""),
              },
            ]);
          };
          reader.readAsDataURL(blob);
        } catch {
          toast({
            title: tc("error"),
            description: t("failedToLoadImage"),
            variant: "destructive",
          });
        }
      }
    },
    [onAddImages, nailImages, toast, t, tc]
  );

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim() || !user?.id) return;

    setIsCreatingFolder(true);
    const folder = await createFolder(
      user.id,
      newFolderName.trim(),
      currentFolderId
    );

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
  }, [newFolderName, user?.id, currentFolderId, toast, t, tc]);

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
  }, []);

  const getBreadcrumb = useCallback(async (): Promise<FolderRecord[]> => {
    if (!user?.id || !currentFolderId) return [];

    const allFolders = await getAllUserFolders(user.id);
    const path: FolderRecord[] = [];
    let current = allFolders.find((f) => f.id === currentFolderId);

    while (current) {
      path.unshift(current);
      current = allFolders.find((f) => f.id === current?.parent_id);
    }

    return path;
  }, [user?.id, currentFolderId]);

  const [breadcrumb, setBreadcrumb] = useState<FolderRecord[]>([]);

  useEffect(() => {
    getBreadcrumb().then(setBreadcrumb);
  }, [getBreadcrumb]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Gem className="w-4 h-4 text-pink-400" />
            {t("title")}
            {nailImages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {t("selectedCount", { count: nailImages.length })}
              </Badge>
            )}
          </CardTitle>
          {nailImages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={disabled}
            >
              {t("clearAll")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Selected Items Preview */}
        {nailImages.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("selectedItems")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {nailImages.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "relative group w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                    item.id === selectedNailId
                      ? "border-pink-400 ring-1 ring-pink-400/50"
                      : "border-border/50 hover:border-pink-300"
                  )}
                  onClick={() => onSelectNail(item.id)}
                >
                  <img
                    src={item.imageDataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(item.id);
                    }}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "upload" | "gallery")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="w-3 h-3 mr-1" />
              {t("upload")}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              {t("gallery")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <label
              className={cn(
                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragging
                  ? "border-pink-400 bg-pink-400/10"
                  : "bg-muted/20 hover:bg-muted/40",
                disabled && "opacity-50 pointer-events-none"
              )}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={cn("w-6 h-6 mb-2", isDragging ? "text-pink-400" : "text-muted-foreground")} />
              <p className={cn("text-sm", isDragging ? "text-pink-400" : "text-muted-foreground")}>
                {isDragging ? t("dropHere") : t("clickToAdd")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("multipleSupported")}
              </p>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={disabled}
              />
            </label>
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            <div className="flex items-center gap-1 text-sm mb-3 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => navigateToFolder(null)}
              >
                <Home className="w-3 h-3" />
              </Button>
              {breadcrumb.map((folder) => (
                <div key={folder.id} className="flex items-center">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}
            </div>

            {!showNewFolder ? (
              <Button
                variant="outline"
                size="sm"
                className="mb-3 w-full"
                onClick={() => setShowNewFolder(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {t("newFolder")}
              </Button>
            ) : (
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder={t("folderName")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCreateFolder()
                  }
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                >
                  {tc("create")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                >
                  {tc("cancel")}
                </Button>
              </div>
            )}

            {currentFolderId && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 w-full justify-start"
                onClick={() => {
                  const parentFolder = breadcrumb[breadcrumb.length - 2];
                  navigateToFolder(parentFolder?.id || null);
                }}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                {tc("back")}
              </Button>
            )}

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {isLoadingGallery ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {tc("loading")}
                </div>
              ) : (
                <>
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigateToFolder(folder.id)}
                    >
                      <FolderOpen className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                  ))}

                  <div className="grid grid-cols-3 gap-2">
                    {files.map((file) => {
                      const isSelected = nailImages.some(
                        (item) => item.id === file.id
                      );
                      return (
                        <div
                          key={file.id}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                            isSelected
                              ? "ring-2 ring-pink-400 opacity-50"
                              : "hover:ring-2 hover:ring-pink-400"
                          )}
                          onClick={() => handleFileSelect(file)}
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pupa-ai-media/${file.storage_path}`}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Badge variant="secondary" className="text-xs">
                                {t("selected")}
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {folders.length === 0 && files.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      {t("noFilesFound")}
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
