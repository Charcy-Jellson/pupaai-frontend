"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  ChevronRight,
  Home,
  ArrowLeft,
  Plus,
  Check,
} from "lucide-react";
import {
  getAllUserFolders,
  createFolder,
  type FolderRecord,
} from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SelectFolderDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFolder: (folderId: string | null) => void;
}

export function SelectFolderDialog({
  userId,
  open,
  onOpenChange,
  onSelectFolder,
}: SelectFolderDialogProps) {
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New folder states
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const [breadcrumb, setBreadcrumb] = useState<FolderRecord[]>([]);

  // Load folders
  const loadFolders = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const allFolders = await getAllUserFolders(userId);
      setFolders(allFolders);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (open) {
      loadFolders();
      setCurrentFolderId(null);
      setSelectedFolderId(null);
    }
  }, [open, loadFolders]);

  // Update breadcrumb when current folder changes
  useEffect(() => {
    if (!currentFolderId) {
      setBreadcrumb([]);
      return;
    }
    
    const path: FolderRecord[] = [];
    let current = folders.find((f) => f.id === currentFolderId);
    
    while (current) {
      path.unshift(current);
      current = folders.find((f) => f.id === current?.parent_id);
    }
    
    setBreadcrumb(path);
  }, [currentFolderId, folders]);

  // Get children of current folder
  const childFolders = folders.filter((f) => f.parent_id === currentFolderId);

  // Create new folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim() || !userId) return;
    
    setIsCreatingFolder(true);
    const folder = await createFolder(userId, newFolderName.trim(), currentFolderId);
    
    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setNewFolderName("");
      setShowNewFolder(false);
      setSelectedFolderId(folder.id);
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
  }, [newFolderName, userId, currentFolderId, toast]);

  const handleConfirm = useCallback(() => {
    // If no folder is explicitly selected, use the current folder (or root)
    onSelectFolder(selectedFolderId ?? currentFolderId);
    onOpenChange(false);
  }, [selectedFolderId, currentFolderId, onSelectFolder, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Folder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
            <Button
              variant={currentFolderId === null && selectedFolderId === null ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 shrink-0"
              onClick={() => {
                setCurrentFolderId(null);
                setSelectedFolderId(null);
              }}
            >
              <Home className="w-3 h-3 mr-1" />
              Root
            </Button>
            {breadcrumb.map((folder) => (
              <div key={folder.id} className="flex items-center shrink-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <Button
                  variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setCurrentFolderId(folder.id);
                    setSelectedFolderId(folder.id);
                  }}
                >
                  {folder.name}
                </Button>
              </div>
            ))}
          </div>

          {/* New Folder */}
          {!showNewFolder ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowNewFolder(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              New Folder
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
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
              className="w-full justify-start"
              onClick={() => {
                const parentFolder = breadcrumb[breadcrumb.length - 2];
                setCurrentFolderId(parentFolder?.id || null);
                setSelectedFolderId(parentFolder?.id || null);
              }}
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back
            </Button>
          )}

          {/* Folders List */}
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Loading...
              </div>
            ) : childFolders.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                {currentFolderId
                  ? "No subfolders"
                  : "No folders yet. Create one above."}
              </div>
            ) : (
              childFolders.map((folder) => (
                <button
                  key={folder.id}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-lg text-left transition-colors",
                    selectedFolderId === folder.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedFolderId(folder.id)}
                  onDoubleClick={() => {
                    setCurrentFolderId(folder.id);
                    setSelectedFolderId(folder.id);
                  }}
                >
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm flex-1">{folder.name}</span>
                  {selectedFolderId === folder.id && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Double-click to open folder. Click to select destination.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Save Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

