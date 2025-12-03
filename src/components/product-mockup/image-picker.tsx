"use client";

import { useCallback, useRef, useEffect, useState } from "react";
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
  type FileRecord,
  type FolderRecord,
} from "@/lib/supabase";
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
} from "lucide-react";

interface ImagePickerProps {
  title: string;
  icon?: React.ReactNode;
  selectedImage: string | null;
  onImageSelect: (dataUrl: string, mimeType: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ImagePicker({
  title,
  icon,
  selectedImage,
  onImageSelect,
  onClear,
  disabled = false,
}: ImagePickerProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery state
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");

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

  // File upload handler
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onImageSelect(result, file.type);
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onImageSelect]
  );

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
              Selected
            </div>
          </div>
        )}

        {/* Tab selection */}
        {!selectedImage && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="gallery" className="text-xs">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                Gallery
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                    Click to upload or drag & drop
                  </span>
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

                {currentFolderId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateBack}
                    className="h-6 px-1.5 ml-auto"
                    disabled={disabled}
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back
                  </Button>
                )}
              </div>

              {/* Gallery Content */}
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <LoadingSpinner size="md" />
                </div>
              ) : folders.length === 0 && files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {currentFolderId ? "Empty folder" : "No saved images"}
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

                      return (
                        <motion.div
                          key={file.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            !disabled && handleGallerySelect(fileUrl, file.mime_type)
                          }
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden",
                            "border border-border/50 hover:border-violet-500/50",
                            "bg-muted/30 transition-all cursor-pointer",
                            disabled && "opacity-50 pointer-events-none"
                          )}
                        >
                          <img
                            src={fileUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors" />
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Change button when image is selected */}
        {selectedImage && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onClear();
              setActiveTab("upload");
            }}
            disabled={disabled}
          >
            Change Image
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

