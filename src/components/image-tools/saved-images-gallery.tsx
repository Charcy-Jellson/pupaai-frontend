"use client";

import { useEffect, useState } from "react";
import { 
  getUserFiles, 
  getAllUserFolders,
  getFileUrl, 
  deleteFile,
  createFolder,
  type FileRecord, 
  type FolderRecord 
} from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { 
  Trash2, 
  FolderOpen, 
  Folder,
  ChevronRight,
  Home,
  Plus,
  ArrowLeft
} from "lucide-react";

interface SavedImagesGalleryProps {
  userId: string;
  onSelect: (imageUrl: string, imageName: string) => void;
}

export function SavedImagesGallery({ userId, onSelect }: SavedImagesGalleryProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New folder
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadContent();
    }
  }, [userId, currentFolderId]);

  const loadContent = async () => {
    setLoading(true);
    
    // Load folders and files for current location
    const [userFolders, userFiles] = await Promise.all([
      getAllUserFolders(userId),
      getUserFiles(userId, currentFolderId)
    ]);
    
    // Filter folders to show only those in current directory
    const currentFolders = userFolders.filter(f => f.parent_id === currentFolderId);
    
    setFolders(currentFolders);
    setFiles(userFiles);
    setLoading(false);
  };

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    const folder = await createFolder(userId, newFolderName.trim(), currentFolderId);
    
    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setNewFolderName("");
      setShowNewFolder(false);
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

  const handleDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    const success = await deleteFile(fileToDelete.id, fileToDelete.storage_path);
    
    if (success) {
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      toast({
        title: "File Deleted",
        description: "The file has been removed.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        {currentFolderId ? "This folder is empty" : "No files yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Upload and save images to access them from your gallery.
      </p>
    </div>
  );

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToRoot}
              className="h-8 px-2"
            >
              <Home className="w-4 h-4" />
            </Button>
            
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolderId(folder.id);
                  }}
                  className="h-8 px-2"
                >
                  {folder.name}
                </Button>
              </div>
            ))}
            
            <div className="flex-1" />
            
            {/* Back button */}
            {currentFolderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={navigateBack}
                className="h-8"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            {/* New folder button */}
            {!showNewFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolder(true)}
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Folder
              </Button>
            )}
          </div>

          {/* New folder input */}
          {showNewFolder && (
            <div className="flex gap-2 mb-4">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
              >
                {isCreatingFolder ? "..." : "Create"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-4">
                {/* Folders */}
                {folders.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-violet-500/50 transition-all cursor-pointer"
                      >
                        <Folder className="w-10 h-10 text-violet-400" />
                        <span className="text-sm font-medium text-center truncate w-full">
                          {folder.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Files */}
                {files.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((file) => {
                      const fileUrl = getFileUrl(file.storage_path);
                      
                      return (
                        <div
                          key={file.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border/50 hover:border-violet-500/50 transition-all cursor-pointer"
                          onClick={() => onSelect(fileUrl, file.name)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              src={fileUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-sm font-medium text-white truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                                <span>{formatBytes(file.size)}</span>
                                {file.width && file.height && (
                                  <>
                                    <span>•</span>
                                    <span>{file.width}×{file.height}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileToDelete(file);
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
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.name}&quot;? 
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
