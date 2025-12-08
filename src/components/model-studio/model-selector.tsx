"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Upload,
  ImageIcon,
  FolderOpen,
  Folder,
  ChevronRight,
  Home,
  ArrowLeft,
  X,
  Plus,
  User,
  Sparkles,
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
import { ModelSourceType } from "@/types/model-studio";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedImage: string | null;
  modelSource: ModelSourceType;
  onSourceChange: (source: ModelSourceType) => void;
  onImageSelect: (image: string, mimeType?: string) => void;
  onClear: () => void;
  disabled?: boolean;
  children?: React.ReactNode; // For model generator component
}

export function ModelSelector({
  selectedImage,
  modelSource,
  onSourceChange,
  onImageSelect,
  onClear,
  disabled = false,
  children,
}: ModelSelectorProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Gallery states
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  
  // New folder states
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Load gallery data
  const loadGalleryData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingGallery(true);
    
    try {
      const [allFolders, filesData] = await Promise.all([
        getAllUserFolders(user.id),
        getUserFiles(user.id, currentFolderId),
      ]);

      // Filter folders to show only children of current folder
      const childFolders = allFolders.filter(
        (f) => f.parent_id === currentFolderId
      );
      setFolders(childFolders);
      setFiles(filesData.filter((f) => f.mime_type?.startsWith("image/")));
    } catch {
      toast({
        title: "Error",
        description: "Failed to load gallery",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGallery(false);
    }
  }, [user?.id, currentFolderId, toast]);

  useEffect(() => {
    if (modelSource === "gallery") {
      loadGalleryData();
    }
  }, [modelSource, loadGalleryData]);

  // Handle file upload
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelect(reader.result as string, file.type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [onImageSelect]);

  // Handle gallery file selection
  const handleFileSelect = useCallback(async (file: FileRecord) => {
    const url = await getFileUrl(file.storage_path);
    if (url) {
      // Convert to data URL
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelect(reader.result as string, file.mime_type);
        };
        reader.readAsDataURL(blob);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load image",
          variant: "destructive",
        });
      }
    }
  }, [onImageSelect, toast]);

  // Create new folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim() || !user?.id) return;
    
    setIsCreatingFolder(true);
    const folder = await createFolder(user.id, newFolderName.trim(), currentFolderId);
    
    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast({
        title: "Folder created",
        description: `"${folder.name}" has been created`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  }, [newFolderName, user?.id, currentFolderId, toast]);

  // Navigate to folder
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
  }, []);

  // Get breadcrumb path
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

  if (selectedImage) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Model Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg overflow-hidden bg-muted/30 border border-border/50">
            <img
              src={selectedImage}
              alt="Selected model"
              className="w-full h-auto object-contain max-h-[300px]"
            />
            {!disabled && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={onClear}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          Select Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={modelSource} onValueChange={(v) => onSourceChange(v as ModelSourceType)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Generate
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-0">
            <label
              className={cn(
                "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer",
                "bg-muted/20 hover:bg-muted/40 transition-colors",
                disabled && "opacity-50 pointer-events-none"
              )}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload model image
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP supported
              </p>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
                disabled={disabled}
              />
            </label>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm mb-3 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => navigateToFolder(null)}
              >
                <Home className="w-3 h-3" />
              </Button>
              {breadcrumb.map((folder, index) => (
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

            {/* New Folder Button */}
            {!showNewFolder ? (
              <Button
                variant="outline"
                size="sm"
                className="mb-3 w-full"
                onClick={() => setShowNewFolder(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Folder
              </Button>
            ) : (
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                >
                  Create
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
                  Cancel
                </Button>
              </div>
            )}

            {/* Back button */}
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
                Back
              </Button>
            )}

            {/* Content */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {isLoadingGallery ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Loading...
                </div>
              ) : (
                <>
                  {/* Folders */}
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

                  {/* Files */}
                  <div className="grid grid-cols-3 gap-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => handleFileSelect(file)}
                      >
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pupa-ai-media/${file.storage_path}`}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {folders.length === 0 && files.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No files found
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="mt-0">
            {children}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}





