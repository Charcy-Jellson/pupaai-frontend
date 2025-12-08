"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  ImageIcon,
  FolderOpen,
  ChevronRight,
  Home,
  ArrowLeft,
  X,
  Plus,
  Shirt,
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
import { ClothingItem } from "@/types/model-studio";
import { cn } from "@/lib/utils";

interface ClothingPickerProps {
  selectedItems: ClothingItem[];
  onAddItem: (item: ClothingItem) => void;
  onRemoveItem: (itemId: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export function ClothingPicker({
  selectedItems,
  onAddItem,
  onRemoveItem,
  onClearAll,
  disabled = false,
}: ClothingPickerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload");
  
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
    if (activeTab === "gallery") {
      loadGalleryData();
    }
  }, [activeTab, loadGalleryData]);

  // Handle file upload
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newItem: ClothingItem = {
        id: `upload-${Date.now()}`,
        imageDataUrl: reader.result as string,
        mimeType: file.type,
        name: file.name.replace(/\.[^/.]+$/, ""),
      };
      onAddItem(newItem);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [onAddItem]);

  // Handle gallery file selection
  const handleFileSelect = useCallback(async (file: FileRecord) => {
    // Check if already selected
    if (selectedItems.some((item) => item.id === file.id)) {
      toast({
        title: "Already selected",
        description: "This item is already in your selection",
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
          const newItem: ClothingItem = {
            id: file.id,
            imageDataUrl: reader.result as string,
            mimeType: file.mime_type,
            name: file.name.replace(/\.[^/.]+$/, ""),
          };
          onAddItem(newItem);
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
  }, [onAddItem, selectedItems, toast]);

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

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="w-4 h-4 text-blue-400" />
            Select Clothing
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedItems.length} selected
              </Badge>
            )}
          </CardTitle>
          {selectedItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={disabled}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Selected Items Preview */}
        {selectedItems.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Selected Items
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border/50"
                >
                  <img
                    src={item.imageDataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "gallery")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              Gallery
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-0">
            <label
              className={cn(
                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                "bg-muted/20 hover:bg-muted/40 transition-colors",
                disabled && "opacity-50 pointer-events-none"
              )}
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to add clothing
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Multiple items supported
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
                    {files.map((file) => {
                      const isSelected = selectedItems.some((item) => item.id === file.id);
                      return (
                        <div
                          key={file.id}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                            isSelected
                              ? "ring-2 ring-primary opacity-50"
                              : "hover:ring-2 hover:ring-primary"
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
                                Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Add Label component since it's used
function Label({ className, children, ...props }: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>
      {children}
    </label>
  );
}





